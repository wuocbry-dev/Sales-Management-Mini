import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import { fetchStoreById } from "@/api/stores-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { gateStoreScopedUsersInStorePage, gateStoreUpdate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { StoreFormDialog } from "@/features/stores/store-form-dialog";
import { activeInactiveLabel } from "@/lib/entity-status-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";

export function StoreDetailPage() {
  const location = useLocation();
  const { storeId } = useParams();
  const id = Number(storeId);
  const me = useAuthStore((s) => s.me);
  const canEdit = Boolean(me && gateStoreUpdate(me));
  const canSeeStoreUsers = Boolean(me && gateStoreScopedUsersInStorePage(me));
  const [editOpen, setEditOpen] = useState(false);

  const q = useQuery({
    queryKey: ["stores", id],
    queryFn: () => fetchStoreById(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Liên kết cửa hàng không đúng.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const s = q.data;
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from
      ? (location.state as { from?: string }).from!
      : "/app/cua-hang";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={from}>← Quay lại</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/app/cua-hang/${id}/chi-nhanh`}>Chi nhánh</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/app/cua-hang/${id}/kho`}>Kho hàng</Link>
        </Button>
        {canSeeStoreUsers ? (
          <Button variant="outline" size="sm" asChild>
            <Link
              to={`/app/cua-hang/${id}/nguoi-dung`}
              state={{ from: `${location.pathname}${location.search}` }}
            >
              Người dùng trong cửa hàng
            </Link>
          </Button>
        ) : null}
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setEditOpen(true)}>
            Sửa thông tin
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{s.storeName}</CardTitle>
              <CardDescription className="font-mono">{s.storeCode}</CardDescription>
            </div>
            <Badge variant="secondary">{activeInactiveLabel(s.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Điện thoại</p>
            <p className="text-sm">{s.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{s.email || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">Địa chỉ</p>
            <p className="text-sm">{s.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tạo lúc</p>
            <p className="text-sm">{formatDateTimeVi(s.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cập nhật</p>
            <p className="text-sm">{formatDateTimeVi(s.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <StoreFormDialog mode="edit" store={s} open={editOpen} onOpenChange={setEditOpen} onSuccess={() => void q.refetch()} />
      ) : null}
    </div>
  );
}
