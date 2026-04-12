import { Link, useLocation } from "react-router-dom";
import { useStoreNameMap } from "@/hooks/use-store-name-map";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/auth-store";
import { isSystemManage } from "@/features/auth/access";

export function StoreScopedUsersHubPage() {
  const location = useLocation();
  const me = useAuthStore((s) => s.me);
  const admin = Boolean(me && isSystemManage(me));
  const allowed = admin ? null : new Set(me?.storeIds ?? []);

  const { stores, isPending, isError, error, refetch } = useStoreNameMap();

  if (isPending) return <PageSkeleton cards={2} />;
  if (isError) return <ApiErrorState error={error} onRetry={() => void refetch()} />;

  const rows = stores.filter((s) => (allowed == null ? true : allowed.has(s.id)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Người dùng cửa hàng</CardTitle>
          <CardDescription>
            Chọn cửa hàng để xem danh sách người được gán và phân chi nhánh trong phạm vi cửa hàng đó.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bạn chưa được gán cửa hàng nào để quản lý người dùng.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <div>
                    <p className="font-medium">{s.storeName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{s.storeCode}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      to={`/app/cua-hang/${s.id}/nguoi-dung`}
                      state={{ from: `${location.pathname}${location.search}` }}
                    >
                      Mở danh sách
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
