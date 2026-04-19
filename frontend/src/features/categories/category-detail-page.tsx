import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { deleteCategory, fetchCategoryById } from "@/api/categories-api";
import { toast } from "sonner";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryFormDialog } from "@/features/categories/category-form-dialog";
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

export function CategoryDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const nid = Number(id);
  const me = useAuthStore((s) => s.me);
  const canEdit = Boolean(me && gateProductCatalogMutate(me));
  const [open, setOpen] = useState(false);

  const deleteM = useMutation({
    mutationFn: async (args: { status: string }) => deleteCategory(nid),
    onSuccess: async (_data, variables) => {
      toast.success(`Đã ${softDeleteToggleSuccessVerb(variables.status)} nhóm hàng.`);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigate("/app/nhom-hang", { replace: true });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const q = useQuery({
    queryKey: ["categories", nid],
    queryFn: () => fetchCategoryById(nid),
    enabled: Number.isFinite(nid) && nid > 0,
  });

  if (!Number.isFinite(nid) || nid <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Thiếu mã nhóm hàng.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={1} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const c = q.data;

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
            className={c.status === "INACTIVE" ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
            disabled={deleteM.isPending}
            onClick={() => {
              const action = softDeleteToggleConfirmVerb(c.status);
              if (!window.confirm(`${action} nhóm hàng \"${c.categoryName}\"?`)) {
                return;
              }
              deleteM.mutate({ status: c.status });
            }}
          >
            {deleteM.isPending ? softDeleteToggleLoadingLabel(c.status) : softDeleteToggleLabel(c.status)}
          </Button>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{c.categoryName}</CardTitle>
              <CardDescription className="font-mono">{c.categoryCode}</CardDescription>
            </div>
            <Badge variant="secondary" className={activeInactiveTextClass(c.status)}>{activeInactiveLabel(c.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Nhóm cha</p>
            <p className="text-sm">{c.parentId != null ? "Có liên kết nhóm cha" : "Không có nhóm cha"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mô tả</p>
            <p className="text-sm">{c.description || "—"}</p>
          </div>
          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div>Tạo: {formatDateTimeVi(c.createdAt)}</div>
            <div>Cập nhật: {formatDateTimeVi(c.updatedAt)}</div>
          </div>
        </CardContent>
      </Card>
      {canEdit ? <CategoryFormDialog mode="edit" category={c} open={open} onOpenChange={setOpen} onSuccess={() => void q.refetch()} /> : null}
    </div>
  );
}
