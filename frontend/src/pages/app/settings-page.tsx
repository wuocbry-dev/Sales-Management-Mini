import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/features/auth/auth-store";
import { userAccountStatusLabel } from "@/lib/entity-status-labels";
import { formatRoleCodesForUi } from "@/lib/role-labels";

export function SettingsPage() {
  const me = useAuthStore((s) => s.me);
  if (!me) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cài đặt tài khoản</CardTitle>
          <CardDescription>Thông tin phiên đăng nhập hiện tại.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tên đăng nhập</p>
            <p className="font-mono text-sm">{me.username}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Họ tên</p>
            <p className="text-sm font-medium">{me.fullName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{me.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Điện thoại</p>
            <p className="text-sm">{me.phone ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Trạng thái</p>
            <Badge variant="secondary">{userAccountStatusLabel(me.status)}</Badge>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cửa hàng mặc định</p>
            <p className="text-sm">{me.defaultStoreId != null ? me.defaultStoreId : "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">Vai trò</p>
            <p className="text-sm">{formatRoleCodesForUi(me.roles)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
