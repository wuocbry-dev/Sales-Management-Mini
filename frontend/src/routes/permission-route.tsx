import type { ReactNode } from "react";
import { Navigate, useLocation, useMatches } from "react-router-dom";
import { FORBIDDEN_ROUTE, resolveDefaultLandingPath } from "@/app/default-landing";
import { useAuthStore } from "@/features/auth/auth-store";
import type { AppRouteHandle } from "@/routes/app-route-handles";

type Props = {
  children: ReactNode;
};

/**
 * Guard theo quyền: đọc `requireAccess` từ `handle` của route hiện tại (khớp `@PreAuthorize` / quyền JWT).
 */
export function PermissionRoute({ children }: Props) {
  const me = useAuthStore((s) => s.me);
  const location = useLocation();
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const handle = (leaf?.handle ?? {}) as AppRouteHandle;
  const gate = handle.requireAccess;

  if (!me) {
    return null;
  }

  if (gate && !gate(me)) {
    const fallback = resolveDefaultLandingPath(me);
    if (fallback !== location.pathname) {
      return <Navigate to={fallback} replace />;
    }
    return <Navigate to={FORBIDDEN_ROUTE} replace />;
  }

  return <>{children}</>;
}
