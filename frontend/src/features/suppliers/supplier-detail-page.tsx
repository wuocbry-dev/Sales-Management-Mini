import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { deleteSupplier, fetchSupplierById } from "@/api/suppliers-api";
import { toast } from "sonner";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierFormDialog } from "@/features/suppliers/supplier-form-dialog";
import { gateSupplierMutate } from "@/features/auth/gates";
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

export function SupplierDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const nid = Number(id);
  const me = useAuthStore((s) => s.me);
  const canEdit = Boolean(me && gateSupplierMutate(me));
  const [open, setOpen] = useState(false);

  const deleteM = useMutation({
    mutationFn: async (args: { status: string }) => deleteSupplier(nid),
    onSuccess: async (_data, variables) => {
      toast.success(`Đã ${softDeleteToggleSuccessVerb(variables.status)} nhà cung cấp.`);
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      navigate("/app/nha-cung-cap", { replace: true });
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const q = useQuery({
    queryKey: ["suppliers", nid],
    queryFn: () => fetchSupplierById(nid),
    enabled: Number.isFinite(nid) && nid > 0,
  });

  if (!Number.isFinite(nid) || nid <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
          <CardDescription>Thiếu mã nhà cung cấp.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={1} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const s = q.data;

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
            className={s.status === "INACTIVE" ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
            disabled={deleteM.isPending}
            onClick={() => {
              const action = softDeleteToggleConfirmVerb(s.status);
              if (!window.confirm(`${action} nhà cung cấp \"${s.supplierName}\"?`)) {
                return;
              }
              deleteM.mutate({ status: s.status });
            }}
          >
            {deleteM.isPending ? softDeleteToggleLoadingLabel(s.status) : softDeleteToggleLabel(s.status)}
          </Button>
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{s.supplierName}</CardTitle>
              <CardDescription className="font-mono">{s.supplierCode}</CardDescription>
            </div>
            <Badge variant="secondary" className={activeInactiveTextClass(s.status)}>{activeInactiveLabel(s.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Người liên hệ</p>
            <p className="text-sm">{s.contactPerson || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Điện thoại</p>
            <p className="text-sm">{s.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm">{s.email || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Địa chỉ</p>
            <p className="text-sm">{s.address || "—"}</p>
          </div>
          <div className="text-sm text-muted-foreground sm:col-span-2">
            Tạo: {formatDateTimeVi(s.createdAt)} · Cập nhật: {formatDateTimeVi(s.updatedAt)}
          </div>
        </CardContent>
      </Card>
      {canEdit ? (
        <SupplierFormDialog mode="edit" supplier={s} open={open} onOpenChange={setOpen} onSuccess={() => void q.refetch()} />
      ) : null}
    </div>
  );
}
