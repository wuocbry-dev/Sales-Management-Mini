import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import { getMe } from "@/api/auth-api";
import { useAuthStore } from "@/features/auth/auth-store";
import { AppLoadingShell } from "@/layouts/app-loading-shell";
import { queryClient } from "@/lib/query-client";

/**
 * Bảo vệ phiên đăng nhập: khôi phục token, gọi `/api/auth/me`, token không hợp lệ thì đăng xuất và chuyển về đăng nhập.
 */
export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const persistedMe = useAuthStore((s) => s.me);
  const clearSession = useAuthStore((s) => s.clearSession);

  const q = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const m = await getMe();
      const t = useAuthStore.getState().accessToken;
      if (t) useAuthStore.getState().setSession(t, m);
      return m;
    },
    enabled: Boolean(accessToken),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (q.isPending && !persistedMe) {
    return <AppLoadingShell />;
  }

  if (q.isError) {
    clearSession();
    void queryClient.removeQueries({ queryKey: ["auth"] });
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
