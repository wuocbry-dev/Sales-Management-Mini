import { useQuery } from "@tanstack/react-query";
import { BarChart3, LineChart, PieChart, Store } from "lucide-react";
import { fetchReportSummary } from "@/api/reports-api";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVndFromDecimal } from "@/lib/format-vnd";

function pctDisplay(s: string | null | undefined): string {
  if (s == null || s === "") return "—";
  const n = parseFloat(String(s).replace(",", "."));
  if (Number.isNaN(n)) return String(s);
  return `${n.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
}

export function ReportSummaryPage() {
  const q = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: () => fetchReportSummary(),
  });

  if (q.isPending) return <PageSkeleton cards={3} />;
  if (q.isError) return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;

  const r = q.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu đơn đã hoàn tất</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatVndFromDecimal(r.completedRevenueTotal)}</p>
            <p className="text-xs text-muted-foreground">Theo phạm vi bạn được xem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số đơn đã hoàn tất</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{r.completedOrderCount.toLocaleString("vi-VN")}</p>
            <p className="text-xs text-muted-foreground">Đơn hàng đã chốt thanh toán</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giá trị đơn trung bình</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{formatVndFromDecimal(r.averageOrderValue)}</p>
            <p className="text-xs text-muted-foreground">Trên các đơn đã hoàn tất</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ trả hàng</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{pctDisplay(r.returnRatePercent)}</p>
            <p className="text-xs text-muted-foreground">So với doanh thu hoàn tất</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Doanh thu theo cửa hàng</CardTitle>
          <CardDescription>Bảng tổng hợp theo từng cửa hàng trong phạm vi báo cáo.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cửa hàng</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="text-right">Số đơn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.revenueByStore.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Không có dữ liệu phân bổ theo cửa hàng.
                  </TableCell>
                </TableRow>
              ) : (
                r.revenueByStore.map((row) => (
                  <TableRow key={row.storeId}>
                    <TableCell className="font-medium">{row.storeName}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVndFromDecimal(row.revenueTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.orderCount.toLocaleString("vi-VN")}</TableCell>
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
