import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { fetchBranchById } from "@/api/branches-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchFormDialog } from "@/features/branches/branch-form-dialog";
import { gateBranchUpdate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { activeInactiveLabel } from "@/lib/entity-status-labels";

export function BranchDetailPage() {
  const { storeId: sid, branchId: bid } = useParams();
  const storeId = Number(sid);
  const branchId = Number(bid);
  const me = useAuthStore((s) => s.me);
  const canEdit = Boolean(me && gateBranchUpdate(me));
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["branches", "detail", branchId],
    queryFn: () => fetchBranchById(branchId),
    enabled: Number.isFinite(branchId) && branchId > 0,
  });

  if (!Number.isFinite(storeId) || storeId <= 0 || !Number.isFinite(branchId) || branchId <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Liên kết chi nhánh không đúng.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={1} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const b = q.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/app/cua-hang/${b.storeId}/chi-nhanh`}>← Danh sách chi nhánh</Link>
        </Button>
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            Sửa thông tin
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{b.branchName}</CardTitle>
              <CardDescription className="font-mono">{b.branchCode}</CardDescription>
            </div>
            <Badge variant="secondary">{activeInactiveLabel(b.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Điện thoại</p>
            <p className="text-sm">{b.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{b.email || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">Địa chỉ</p>
            <p className="text-sm">{b.address || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {canEdit ? (
        <BranchFormDialog mode="edit" storeId={storeId} branch={b} open={open} onOpenChange={setOpen} onSuccess={() => void q.refetch()} />
      ) : null}
    </div>
  );
}
