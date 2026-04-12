import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { fetchBrandById } from "@/api/brands-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandFormDialog } from "@/features/brands/brand-form-dialog";
import { gateProductCatalogMutate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { activeInactiveLabel } from "@/lib/entity-status-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";

export function BrandDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const nid = Number(id);
  const me = useAuthStore((s) => s.me);
  const canEdit = Boolean(me && gateProductCatalogMutate(me));
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["brands", nid],
    queryFn: () => fetchBrandById(nid),
    enabled: Number.isFinite(nid) && nid > 0,
  });

  if (!Number.isFinite(nid) || nid <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Thiếu mã thương hiệu.</CardDescription>
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{b.brandName}</CardTitle>
              <CardDescription className="font-mono">{b.brandCode}</CardDescription>
            </div>
            <Badge variant="secondary">{activeInactiveLabel(b.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Mô tả</p>
            <p className="text-sm">{b.description || "—"}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
            <div>Tạo: {formatDateTimeVi(b.createdAt)}</div>
            <div>Cập nhật: {formatDateTimeVi(b.updatedAt)}</div>
          </div>
        </CardContent>
      </Card>
      {canEdit ? <BrandFormDialog mode="edit" brand={b} open={open} onOpenChange={setOpen} onSuccess={() => void q.refetch()} /> : null}
    </div>
  );
}
