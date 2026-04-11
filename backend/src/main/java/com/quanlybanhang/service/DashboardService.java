package com.quanlybanhang.service;

import com.quanlybanhang.dto.DashboardDtos.DashboardKpisResponse;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.repository.CustomerRepository;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.ProductRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.SalesOrderRepository;
import com.quanlybanhang.repository.SalesReturnRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

  private final ProductRepository productRepository;
  private final ProductVariantRepository productVariantRepository;
  private final StoreRepository storeRepository;
  private final CustomerRepository customerRepository;
  private final SalesOrderRepository salesOrderRepository;
  private final InventoryRepository inventoryRepository;
  private final SalesReturnRepository salesReturnRepository;
  private final StoreAccessService storeAccessService;

  @Transactional(readOnly = true)
  public DashboardKpisResponse kpis() {
    JwtAuthenticatedPrincipal principal = currentPrincipal();
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);

    long storeCount;
    long orderCount;
    long completedCount;
    BigDecimal rev;
    long lowStock;
    long returnCount;

    if (scope == null) {
      storeCount = storeRepository.count();
      orderCount = salesOrderRepository.count();
      completedCount = salesOrderRepository.countByStatus(DomainConstants.ORDER_COMPLETED);
      rev = salesOrderRepository.sumTotalAmountByStatus(DomainConstants.ORDER_COMPLETED);
      lowStock = inventoryRepository.countLowStock();
      returnCount = salesReturnRepository.count();
    } else {
      storeCount = scope.size();
      orderCount = salesOrderRepository.countByStoreIdIn(scope);
      completedCount =
          salesOrderRepository.countByStatusAndStoreIdIn(
              DomainConstants.ORDER_COMPLETED, scope);
      rev =
          salesOrderRepository.sumTotalAmountByStatusAndStoreIdIn(
              DomainConstants.ORDER_COMPLETED, scope);
      lowStock = inventoryRepository.countLowStockByStoreIdIn(scope);
      returnCount = salesReturnRepository.countReturnsForStoreIds(scope);
    }

    if (rev == null) {
      rev = BigDecimal.ZERO;
    }

    return new DashboardKpisResponse(
        productRepository.count(),
        productVariantRepository.count(),
        storeCount,
        customerRepository.count(),
        orderCount,
        completedCount,
        rev.setScale(0, RoundingMode.HALF_UP).toPlainString(),
        lowStock,
        returnCount);
  }

  private static JwtAuthenticatedPrincipal currentPrincipal() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof JwtAuthenticatedPrincipal p)) {
      throw new IllegalStateException("Thiếu JWT principal.");
    }
    return p;
  }
}
