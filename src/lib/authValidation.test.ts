import { describe, expect, it } from "vitest";
import { getAuthErrorMessage, validatePassword } from "./authValidation";

describe("validatePassword", () => {
  it("rejeita senhas com menos de oito caracteres", () => {
    expect(validatePassword("1234567")).toContain("8 caracteres");
  });

  it("aceita senhas com oito ou mais caracteres", () => {
    expect(validatePassword("12345678")).toBeNull();
  });
});

describe("getAuthErrorMessage", () => {
  it("traduz credenciais inválidas sem vazar detalhes técnicos", () => {
    expect(getAuthErrorMessage(new Error("Invalid login credentials"))).toBe(
      "E-mail ou senha inválidos.",
    );
  });

  it("usa uma mensagem segura para erros desconhecidos", () => {
    expect(getAuthErrorMessage(new Error("internal database detail"))).toBe(
      "Não foi possível concluir a operação. Tente novamente.",
    );
  });
});
