import { Navigate } from "react-router-dom";
import { getFirstAccessibleAppPath } from "@/app/navigation";
import { useAuthStore } from "@/features/auth/auth-store";

export function AppIndexRedirect() {
  const me = useAuthStore((s) => s.me);
  if (!me) {
    return null;
  }
  const next = getFirstAccessibleAppPath(me);
  if (!next) {
    return <Navigate to="/app/khong-duoc-truy-cap" replace />;
  }
  return <Navigate to={next} replace />;
}
