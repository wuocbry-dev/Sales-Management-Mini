import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { deleteBrand, fetchBrandById } from "@/api/brands-api";
import { toast } from "sonner";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandFormDialog } from "@/features/brands/brand-form-dialog";
import { gateProductCatalogMutate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatApiError } from "@/lib/api-errors";
import {
  activeInactiveLabel,
  activeInactiveTextClass,
  softDeleteToggleConfirmVerb,
  softDeleteToggleLabel,
  softDeleteToggleLoadingLabel,
  softDeleteToggleSuccessVerb,
} from "@/lib/entity-status-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";

export function BrandDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const nid = Number(id);
  const me = useAuthStore((s) => s.me);
  const canEdit = Boolean(me && gateProductCatalogMutate(me));
  const [open, setOpen] = useState(false);

  const deleteM = useMutation({
    mutationFn: async (args: { status: string }) => deleteBrand(nid),
    onSuccess: async (_data, variables) => {
      toast.success(`Đã ${softDeleteToggleSuccessVerb(variables.status)} thương hiệu.`);
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      navigate("/app/thuong-hieu", { replace: true });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

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
        {canEdit ? (
          <Button
            variant="outline"
            size="sm"
            type="button"
            className={b.status === "INACTIVE" ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
            disabled={deleteM.isPending}
            onClick={() => {
              const action = softDeleteToggleConfirmVerb(b.status);
              if (!window.confirm(`${action} thương hiệu \"${b.brandName}\"?`)) {
                return;
              }
              deleteM.mutate({ status: b.status });
            }}
          >
            {deleteM.isPending ? softDeleteToggleLoadingLabel(b.status) : softDeleteToggleLabel(b.status)}
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
            <Badge variant="secondary" className={activeInactiveTextClass(b.status)}>{activeInactiveLabel(b.status)}</Badge>
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
