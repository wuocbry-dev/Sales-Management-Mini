import { Navigate } from "react-router-dom";
import { resolveDefaultLandingPath } from "@/app/default-landing";
import { useAuthStore } from "@/features/auth/auth-store";

export function AppIndexRedirect() {
  const me = useAuthStore((s) => s.me);
  if (!me) {
    return null;
  }
  return <Navigate to={resolveDefaultLandingPath(me)} replace />;
}
