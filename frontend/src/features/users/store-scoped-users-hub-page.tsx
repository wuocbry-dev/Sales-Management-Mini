import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchStoresPage } from "@/api/stores-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/auth-store";
import { isSystemManage } from "@/features/auth/access";

export function StoreScopedUsersHubPage() {
  const me = useAuthStore((s) => s.me);
  const admin = Boolean(me && isSystemManage(me));
  const allowed = admin ? null : new Set(me?.storeIds ?? []);

  const q = useQuery({
    queryKey: ["stores", "scoped-users-hub"],
    queryFn: () => fetchStoresPage({ page: 0, size: 200 }),
  });

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const rows = (q.data?.content ?? []).filter((s) => (allowed == null ? true : allowed.has(s.id)));

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
                    <Link to={`/app/cua-hang/${s.id}/nguoi-dung`}>Mở danh sách</Link>
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
