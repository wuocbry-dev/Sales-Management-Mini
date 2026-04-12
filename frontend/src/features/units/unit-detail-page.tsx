import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { fetchUnitById } from "@/api/units-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitFormDialog } from "@/features/units/unit-form-dialog";
import { gateProductCatalogMutate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatDateTimeVi } from "@/lib/format-datetime";

export function UnitDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const nid = Number(id);
  const me = useAuthStore((s) => s.me);
  const canEdit = Boolean(me && gateProductCatalogMutate(me));
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["units", nid],
    queryFn: () => fetchUnitById(nid),
    enabled: Number.isFinite(nid) && nid > 0,
  });

  if (!Number.isFinite(nid) || nid <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Thiếu mã đơn vị.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={1} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const u = q.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" type="button" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            Sửa thông tin
          </Button>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{u.unitName}</CardTitle>
          <CardDescription className="font-mono">{u.unitCode}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Mô tả</p>
            <p className="text-sm">{u.description || "—"}</p>
          </div>
          <p className="text-sm text-muted-foreground">Tạo lúc: {formatDateTimeVi(u.createdAt)}</p>
        </CardContent>
      </Card>
      {canEdit ? <UnitFormDialog mode="edit" unit={u} open={open} onOpenChange={setOpen} onSuccess={() => void q.refetch()} /> : null}
    </div>
  );
}
