package com.quanlybanhang.dto;

import java.util.List;

public final class DashboardDtos {

  private DashboardDtos() {}

  public record DashboardKpisResponse(
      long productCount,
      long variantCount,
      long storeCount,
      long customerCount,
      long orderTotalCount,
      long orderCompletedCount,
      String completedRevenueTotal,
      long lowStockCount,
      long salesReturnCount) {}

  public record StoreRevenueRow(
      long storeId, String storeName, String revenueTotal, long orderCount) {}

  public record ReportSummaryResponse(
      String completedRevenueTotal,
      long completedOrderCount,
      String averageOrderValue,
      String returnRatePercent,
      List<StoreRevenueRow> revenueByStore) {}
}
