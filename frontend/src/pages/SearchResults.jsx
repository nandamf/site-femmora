import React from "react";
import { Navigate, useSearchParams } from "react-router-dom";

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  return <Navigate to={`/produtos?q=${encodeURIComponent(q)}`} replace />;
}
