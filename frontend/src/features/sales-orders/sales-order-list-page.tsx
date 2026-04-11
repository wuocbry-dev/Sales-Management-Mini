import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { fetchSalesOrdersPage } from "@/api/sales-orders-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { PaginationBar } from "@/components/data-table/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gateOrderCreate } from "@/features/auth/gates";
import { useAuthStore } from "@/features/auth/auth-store";
import { formatDateTimeVi } from "@/lib/format-datetime";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { paymentStatusLabel, salesOrderStatusLabel } from "@/lib/document-flow-labels";

const DEFAULT_SIZE = 10;

export function SalesOrderListPage() {
  const me = useAuthStore((s) => s.me);
  const canCreate = Boolean(me && gateOrderCreate(me));
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get("trang") ?? "0") || 0);
  const size = Math.min(100, Math.max(1, Number(params.get("kichThuoc") ?? String(DEFAULT_SIZE)) || DEFAULT_SIZE));

  const q = useQuery({
    queryKey: ["sales-orders", page, size],
    queryFn: () => fetchSalesOrdersPage({ page, size }),
  });

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set("trang", String(next));
    p.set("kichThuoc", String(size));
    setParams(p, { replace: true });
  };

  if (q.isPending) return <PageSkeleton cards={2} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const data = q.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Đơn bán</CardTitle>
            <CardDescription>Danh sách đơn hàng theo phạm vi cửa hàng.</CardDescription>
          </div>
          {canCreate ? (
            <Button type="button" asChild>
              <Link to="/app/don-ban/moi">Tạo đơn hàng</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead className="w-[90px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Không có đơn hàng.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.content.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.orderCode}</TableCell>
                      <TableCell className="text-sm">{formatDateTimeVi(row.orderDate)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{salesOrderStatusLabel(row.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{paymentStatusLabel(row.paymentStatus)}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatVndFromDecimal(row.totalAmount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/app/don-ban/${row.id}`}>Mở</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationBar page={data} onPageChange={setPage} disabled={q.isFetching} />
        </CardContent>
      </Card>
    </div>
  );
}
