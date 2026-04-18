import { Navigate } from "react-router-dom";
import { resolveDefaultLandingPath } from "@/app/default-landing";
import { useAuthStore } from "@/features/auth/auth-store";
import { AppLoadingShell } from "@/layouts/app-loading-shell";

export function AppIndexRedirect() {
  const me = useAuthStore((s) => s.me);
  if (!me) {
    return <AppLoadingShell />;
  }
  return <Navigate to={resolveDefaultLandingPath(me)} replace />;
}
