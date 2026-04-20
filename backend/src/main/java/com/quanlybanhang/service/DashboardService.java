package com.quanlybanhang.service;

import com.quanlybanhang.dto.DashboardDtos.DashboardKpisResponse;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.repository.CustomerRepository;
import com.quanlybanhang.repository.GoodsReceiptRepository;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.ProductRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.SalesOrderRepository;
import com.quanlybanhang.repository.SalesReturnRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

  private static final List<String> RECEIPT_COMPLETED_STATUSES = List.of("completed", "confirmed");

  private final ProductRepository productRepository;
  private final ProductVariantRepository productVariantRepository;
  private final StoreRepository storeRepository;
  private final CustomerRepository customerRepository;
  private final SalesOrderRepository salesOrderRepository;
  private final GoodsReceiptRepository goodsReceiptRepository;
  private final InventoryRepository inventoryRepository;
  private final SalesReturnRepository salesReturnRepository;
  private final StoreAccessService storeAccessService;

  @Transactional(readOnly = true)
  public DashboardKpisResponse kpis(String periodRaw) {
    JwtAuthenticatedPrincipal principal = currentPrincipal();
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    DashboardPeriod period = DashboardPeriod.fromQuery(periodRaw);

    LocalDateTime now = LocalDate.now().atStartOfDay();
    LocalDateTime periodStart = period.periodStart(now);
    LocalDateTime periodEnd = period.nextPeriodStart(periodStart);
    LocalDateTime previousPeriodStart = period.previousPeriodStart(periodStart);
    LocalDateTime previousPeriodEnd = periodStart;

    long storeCount;
    long customerCount;
    long orderCount;
    long completedCount;
    BigDecimal rev;
    BigDecimal periodRevenue;
    BigDecimal periodImport;
    BigDecimal previousPeriodRevenue;
    long lowStock;
    long returnCount;

    if (scope == null) {
      storeCount = storeRepository.count();
      customerCount = customerRepository.count();
      orderCount = salesOrderRepository.count();
      completedCount = salesOrderRepository.countByStatus(DomainConstants.ORDER_COMPLETED);
      rev = salesOrderRepository.sumTotalAmountByStatus(DomainConstants.ORDER_COMPLETED);
      periodRevenue =
          salesOrderRepository.sumTotalAmountByStatusAndOrderDateRange(
              DomainConstants.ORDER_COMPLETED, periodStart, periodEnd);
      periodImport =
          goodsReceiptRepository.sumTotalAmountByStatusInAndReceiptDateRange(
            RECEIPT_COMPLETED_STATUSES, periodStart, periodEnd);
      previousPeriodRevenue =
          salesOrderRepository.sumTotalAmountByStatusAndOrderDateRange(
              DomainConstants.ORDER_COMPLETED, previousPeriodStart, previousPeriodEnd);
      lowStock = inventoryRepository.countLowStock();
      returnCount = salesReturnRepository.count();
    } else {
      storeCount = scope.size();
      customerCount = customerRepository.countByStoreIdIn(scope);
      orderCount = salesOrderRepository.countByStoreIdIn(scope);
      completedCount =
          salesOrderRepository.countByStatusAndStoreIdIn(
              DomainConstants.ORDER_COMPLETED, scope);
      rev =
          salesOrderRepository.sumTotalAmountByStatusAndStoreIdIn(
              DomainConstants.ORDER_COMPLETED, scope);
      periodRevenue =
          salesOrderRepository.sumTotalAmountByStatusAndStoreIdInAndOrderDateRange(
              DomainConstants.ORDER_COMPLETED, scope, periodStart, periodEnd);
      periodImport =
          goodsReceiptRepository.sumTotalAmountByStatusInAndStoreIdInAndReceiptDateRange(
            RECEIPT_COMPLETED_STATUSES, scope, periodStart, periodEnd);
      previousPeriodRevenue =
          salesOrderRepository.sumTotalAmountByStatusAndStoreIdInAndOrderDateRange(
              DomainConstants.ORDER_COMPLETED, scope, previousPeriodStart, previousPeriodEnd);
      lowStock = inventoryRepository.countLowStockByStoreIdIn(scope);
      returnCount = salesReturnRepository.countReturnsForStoreIds(scope);
    }

    if (rev == null) {
      rev = BigDecimal.ZERO;
    }
    if (periodRevenue == null) {
      periodRevenue = BigDecimal.ZERO;
    }
    if (periodImport == null) {
      periodImport = BigDecimal.ZERO;
    }
    if (previousPeriodRevenue == null) {
      previousPeriodRevenue = BigDecimal.ZERO;
    }
    BigDecimal periodNetIncome = periodRevenue.subtract(periodImport);
    String periodRevenueChangePercent = toPercentChangeString(periodRevenue, previousPeriodRevenue);

    long productCount;
    long variantCount;
    if (scope == null) {
      productCount = productRepository.count();
      variantCount = productVariantRepository.count();
    } else {
      productCount = productRepository.countByStoreIdIn(scope);
      variantCount = productVariantRepository.countByProductStoreIdIn(scope);
    }

    return new DashboardKpisResponse(
        productCount,
        variantCount,
        storeCount,
        customerCount,
        orderCount,
        completedCount,
        toMoneyString(rev),
        lowStock,
        returnCount,
        period.apiValue,
        period.currentLabel,
        toMoneyString(periodRevenue),
        toMoneyString(periodImport),
        toMoneyString(periodNetIncome),
        period.previousLabel,
        toMoneyString(previousPeriodRevenue),
        periodRevenueChangePercent);
  }

  private static String toMoneyString(BigDecimal value) {
    BigDecimal safe = value == null ? BigDecimal.ZERO : value;
    return safe.setScale(0, RoundingMode.HALF_UP).toPlainString();
  }

  private static String toPercentChangeString(BigDecimal current, BigDecimal previous) {
    BigDecimal prev = previous == null ? BigDecimal.ZERO : previous;
    if (prev.compareTo(BigDecimal.ZERO) <= 0) {
      return null;
    }

    BigDecimal deltaPercent =
        current
            .subtract(prev)
            .multiply(BigDecimal.valueOf(100))
            .divide(prev, 1, RoundingMode.HALF_UP);
    return deltaPercent.toPlainString();
  }

  private enum DashboardPeriod {
    WEEK("week", "Tuần này", "Tuần trước"),
    MONTH("month", "Tháng này", "Tháng trước"),
    QUARTER("quarter", "Quý này", "Quý trước");

    private final String apiValue;
    private final String currentLabel;
    private final String previousLabel;

    DashboardPeriod(String apiValue, String currentLabel, String previousLabel) {
      this.apiValue = apiValue;
      this.currentLabel = currentLabel;
      this.previousLabel = previousLabel;
    }

    private static DashboardPeriod fromQuery(String raw) {
      if (raw == null) return MONTH;
      return switch (raw.trim().toLowerCase()) {
        case "week" -> WEEK;
        case "quarter" -> QUARTER;
        case "month" -> MONTH;
        default -> MONTH;
      };
    }

    private LocalDateTime periodStart(LocalDateTime now) {
      LocalDate day = now.toLocalDate();
      return switch (this) {
        case WEEK -> day.with(DayOfWeek.MONDAY).atStartOfDay();
        case MONTH -> day.withDayOfMonth(1).atStartOfDay();
        case QUARTER -> {
          int quarterStartMonth = ((day.getMonthValue() - 1) / 3) * 3 + 1;
          yield LocalDate.of(day.getYear(), quarterStartMonth, 1).atStartOfDay();
        }
      };
    }

    private LocalDateTime nextPeriodStart(LocalDateTime periodStart) {
      return switch (this) {
        case WEEK -> periodStart.plusWeeks(1);
        case MONTH -> periodStart.plusMonths(1);
        case QUARTER -> periodStart.plusMonths(3);
      };
    }

    private LocalDateTime previousPeriodStart(LocalDateTime periodStart) {
      return switch (this) {
        case WEEK -> periodStart.minusWeeks(1);
        case MONTH -> periodStart.minusMonths(1);
        case QUARTER -> periodStart.minusMonths(3);
      };
    }
  }

  private static JwtAuthenticatedPrincipal currentPrincipal() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof JwtAuthenticatedPrincipal p)) {
      throw new IllegalStateException("Thiếu JWT principal.");
    }
    return p;
  }
}
