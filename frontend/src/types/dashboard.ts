/** Khớp `DashboardDtos.DashboardKpisResponse`. */
export type DashboardPeriod = "week" | "month" | "quarter";

export type DashboardKpisResponse = {
  productCount: number;
  variantCount: number;
  storeCount: number;
  customerCount: number;
  orderTotalCount: number;
  orderCompletedCount: number;
  completedRevenueTotal: string;
  lowStockCount: number;
  salesReturnCount: number;
  periodKey: DashboardPeriod;
  periodLabel: string;
  periodRevenueTotal: string;
  periodImportTotal: string;
  periodNetIncomeTotal: string;
  previousPeriodLabel: string;
  previousPeriodRevenueTotal: string;
  periodRevenueChangePercent: string | null;
};
