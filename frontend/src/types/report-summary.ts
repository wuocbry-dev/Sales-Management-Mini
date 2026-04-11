/** Khớp backend `DashboardDtos.ReportSummaryResponse`. */

export type StoreRevenueRow = {
  storeId: number;
  storeName: string;
  revenueTotal: string;
  orderCount: number;
};

export type ReportSummaryResponse = {
  completedRevenueTotal: string;
  completedOrderCount: number;
  averageOrderValue: string;
  returnRatePercent: string;
  revenueByStore: StoreRevenueRow[];
};
