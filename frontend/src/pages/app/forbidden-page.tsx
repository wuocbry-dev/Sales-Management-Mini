import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FORBIDDEN_ROUTE, getPostLoginRedirectPath } from "@/app/default-landing";
import { useAuthStore } from "@/features/auth/auth-store";
import { ShieldOff } from "lucide-react";

export function ForbiddenPage() {
  const me = useAuthStore((s) => s.me);
  const next = me ? getPostLoginRedirectPath(me) : null;
  const safeNext =
    next && next !== FORBIDDEN_ROUTE && next !== "/app/khong-duoc-truy-cap" ? next : null;

  return (
    <Card className="mx-auto max-w-lg border-destructive/30">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldOff className="h-6 w-6" aria-hidden />
        </div>
        <CardTitle>Không được phép truy cập</CardTitle>
        <CardDescription>
          Tài khoản của bạn không có quyền mở trang này. Nếu cần quyền bổ sung, vui lòng liên hệ quản trị hệ thống.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        {safeNext
          ? "Bạn vẫn có thể dùng các mục khác trong menu mà bạn được phép."
          : "Hiện không có mục làm việc nào được gán cho tài khoản này. Vui lòng đăng xuất và liên hệ quản trị."}
      </CardContent>
      <CardFooter className="flex justify-center gap-2">
        {safeNext ? (
          <Button asChild variant="default">
            <Link to={safeNext}>Về khu vực làm việc</Link>
          </Button>
        ) : (
          <Button asChild variant="default">
            <Link to="/login">Về trang đăng nhập</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
