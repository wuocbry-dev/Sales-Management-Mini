package com.quanlybanhang.service;

import com.quanlybanhang.dto.DashboardDtos.ReportSummaryResponse;
import com.quanlybanhang.dto.DashboardDtos.StoreRevenueRow;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Store;
import com.quanlybanhang.repository.SalesOrderRepository;
import com.quanlybanhang.repository.SalesReturnRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportQueryService {

  private final SalesOrderRepository salesOrderRepository;
  private final SalesReturnRepository salesReturnRepository;
  private final StoreRepository storeRepository;
  private final StoreAccessService storeAccessService;

  @Transactional(readOnly = true)
  public ReportSummaryResponse summary() {
    JwtAuthenticatedPrincipal principal = currentPrincipal();
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);

    BigDecimal totalRev;
    long completed;
    long returns;
    long ordersAll;
    List<StoreRevenueRow> rows = new ArrayList<>();

    if (scope == null) {
      totalRev =
          salesOrderRepository.sumTotalAmountByStatus(DomainConstants.ORDER_COMPLETED);
      if (totalRev == null) {
        totalRev = BigDecimal.ZERO;
      }
      completed = salesOrderRepository.countByStatus(DomainConstants.ORDER_COMPLETED);
      returns = salesReturnRepository.count();
      ordersAll = salesOrderRepository.count();
      for (Object[] row :
          salesOrderRepository.aggregateCompletedByStore(DomainConstants.ORDER_COMPLETED)) {
        Long storeId = (Long) row[0];
        BigDecimal sum = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
        Long cnt = (Long) row[2];
        String name =
            storeRepository
                .findById(storeId)
                .map(Store::getStoreName)
                .orElse("Cửa hàng #" + storeId);
        rows.add(
            new StoreRevenueRow(
                storeId,
                name,
                sum.setScale(0, RoundingMode.HALF_UP).toPlainString(),
                cnt));
      }
    } else {
      totalRev =
          salesOrderRepository.sumTotalAmountByStatusAndStoreIdIn(
              DomainConstants.ORDER_COMPLETED, scope);
      if (totalRev == null) {
        totalRev = BigDecimal.ZERO;
      }
      completed =
          salesOrderRepository.countByStatusAndStoreIdIn(
              DomainConstants.ORDER_COMPLETED, scope);
      returns = salesReturnRepository.countReturnsForStoreIds(scope);
      ordersAll = salesOrderRepository.countByStoreIdIn(scope);
      for (Object[] row :
          salesOrderRepository.aggregateCompletedByStoreAndStoreIdIn(
              DomainConstants.ORDER_COMPLETED, scope)) {
        Long storeId = (Long) row[0];
        BigDecimal sum = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
        Long cnt = (Long) row[2];
        String name =
            storeRepository
                .findById(storeId)
                .map(Store::getStoreName)
                .orElse("Cửa hàng #" + storeId);
        rows.add(
            new StoreRevenueRow(
                storeId,
                name,
                sum.setScale(0, RoundingMode.HALF_UP).toPlainString(),
                cnt));
      }
    }

    BigDecimal aov =
        completed > 0
            ? totalRev.divide(BigDecimal.valueOf(completed), 0, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
    BigDecimal returnRate =
        ordersAll == 0
            ? BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP)
            : BigDecimal.valueOf(100.0 * returns / ordersAll)
                .setScale(1, RoundingMode.HALF_UP);

    return new ReportSummaryResponse(
        totalRev.setScale(0, RoundingMode.HALF_UP).toPlainString(),
        completed,
        aov.toPlainString(),
        returnRate.toPlainString(),
        rows);
  }

  private static JwtAuthenticatedPrincipal currentPrincipal() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof JwtAuthenticatedPrincipal p)) {
      throw new IllegalStateException("Thiếu JWT principal.");
    }
    return p;
  }
}
