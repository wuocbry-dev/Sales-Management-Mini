import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { confirmGoodsReceipt, fetchGoodsReceiptById } from "@/api/goods-receipts-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canSeeGoodsReceiptConfirm } from "@/features/auth/action-access";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatApiError } from "@/lib/api-errors";
import { goodsReceiptStatusLabel } from "@/lib/document-flow-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatQty } from "@/lib/format-qty";
import { formatVndFromDecimal } from "@/lib/format-vnd";

export function GoodsReceiptDetailPage() {
  const me = useAuthStore((s) => s.me);
  const { id } = useParams();
  const rid = Number(id);
  const invalid = !Number.isFinite(rid) || rid <= 0;
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["goods-receipts", rid],
    queryFn: () => fetchGoodsReceiptById(rid),
    enabled: !invalid,
  });

  const canConfirm = Boolean(me && canSeeGoodsReceiptConfirm(me, q.data?.status));

  const confirmM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => confirmGoodsReceipt(rid),
    onSuccess: async () => {
      toast.success("Đã xác nhận nhập kho.");
      await qc.invalidateQueries({ queryKey: ["goods-receipts"] });
      await qc.invalidateQueries({ queryKey: ["goods-receipts", rid] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  if (invalid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/app/phieu-nhap">Về danh sách</Link>
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
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/phieu-nhap">← Danh sách phiếu nhập</Link>
        </Button>
        {canConfirm && isDraft ? (
          <Button type="button" disabled={confirmM.isPending} onClick={() => confirmM.mutate()}>
            {confirmM.isPending ? "Đang xử lý…" : "Xác nhận nhập kho"}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl font-mono">{r.receiptCode}</CardTitle>
            <Badge variant="secondary">{goodsReceiptStatusLabel(r.status)}</Badge>
          </div>
          <CardDescription>Ngày nhập: {formatDateTimeVi(r.receiptDate)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Cửa hàng</p>
            <p className="font-medium tabular-nums">{r.storeId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kho nhận</p>
            <p className="font-medium tabular-nums">{r.warehouseId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nhà cung cấp</p>
            <p className="font-medium tabular-nums">{r.supplierId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tạm tính</p>
            <p className="font-medium">{formatVndFromDecimal(r.subtotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Giảm giá đầu phiếu</p>
            <p className="font-medium">{formatVndFromDecimal(r.discountAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Thành tiền</p>
            <p className="font-semibold">{formatVndFromDecimal(r.totalAmount)}</p>
          </div>
          {r.note ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground">Ghi chú</p>
              <p className="whitespace-pre-wrap">{r.note}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết hàng nhập</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã biến thể</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Giảm giá dòng</TableHead>
                <TableHead className="text-right">Thành tiền dòng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Không có dòng chi tiết.
                  </TableCell>
                </TableRow>
              ) : (
                r.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-mono text-sm tabular-nums">{line.variantId}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatQty(line.quantity)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVndFromDecimal(line.unitCost)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVndFromDecimal(line.discountAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVndFromDecimal(line.lineTotal)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
