import axios from "axios";

const BASE = import.meta.env.REACT_APP_BACKEND_URL || "";

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function apiErrorMessage(detail) {
  if (detail == null) return "Algo deu errado. Tente novamente.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default api;
