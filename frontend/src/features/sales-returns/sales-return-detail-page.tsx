import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { fetchSalesOrderById } from "@/api/sales-orders-api";
import { confirmSalesReturn, fetchSalesReturnById } from "@/api/sales-returns-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canSeeReturnConfirm } from "@/features/auth/action-access";
import { useAuthStore } from "@/features/auth/auth-store";
import { useVariantLabelMap } from "@/hooks/use-variant-label-map";
import { formatApiError } from "@/lib/api-errors";
import { salesReturnStatusLabel } from "@/lib/document-flow-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatQty } from "@/lib/format-qty";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { useStoreNameMap } from "@/hooks/use-store-name-map";

export function SalesReturnDetailPage() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.me);
  const { id } = useParams();
  const rid = Number(id);
  const invalid = !Number.isFinite(rid) || rid <= 0;
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["sales-returns", rid],
    queryFn: () => fetchSalesReturnById(rid),
    enabled: !invalid,
  });

  const orderQ = useQuery({
    queryKey: ["sales-orders", q.data?.orderId],
    queryFn: () => fetchSalesOrderById(q.data!.orderId),
    enabled: Boolean(q.data?.orderId),
    retry: false,
  });

  const { getStoreName } = useStoreNameMap();
  const { getVariantLabel } = useVariantLabelMap({ enabled: Boolean(q.data) });

  const canConfirm = Boolean(me && canSeeReturnConfirm(me, q.data?.status));

  const confirmM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => confirmSalesReturn(rid),
    onSuccess: async () => {
      toast.success("Đã xác nhận phiếu trả.");
      await qc.invalidateQueries({ queryKey: ["sales-returns"] });
      await qc.invalidateQueries({ queryKey: ["sales-returns", rid] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const orderItemById = useMemo(() => {
    const map = new Map<number, number>();
    for (const it of orderQ.data?.items ?? []) {
      map.set(it.id, it.variantId);
    }
    return map;
  }, [orderQ.data]);

  const getOrderItemDisplay = (orderItemId: number) => {
    const variantId = orderItemById.get(orderItemId);
    if (variantId == null) return `Dòng #${orderItemId}`;
    return `#${orderItemId} - ${getVariantLabel(variantId)}`;
  };

  if (invalid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/app/tra-hang">Về danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const r = q.data;
  const isDraft = r.status === "draft";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" type="button" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
        {canConfirm && isDraft ? (
          <Button type="button" disabled={confirmM.isPending} onClick={() => confirmM.mutate()}>
            {confirmM.isPending ? "Đang xử lý…" : "Xác nhận trả hàng"}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl font-mono">{r.returnCode}</CardTitle>
            <Badge variant="secondary">{salesReturnStatusLabel(r.status)}</Badge>
          </div>
          <CardDescription>Ngày trả: {formatDateTimeVi(r.returnDate)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Đơn gốc</p>
            <p className="font-medium">{orderQ.data?.orderCode ?? `Đơn #${r.orderId}`}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cửa hàng</p>
            <p className="font-medium">{getStoreName(r.storeId)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hoàn tiền</p>
            <p className="font-semibold">{formatVndFromDecimal(r.refundAmount)}</p>
          </div>
          {r.note ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Ghi chú</p>
              <p className="whitespace-pre-wrap">{r.note}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết trả</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dòng đơn</TableHead>
                <TableHead>Biến thể</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
                <TableHead>Lý do</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="text-sm">{getOrderItemDisplay(it.orderItemId)}</TableCell>
                  <TableCell className="text-sm">{getVariantLabel(it.variantId)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatQty(it.quantity)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVndFromDecimal(it.unitPrice)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVndFromDecimal(it.lineTotal)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{it.reason ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
