import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Boxes,
  ChartColumnIncreasing,
  CircleDollarSign,
  ClipboardCheck,
  Minus,
  PackagePlus,
  RotateCcw,
  Store,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardKpis } from "@/api/dashboard-api";
import { formatVndFromDecimal } from "@/lib/format-vnd";
import type { DashboardKpisResponse, DashboardPeriod } from "@/types/dashboard";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DashboardTone = "success" | "warning" | "destructive";
type DashboardChangeTone = DashboardTone | "muted";

type DashboardLegacyCompat = {
  currentMonthRevenueTotal?: string;
  currentMonthImportTotal?: string;
  currentMonthNetIncomeTotal?: string;
  currentMonthLabel?: string;
};

type DashboardDataCompat = DashboardKpisResponse & DashboardLegacyCompat;

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "quarter", label: "Quý này" },
];

const periodSelectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function parseMoney(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parseOptionalNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatCount(value: number): string {
  return Math.round(value).toLocaleString("vi-VN");
}

function useAnimatedNumber(target: number, duration = 1000): number {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const safeTarget = Number.isFinite(target) ? target : 0;

    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayValue(safeTarget);
      return;
    }

    let frameId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(safeTarget * eased);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [target, duration]);

  return displayValue;
}

function toPercent(value: number, base: number): number {
  if (base <= 0) return 0;
  const raw = (Math.abs(value) / base) * 100;
  return Math.max(Math.min(Math.round(raw), 100), 0);
}

function compactAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

function netTone(net: number): DashboardTone {
  if (net > 0) return "success";
  if (net < 0) return "destructive";
  return "warning";
}

function changeTone(change: number | null): DashboardChangeTone {
  if (change == null) return "muted";
  if (change > 0) return "success";
  if (change < 0) return "destructive";
  return "warning";
}

function formatSignedPercent(change: number): string {
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function buildSymmetricDomain(values: number[]): [number, number] {
  const maxAbs = Math.max(...values.map((value) => Math.abs(value)), 1);
  const padded = Math.max(maxAbs * 1.2, 10);
  return [-padded, padded];
}

function buildSymmetricTicks(domain: [number, number]): number[] {
  const [, max] = domain;
  const half = max / 2;
  return [-max, -half, 0, half, max];
}

type FinanceValueLabelProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
};

function FinanceValueLabel({ x = 0, y = 0, width = 0, height = 0, value = 0 }: FinanceValueLabelProps) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;

  const isPositive = num >= 0;
  const labelX = isPositive ? x + width + 8 : x - 8;
  return (
    <text
      x={labelX}
      y={y + height / 2 + 4}
      textAnchor={isPositive ? "start" : "end"}
      fill="hsl(var(--foreground))"
      fontSize={11}
      fontWeight={600}
    >
      {formatVndFromDecimal(num)}
    </text>
  );
}

export function DashboardScreen() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const q = useQuery({
    queryKey: ["dashboard", "kpis", period],
    queryFn: () => getDashboardKpis(period),
  });

  const d = q.data as DashboardDataCompat | undefined;

  const orderTotalCount = d?.orderTotalCount ?? 0;
  const orderCompletedCount = d?.orderCompletedCount ?? 0;
  const productCount = d?.productCount ?? 0;
  const variantCount = d?.variantCount ?? 0;
  const storeCount = d?.storeCount ?? 0;
  const customerCount = d?.customerCount ?? 0;
  const lowStockCount = d?.lowStockCount ?? 0;
  const salesReturnCount = d?.salesReturnCount ?? 0;
  const completedRevenueTotalValue = d?.completedRevenueTotal ?? "0";

  const completionPct =
    orderTotalCount > 0 ? Math.round((orderCompletedCount / orderTotalCount) * 1000) / 10 : 0;

  const periodLabel = d?.periodLabel ?? d?.currentMonthLabel ?? "Tháng này";
  const periodRevenueValue = d?.periodRevenueTotal ?? d?.currentMonthRevenueTotal ?? "0";
  const periodImportValue = d?.periodImportTotal ?? d?.currentMonthImportTotal ?? "0";
  const periodNetValue = d?.periodNetIncomeTotal ?? d?.currentMonthNetIncomeTotal ?? "0";
  const previousPeriodLabel = d?.previousPeriodLabel ?? "kỳ trước";
  const previousPeriodRevenueValue = d?.previousPeriodRevenueTotal ?? "0";

  const periodRevenue = parseMoney(periodRevenueValue);
  const periodImport = parseMoney(periodImportValue);
  const periodNet = parseMoney(periodNetValue);
  const periodRevenueChange = parseOptionalNumber(d?.periodRevenueChangePercent);

  const animatedPeriodRevenue = useAnimatedNumber(periodRevenue, 1200);
  const animatedPeriodImport = useAnimatedNumber(periodImport, 1200);
  const animatedPeriodNet = useAnimatedNumber(periodNet, 1200);
  const animatedCompletedRevenue = useAnimatedNumber(parseMoney(completedRevenueTotalValue), 1200);
  const animatedOrderCompletedCount = useAnimatedNumber(orderCompletedCount, 900);
  const animatedLowStockCount = useAnimatedNumber(lowStockCount, 900);
  const animatedSalesReturnCount = useAnimatedNumber(salesReturnCount, 900);
  const animatedProductCount = useAnimatedNumber(productCount, 900);
  const animatedVariantCount = useAnimatedNumber(variantCount, 900);
  const animatedStoreCount = useAnimatedNumber(storeCount, 900);
  const animatedCustomerCount = useAnimatedNumber(customerCount, 900);
  const animatedOrderTotalCount = useAnimatedNumber(orderTotalCount, 900);
  const animatedCompletionPct = useAnimatedNumber(completionPct, 900);

  if (q.isPending) {
    return <PageSkeleton cards={8} />;
  }

  if (q.isError) {
    return <ApiErrorState error={q.error} onRetry={() => void q.refetch()} />;
  }

  if (!d) {
    return <PageSkeleton cards={8} />;
  }

  const flowBase = Math.max(periodRevenue, periodImport, Math.abs(periodNet), 1);
  const periodNetVariant = netTone(periodNet);
  const periodRevenueTrendVariant = changeTone(periodRevenueChange);
  const PeriodRevenueTrendIcon =
    periodRevenueChange == null
      ? Minus
      : periodRevenueChange > 0
        ? TrendingUp
        : periodRevenueChange < 0
          ? TrendingDown
          : Minus;
  const periodLabelLower = periodLabel.toLowerCase();

  const moneyFlowRows = [
    {
      label: `Thu nhập ${periodLabelLower}`,
      value: animatedPeriodRevenue,
      hint: "Tổng từ đơn bán hoàn tất",
      ratio: toPercent(animatedPeriodRevenue, flowBase),
      color: "#0ea5e9",
    },
    {
      label: `Nhập kho bao tiền ${periodLabelLower}`,
      value: animatedPeriodImport,
      hint: "Tổng từ phiếu nhập hoàn tất",
      ratio: toPercent(animatedPeriodImport, flowBase),
      color: "#f59e0b",
    },
    {
      label: `Thu ròng ${periodLabelLower}`,
      value: animatedPeriodNet,
      hint: "Thu nhập trừ nhập hàng",
      ratio: toPercent(animatedPeriodNet, flowBase),
      color: periodNet >= 0 ? "#22c55e" : "#ef4444",
    },
  ] as const;

  const financeChartTargetData = [
    { name: "Thu nhập", value: periodRevenue, color: "#0ea5e9" },
    { name: "Nhập kho", value: periodImport, color: "#f59e0b" },
    { name: "Thu ròng", value: periodNet, color: periodNet >= 0 ? "#22c55e" : "#ef4444" },
  ];
  const financeChartData = [
    { name: "Thu nhập", value: animatedPeriodRevenue, color: "#0ea5e9" },
    { name: "Nhập kho", value: animatedPeriodImport, color: "#f59e0b" },
    { name: "Thu ròng", value: animatedPeriodNet, color: periodNet >= 0 ? "#22c55e" : "#ef4444" },
  ];
  const financeChartDomain = buildSymmetricDomain(financeChartTargetData.map((entry) => entry.value));
  const financeChartTicks = buildSymmetricTicks(financeChartDomain);

  const quickCards = [
    {
      label: "Đơn hoàn tất",
      value: formatCount(animatedOrderCompletedCount),
      hint: `${completionPct}% trên tổng đơn`,
      icon: ClipboardCheck,
      iconClassName: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Doanh thu tích lũy",
      value: formatVndFromDecimal(animatedCompletedRevenue),
      hint: "Doanh thu tích lũy từ đơn hoàn tất",
      icon: CircleDollarSign,
      iconClassName: "bg-sky-100 text-sky-700",
    },
    {
      label: "Nhập kho bao tiền",
      value: formatVndFromDecimal(animatedPeriodImport),
      hint: `Tổng nhập kho ${periodLabelLower}`,
      icon: ArrowDownToLine,
      iconClassName: "bg-amber-100 text-amber-700",
    },
    {
      label: "Cảnh báo tồn thấp",
      value: formatCount(animatedLowStockCount),
      hint: lowStockCount > 0 ? "Có SKU cần nhập thêm" : "Không có SKU thiếu hàng",
      icon: TriangleAlert,
      iconClassName: lowStockCount > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Trả hàng",
      value: formatCount(animatedSalesReturnCount),
      hint: "Tổng phiếu trả hàng đã ghi nhận",
      icon: RotateCcw,
      iconClassName: "bg-violet-100 text-violet-700",
    },
  ] as const;

  const systemOverview = [
    { label: "Sản phẩm", value: formatCount(animatedProductCount), hint: "Mặt hàng đang quản lý" },
    { label: "Biến thể", value: formatCount(animatedVariantCount), hint: "Dòng SKU đang bán" },
    { label: "Cửa hàng", value: formatCount(animatedStoreCount), hint: "Điểm bán trong phạm vi" },
    { label: "Khách hàng", value: formatCount(animatedCustomerCount), hint: "Khách hàng đã lưu" },
    { label: "Tổng đơn", value: formatCount(animatedOrderTotalCount), hint: "Tất cả trạng thái" },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm md:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-sky-200/45 blur-3xl" />

        <div className="relative grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <ChartColumnIncreasing className="h-3.5 w-3.5" />
                Điều hành tài chính
              </Badge>
              <Badge variant="outline">Kỳ: {periodLabel}</Badge>
              <div className="ml-auto flex items-center gap-2 rounded-lg border bg-white/85 p-1">
                <label htmlFor="dashboard-period" className="px-1 text-xs text-muted-foreground">
                  Xem theo
                </label>
                <select
                  id="dashboard-period"
                  className={periodSelectClass}
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}
                >
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Trọng tâm {periodLabelLower}: thu nhập, nhập kho bao tiền và chênh lệch thu - nhập.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-sky-200/60 bg-white/85 shadow-none">
                <CardHeader className="space-y-1 pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardDescription className="flex items-center gap-1 text-sky-700">
                      <ArrowUpRight className="h-3.5 w-3.5" /> Thu nhập {periodLabelLower}
                    </CardDescription>
                    <Badge variant={periodRevenueTrendVariant} className="gap-1">
                      <PeriodRevenueTrendIcon className="h-3.5 w-3.5" />
                      {periodRevenueChange == null ? "Chưa có nền" : formatSignedPercent(periodRevenueChange)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl tabular-nums text-sky-700">
                    {formatVndFromDecimal(animatedPeriodRevenue)}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    So với {previousPeriodLabel}: {formatVndFromDecimal(previousPeriodRevenueValue)}
                  </p>
                </CardHeader>
              </Card>

              <Card className="border-amber-200/60 bg-white/85 shadow-none">
                <CardHeader className="space-y-1 pb-2">
                  <CardDescription className="flex items-center gap-1 text-amber-700">
                    <ArrowDownToLine className="h-3.5 w-3.5" /> Nhập kho bao tiền
                  </CardDescription>
                  <CardTitle className="text-xl tabular-nums text-amber-700">
                    {formatVndFromDecimal(animatedPeriodImport)}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground">Tổng chi nhập kho {periodLabelLower}</p>
                </CardHeader>
              </Card>

              <Card className="bg-white/85 shadow-none">
                <CardHeader className="space-y-1 pb-2">
                  <CardDescription>Chênh lệch thu - nhập</CardDescription>
                  <CardTitle className="text-xl tabular-nums">
                    {formatVndFromDecimal(animatedPeriodNet)}
                  </CardTitle>
                  <Badge variant={periodNetVariant} className="w-fit">
                    {periodNet > 0 ? "Đang dương" : periodNet < 0 ? "Đang âm" : "Cân bằng"}
                  </Badge>
                </CardHeader>
              </Card>
            </div>
          </div>

          <Card className="border-emerald-200/60 bg-white/85 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dòng tiền {periodLabelLower}</CardTitle>
              <CardDescription>So sánh nhanh giữa thu nhập, nhập hàng và thu ròng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {moneyFlowRows.map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-sm font-semibold tabular-nums">{formatVndFromDecimal(row.value)}</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/70">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(row.ratio, 4)}%`, backgroundColor: row.color }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{row.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {quickCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                <div className="space-y-1">
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="text-xl tabular-nums">{card.value}</CardTitle>
                </div>
                <div className={`rounded-lg p-2 ${card.iconClassName}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{card.hint}</CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-lg">Biểu đồ thanh dòng tiền {periodLabelLower}</CardTitle>
            <CardDescription>Mốc giữa là 0: thanh sang phải là dương, sang trái là âm.</CardDescription>
          </CardHeader>
          <CardContent className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={financeChartData}
                margin={{ top: 8, right: 88, left: 8, bottom: 8 }}
                barCategoryGap={18}
              >
                <CartesianGrid strokeDasharray="4 4" horizontal={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={82}
                />
                <XAxis
                  type="number"
                  domain={financeChartDomain}
                  ticks={financeChartTicks}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => compactAmount(v)}
                />
                <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="5 5" />
                <Tooltip
                  formatter={(value: number) => [formatVndFromDecimal(value), "Giá trị"]}
                  contentStyle={{ borderRadius: 10 }}
                />
                <Bar
                  dataKey="value"
                  radius={6}
                  barSize={28}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {financeChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" content={(props) => <FinanceValueLabel {...(props as FinanceValueLabelProps)} />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tổng quan hệ thống</CardTitle>
            <CardDescription>Các chỉ số đếm giúp nắm quy mô vận hành hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemOverview.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.hint}</p>
                </div>
                <p className="text-base font-semibold tabular-nums">{row.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className={lowStockCount > 0 ? "border-amber-200 bg-amber-50/40" : "border-emerald-200 bg-emerald-50/40"}>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Trọng tâm xử lý hôm nay</CardTitle>
            {lowStockCount > 0 ? (
              <Badge variant="warning" className="gap-1">
                <PackagePlus className="h-3.5 w-3.5" />
                Ưu tiên nhập thêm hàng
              </Badge>
            ) : (
              <Badge variant="success">Tồn kho ổn định</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg border bg-white/80 p-3">
            <p className="text-xs text-muted-foreground">Mức hoàn tất đơn</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{Math.round(animatedCompletionPct * 10) / 10}%</p>
            <p className="text-xs text-muted-foreground">Đơn hoàn tất / tổng đơn</p>
          </div>
          <div className="rounded-lg border bg-white/80 p-3">
            <p className="text-xs text-muted-foreground">Cảnh báo tồn kho thấp</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatCount(animatedLowStockCount)} SKU</p>
            <p className="text-xs text-muted-foreground">
              {lowStockCount > 0 ? "Nên xử lý nhập hàng để tránh thiếu bán" : "Không có SKU cần bổ sung gấp"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
          <Store className="h-3.5 w-3.5" />
          {formatCount(animatedStoreCount)} cửa hàng trong phạm vi xem
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
          <Users className="h-3.5 w-3.5" />
          {formatCount(animatedCustomerCount)} khách hàng đang quản lý
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
          <Boxes className="h-3.5 w-3.5" />
          {formatCount(animatedVariantCount)} biến thể đang bán
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
          <RotateCcw className="h-3.5 w-3.5" />
          {formatCount(animatedSalesReturnCount)} phiếu trả hàng
        </div>
      </div>
    </div>
  );
}
