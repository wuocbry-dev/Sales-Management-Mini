import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardKpis } from "@/api/dashboard-api";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DashboardScreen() {
  const q = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: getDashboardKpis,
  });

  if (q.isPending) {
    return <PageSkeleton cards={6} />;
  }

  if (q.isError) {
    return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  }

  const d = q.data;
  const completionPct =
    d.orderTotalCount > 0 ? Math.round((d.orderCompletedCount / d.orderTotalCount) * 1000) / 10 : 0;

  const chartData = [
    { name: "Sản phẩm", value: d.productCount },
    { name: "Biến thể", value: d.variantCount },
    { name: "Cửa hàng", value: d.storeCount },
    { name: "Khách hàng", value: d.customerCount },
    { name: "Đơn (tất cả)", value: d.orderTotalCount },
    { name: "Đơn hoàn tất", value: d.orderCompletedCount },
    { name: "Tồn thấp", value: d.lowStockCount },
    { name: "Trả hàng", value: d.salesReturnCount },
  ];

  const kpis: { label: string; value: string; hint: string; badge?: ReactNode }[] = [
    {
      label: "Doanh thu đơn hoàn tất",
      value: formatVndFromDecimal(d.completedRevenueTotal),
      hint: "Tổng giá trị đơn đã hoàn tất",
    },
    { label: "Đơn hoàn tất", value: String(d.orderCompletedCount), hint: "Số lượng đơn" },
    { label: "Tổng đơn", value: String(d.orderTotalCount), hint: "Mọi trạng thái" },
    { label: "Khách hàng", value: String(d.customerCount), hint: "Đang quản lý" },
    { label: "Biến thể (SKU)", value: String(d.variantCount), hint: "Dòng hàng" },
    {
      label: "Cảnh báo tồn thấp",
      value: String(d.lowStockCount),
      hint: "Cần chú ý nhập hàng",
      badge:
        d.lowStockCount > 0 ? (
          <Badge variant="warning" className="mt-1">
            Cần xử lý
          </Badge>
        ) : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/[0.04] md:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Tỷ lệ hoàn tất đơn</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums">{completionPct}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Đơn hoàn tất trên tổng số đơn trong hệ thống (theo dữ liệu hiện tại).
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tóm tắt nhanh</CardTitle>
            <CardDescription>Thống kê đếm từ cùng nguồn dữ liệu với các thẻ bên dưới.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Sản phẩm</p>
              <p className="text-lg font-semibold tabular-nums">{d.productCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Biến thể</p>
              <p className="text-lg font-semibold tabular-nums">{d.variantCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Cửa hàng</p>
              <p className="text-lg font-semibold tabular-nums">{d.storeCount}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Trả hàng</p>
              <p className="text-lg font-semibold tabular-nums">{d.salesReturnCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-xl tabular-nums">{k.value}</CardTitle>
              {k.badge ?? null}
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{k.hint}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phân bổ nhanh</CardTitle>
          <CardDescription>So sánh một số chỉ số đếm (đơn vị: lượng)</CardDescription>
        </CardHeader>
        <CardContent className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [v, "Giá trị"]}
                labelFormatter={(l) => String(l)}
                contentStyle={{ borderRadius: 8 }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Giá trị" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
