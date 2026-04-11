import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { fetchStockTransferById, receiveStockTransfer, sendStockTransfer } from "@/api/stock-transfers-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canSeeTransferReceive, canSeeTransferSend } from "@/features/auth/action-access";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatApiError } from "@/lib/api-errors";
import { stockTransferStatusLabel } from "@/lib/document-flow-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatQty } from "@/lib/format-qty";
import type { StockTransferLineResponse } from "@/types/stock-transfer";

function formatWarehouseDisplay(
  id: number,
  code: string | null | undefined,
  name: string | null | undefined,
): string {
  const c = code?.trim();
  const n = name?.trim();
  if (n && c) return `${n} (${c})`;
  if (n) return n;
  if (c) return c;
  return String(id);
}

function formatVariantDisplay(item: StockTransferLineResponse): string {
  const sku = item.variantSku?.trim();
  const title = [item.productName?.trim(), item.variantName?.trim()].filter(Boolean).join(" · ");
  if (sku && title) return `${sku} — ${title}`;
  if (sku) return sku;
  if (title) return title;
  return String(item.variantId);
}

export function StockTransferDetailPage() {
  const me = useAuthStore((s) => s.me);
  const { id } = useParams();
  const tid = Number(id);
  const invalid = !Number.isFinite(tid) || tid <= 0;
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["stock-transfers", tid],
    queryFn: () => fetchStockTransferById(tid),
    enabled: !invalid,
  });

  const st = q.data?.status;
  const canSend = Boolean(me && canSeeTransferSend(me, st));
  const canReceive = Boolean(me && canSeeTransferReceive(me, st));

  const sendM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => sendStockTransfer(tid),
    onSuccess: async () => {
      toast.success("Đã xuất kho chuyển.");
      await qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      await qc.invalidateQueries({ queryKey: ["stock-transfers", tid] });
      await qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });

  const recvM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => receiveStockTransfer(tid),
    onSuccess: async () => {
      toast.success("Đã nhập kho nhận.");
      await qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      await qc.invalidateQueries({ queryKey: ["stock-transfers", tid] });
      await qc.invalidateQueries({ queryKey: ["inventory"] });
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
            <Link to="/app/chuyen-kho">Về danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const t = q.data;
  const isDraft = t.status === "draft";
  const isSent = t.status === "sent";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/chuyen-kho">← Danh sách</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {canSend && isDraft ? (
            <Button type="button" disabled={sendM.isPending} onClick={() => sendM.mutate()}>
              {sendM.isPending ? "Đang xử lý…" : "Xuất kho chuyển"}
            </Button>
          ) : null}
          {canReceive && isSent ? (
            <Button type="button" disabled={recvM.isPending} onClick={() => recvM.mutate()}>
              {recvM.isPending ? "Đang xử lý…" : "Nhập kho nhận"}
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl font-mono">{t.transferCode}</CardTitle>
            <Badge variant="secondary">{stockTransferStatusLabel(t.status)}</Badge>
          </div>
          <CardDescription>Ngày chuyển: {formatDateTimeVi(t.transferDate)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Kho nguồn</p>
            <p className="font-medium">
              {formatWarehouseDisplay(t.fromWarehouseId, t.fromWarehouseCode, t.fromWarehouseName)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kho đích</p>
            <p className="font-medium">
              {formatWarehouseDisplay(t.toWarehouseId, t.toWarehouseCode, t.toWarehouseName)}
            </p>
          </div>
          {t.note ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Ghi chú</p>
              <p className="whitespace-pre-wrap">{t.note}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết hàng chuyển</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã biến thể</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {t.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="text-sm">
                    <span className="font-medium">{formatVariantDisplay(it)}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatQty(it.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
