import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { confirmStocktake, fetchStocktakeById } from "@/api/stocktakes-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canSeeStocktakeConfirm } from "@/features/auth/action-access";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatApiError } from "@/lib/api-errors";
import { stocktakeStatusLabel } from "@/lib/document-flow-labels";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatQty } from "@/lib/format-qty";
import { useStoreNameMap } from "@/hooks/use-store-name-map";

export function StocktakeDetailPage() {
  const me = useAuthStore((s) => s.me);
  const { id } = useParams();
  const kid = Number(id);
  const invalid = !Number.isFinite(kid) || kid <= 0;
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["stocktakes", kid],
    queryFn: () => fetchStocktakeById(kid),
    enabled: !invalid,
  });

  const { getStoreName } = useStoreNameMap();

  const canConfirm = Boolean(me && canSeeStocktakeConfirm(me, q.data?.status));

  const confirmM = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: () => confirmStocktake(kid),
    onSuccess: async () => {
      toast.success("Đã chốt kiểm kê.");
      await qc.invalidateQueries({ queryKey: ["stocktakes"] });
      await qc.invalidateQueries({ queryKey: ["stocktakes", kid] });
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
            <Link to="/app/kiem-kho">Về danh sách</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const s = q.data;
  const isDraft = s.status === "draft";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/app/kiem-kho">← Danh sách</Link>
        </Button>
        {canConfirm && isDraft ? (
          <Button type="button" disabled={confirmM.isPending} onClick={() => confirmM.mutate()}>
            {confirmM.isPending ? "Đang xử lý…" : "Chốt kiểm kê"}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-xl font-mono">{s.stocktakeCode}</CardTitle>
            <Badge variant="secondary">{stocktakeStatusLabel(s.status)}</Badge>
          </div>
          <CardDescription>Ngày kiểm: {formatDateTimeVi(s.stocktakeDate)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Cửa hàng</p>
            <p className="font-medium">{getStoreName(s.storeId)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kho</p>
            <p className="font-medium tabular-nums">{s.warehouseId}</p>
          </div>
          {s.note ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Ghi chú</p>
              <p className="whitespace-pre-wrap">{s.note}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết kiểm</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã biến thể</TableHead>
                <TableHead className="text-right">Tồn hệ thống</TableHead>
                <TableHead className="text-right">Thực tế</TableHead>
                <TableHead className="text-right">Chênh lệch</TableHead>
                <TableHead>Ghi chú dòng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-mono text-sm tabular-nums">{it.variantId}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatQty(it.systemQty)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatQty(it.actualQty)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatQty(it.differenceQty)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{it.note ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
