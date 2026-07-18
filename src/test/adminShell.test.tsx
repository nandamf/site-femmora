// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRoute from "@/components/AdminRoute";
import AdminHome from "@/pages/AdminHome";
import AdminSidebar from "@/modules/admin/AdminSidebar";
import { adminNavigation, filterAdminNavigation } from "@/modules/admin/navigation";

expect.extend(toHaveNoViolations);

const mocks = vi.hoisted(() => ({
  auth: { isAuthenticated: true, isLoadingAuth: false },
  access: {
    data: { isAdmin: true, roles: ["superadmin"], permissions: ["admin.access"] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}));

vi.mock("@/lib/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/hooks/useAdminAccess", () => ({ useAdminAccess: () => mocks.access }));

describe("admin navigation permissions", () => {
  it("shows only entries whose permission is present", () => {
    expect(filterAdminNavigation(adminNavigation, [])).toEqual([]);
    expect(filterAdminNavigation(adminNavigation, ["admin.access"])[0]?.items[0]?.href).toBe(
      "/admin",
    );
  });
});

describe("AdminRoute", () => {
  beforeEach(() => {
    mocks.auth.isAuthenticated = true;
    mocks.auth.isLoadingAuth = false;
    mocks.access.data = {
      isAdmin: true,
      roles: ["superadmin"],
      permissions: ["admin.access"],
    };
    mocks.access.isLoading = false;
    mocks.access.isError = false;
  });

  function renderRoute() {
    return render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<p>Conteúdo protegido</p>} />
          </Route>
          <Route path="/login" element={<p>Login</p>} />
          <Route path="/acesso-negado" element={<p>Acesso negado</p>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("renders protected content for authorized administrators", () => {
    renderRoute();
    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    mocks.auth.isAuthenticated = false;
    renderRoute();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("redirects authenticated users without admin access", () => {
    mocks.access.data = { isAdmin: false, roles: [], permissions: [] };
    renderRoute();
    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
  });

  it("shows a recoverable error when permission lookup fails", () => {
    mocks.access.isError = true;
    renderRoute();
    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao validar permissões");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(mocks.access.refetch).toHaveBeenCalled();
  });
});

describe("admin shell accessibility", () => {
  it("has no automated accessibility violations in the empty dashboard", async () => {
    const { container } = render(<AdminHome />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("exposes semantic desktop and mobile navigation", async () => {
    const sections = filterAdminNavigation(adminNavigation, ["admin.access"]);
    const { container } = render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminSidebar sections={sections} mobileOpen onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("dialog", { name: "Menu administrativo" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação administrativa principal" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação administrativa móvel" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
