import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cancelSalesOrder, confirmSalesOrder, fetchSalesOrderById } from "@/api/sales-orders-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canSeeSalesOrderCancel, canSeeSalesOrderConfirm } from "@/features/auth/action-access";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatApiError } from "@/lib/api-errors";
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTypeLabel,
  salesOrderStatusLabel,
} from "@/lib/document-flow-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatQty } from "@/lib/format-qty";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import type { PaymentLineRequestBody } from "@/types/sales-order";
import { useStoreNameMap } from "@/hooks/use-store-name-map";

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const PAYMENT_TYPES = [{ v: "SALE", l: "Thu bán hàng" }];
const PAYMENT_METHODS = [
  { v: "CASH", l: "Tiền mặt" },
  { v: "BANK_TRANSFER", l: "Chuyển khoản" },
  { v: "CARD", l: "Thẻ" },
  { v: "EWALLET", l: "Ví điện tử" },
  { v: "OTHER", l: "Khác" },
];

export function SalesOrderDetailPage() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.me);
  const { id } = useParams();
  const oid = Number(id);
  const invalid = !Number.isFinite(oid) || oid <= 0;
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["sales-orders", oid],
    queryFn: () => fetchSalesOrderById(oid),
    enabled: !invalid,
  });

  const { getStoreName } = useStoreNameMap();

  const orderStatus = q.data?.status;
  const canConfirm = Boolean(me && canSeeSalesOrderConfirm(me, orderStatus));
  const canCancel = Boolean(me && canSeeSalesOrderCancel(me, orderStatus));

  const [payments, setPayments] = useState<PaymentLineRequestBody[]>([]);

  useEffect(() => {
    const o = q.data;
    if (!o || o.status !== "draft") {
      setPayments([]);
      return;
    }
    const total = parseFloat(o.totalAmount);
    if (total > 0) {
      setPayments([
        {
          paymentType: "SALE",
          paymentMethod: "CASH",
          amount: o.totalAmount,
          referenceNo: null,
          note: null,
        },
      ]);
    } else {
      setPayments([]);
    }
  }, [q.data?.id, q.data?.status, q.data?.totalAmount, q.data]);

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["sales-orders"] });
    await qc.invalidateQueries({ queryKey: ["sales-orders", oid] });
  };

  const confirmM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () =>
      confirmSalesOrder(oid, {
        payments: payments.map((p) => ({
          ...p,
          amount: typeof p.amount === "string" ? parseFloat(p.amount) : Number(p.amount),
        })),
      }),
    onSuccess: async () => {
      toast.success("Đã xác nhận thanh toán và hoàn tất đơn.");
      await invalidate();
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const cancelM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => cancelSalesOrder(oid),
    onSuccess: async () => {
      toast.success("Đã hủy đơn.");
      await invalidate();
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const addPaymentRow = () => {
    setPayments((p) => [...p, { paymentType: "SALE", paymentMethod: "CASH", amount: 0, referenceNo: null, note: null }]);
  };

  const removePaymentRow = (idx: number) => {
    setPayments((p) => p.filter((_, i) => i !== idx));
  };

  const updatePayment = (idx: number, patch: Partial<PaymentLineRequestBody>) => {
    setPayments((p) => p.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  if (invalid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không hợp lệ</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/app/don-ban">Về danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const o = q.data;
  const isDraft = o.status === "draft";
  const totalNum = parseFloat(o.totalAmount);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" type="button" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
        <div className="flex flex-wrap gap-2">
          {canCancel && isDraft ? (
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              disabled={cancelM.isPending}
              onClick={() => cancelM.mutate()}
            >
              {cancelM.isPending ? "Đang xử lý…" : "Hủy đơn"}
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl font-mono">{o.orderCode}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{salesOrderStatusLabel(o.status)}</Badge>
              <Badge variant="outline">{paymentStatusLabel(o.paymentStatus)}</Badge>
            </div>
          </div>
          <CardDescription>Ngày đặt: {formatDateTimeVi(o.orderDate)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Kho xuất hàng khi hoàn tất</p>
            <p className="mt-1">
              {o.branchId == null
                ? "Theo cấu hình hiện tại: hàng sẽ được trừ từ kho tổng của cửa hàng (không gắn chi nhánh cụ thể)."
                : "Hàng sẽ được trừ từ kho gắn với chi nhánh đã chọn trên đơn."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Cửa hàng</p>
              <p className="font-medium">{getStoreName(o.storeId)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chi nhánh</p>
              <p className="font-medium tabular-nums">{o.branchId ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Khách hàng</p>
              <p className="font-medium tabular-nums">{o.customerId ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Thành tiền</p>
              <p className="font-semibold">{formatVndFromDecimal(o.totalAmount)}</p>
            </div>
          </div>
          {o.note ? (
            <div>
              <p className="text-xs text-muted-foreground">Ghi chú</p>
              <p className="whitespace-pre-wrap">{o.note}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết mặt hàng</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã biến thể</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Giảm giá</TableHead>
                <TableHead className="text-right">Thành tiền dòng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {o.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-sm tabular-nums">{it.variantId}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatQty(it.quantity)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVndFromDecimal(it.unitPrice)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVndFromDecimal(it.discountAmount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatVndFromDecimal(it.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {o.payments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thanh toán đã ghi nhận</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Hình thức</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Mã tham chiếu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {o.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{paymentTypeLabel(p.paymentType)}</TableCell>
                    <TableCell>{paymentMethodLabel(p.paymentMethod)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVndFromDecimal(p.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.referenceNo ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {canConfirm && isDraft ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Xác nhận thanh toán</CardTitle>
            <CardDescription>
              {totalNum > 0
                ? "Nhập các dòng thu tiền; tổng số tiền phải khớp thành tiền đơn hàng."
                : "Đơn không phát sinh thu — có thể hoàn tất mà không cần dòng thanh toán."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalNum > 0 ? (
              <>
                {payments.map((row, idx) => (
                  <div key={idx} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-2">
                      <Label>Loại thu</Label>
                      <select
                        className={selectClass}
                        value={row.paymentType}
                        onChange={(e) => updatePayment(idx, { paymentType: e.target.value })}
                      >
                        {PAYMENT_TYPES.map((x) => (
                          <option key={x.v} value={x.v}>
                            {x.l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hình thức thanh toán</Label>
                      <select
                        className={selectClass}
                        value={row.paymentMethod}
                        onChange={(e) => updatePayment(idx, { paymentMethod: e.target.value })}
                      >
                        {PAYMENT_METHODS.map((x) => (
                          <option key={x.v} value={x.v}>
                            {x.l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Số tiền</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={String(row.amount ?? "")}
                        onChange={(e) =>
                          updatePayment(idx, { amount: e.target.value === "" ? 0 : Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mã tham chiếu</Label>
                      <Input
                        value={row.referenceNo ?? ""}
                        onChange={(e) => updatePayment(idx, { referenceNo: e.target.value.trim() || null })}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      {payments.length > 1 ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removePaymentRow(idx)}>
                          Xóa dòng
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addPaymentRow}>
                  Thêm dòng thanh toán
                </Button>
              </>
            ) : null}
            <Button type="button" disabled={confirmM.isPending} onClick={() => confirmM.mutate()}>
              {confirmM.isPending ? "Đang xử lý…" : "Xác nhận thanh toán"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
