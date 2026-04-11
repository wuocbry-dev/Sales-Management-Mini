import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FORBIDDEN_ROUTE, getPostLoginRedirectPath } from "@/app/default-landing";
import { useAuthStore } from "@/features/auth/auth-store";
import { FileQuestion } from "lucide-react";

export function NotFoundPage() {
  const me = useAuthStore((s) => s.me);
  const next = me ? getPostLoginRedirectPath(me) : null;
  const safeNext =
    next && next !== FORBIDDEN_ROUTE && next !== "/app/khong-duoc-truy-cap" ? next : null;

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileQuestion className="h-6 w-6" aria-hidden />
        </div>
        <CardTitle>Không tìm thấy trang</CardTitle>
        <CardDescription>Đường dẫn này không tồn tại trong ứng dụng hoặc đã được đổi tên.</CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        Kiểm tra lại địa chỉ hoặc chọn mục từ menu bên trái.
      </CardContent>
      <CardFooter className="flex justify-center">
        {safeNext ? (
          <Button asChild>
            <Link to={safeNext}>Về khu vực làm việc</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/login">Về trang đăng nhập</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
