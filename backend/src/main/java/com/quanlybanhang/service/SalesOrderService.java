package com.quanlybanhang.service;

import com.quanlybanhang.dto.SalesOrderDtos.PaymentLineRequest;
import com.quanlybanhang.dto.SalesOrderDtos.PaymentResponse;
import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderConfirmRequest;
import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderCreateRequest;
import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderItemResponse;
import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderLineRequest;
import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Branch;
import com.quanlybanhang.model.Inventory;
import com.quanlybanhang.model.InventoryTransaction;
import com.quanlybanhang.model.Payment;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.model.SalesOrder;
import com.quanlybanhang.model.SalesOrderItem;
import com.quanlybanhang.model.Warehouse;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.repository.CustomerRepository;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.repository.PaymentRepository;
import com.quanlybanhang.repository.ProductRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.SalesOrderRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class SalesOrderService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final SalesOrderRepository salesOrderRepository;
  private final PaymentRepository paymentRepository;
  private final InventoryRepository inventoryRepository;
  private final InventoryTransactionRepository inventoryTransactionRepository;
  private final ProductVariantRepository variantRepository;
  private final ProductRepository productRepository;
  private final StoreRepository storeRepository;
  private final CustomerRepository customerRepository;
  private final StoreAccessService storeAccessService;
  private final BranchRepository branchRepository;
  private final WarehouseService warehouseService;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  public Page<SalesOrderResponse> list(Pageable pageable, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    if (scope == null) {
      return salesOrderRepository.findAll(pageable).map(this::toSummaryResponse);
    }
    return salesOrderRepository.findByStoreIdIn(scope, pageable).map(this::toSummaryResponse);
  }

  public SalesOrderResponse get(Long id, JwtAuthenticatedPrincipal principal) {
    SalesOrder o =
        salesOrderRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + id));
    assertOrderStoreAllowed(o.getStoreId(), principal);
    return toFullResponse(o);
  }

  public SalesOrderResponse getByOrderCode(
      String orderCode, long storeId, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    String code = orderCode == null ? "" : orderCode.trim();
    if (code.isEmpty()) {
      throw new BusinessException("Thiếu mã đơn hàng.");
    }
    SalesOrder o =
        salesOrderRepository
            .findWithItemsByStoreIdAndOrderCode(storeId, code)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn với mã: " + code));
    return toFullResponse(o);
  }

  @Transactional
  public SalesOrderResponse createDraft(
      SalesOrderCreateRequest req, long cashierId, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(req.storeId(), principal);
    if (!storeRepository.existsById(req.storeId())) {
      throw new BusinessException("Cửa hàng không tồn tại: " + req.storeId());
    }
    if (req.customerId() != null
        && !customerRepository.existsByIdAndStoreId(req.customerId(), req.storeId())) {
      throw new BusinessException(
          "Khách hàng không thuộc cửa hàng của đơn: " + req.customerId());
    }
    for (SalesOrderLineRequest line : req.lines()) {
      if (!variantRepository.existsById(line.variantId())) {
        throw new BusinessException("Biến thể không tồn tại: " + line.variantId());
      }
      Long variantStoreId =
          productRepository
              .findStoreIdByVariantId(line.variantId())
              .orElseThrow(() -> new BusinessException("Biến thể không tồn tại: " + line.variantId()));
      if (!variantStoreId.equals(req.storeId())) {
        throw new BusinessException("Biến thể không thuộc cửa hàng của đơn.");
      }
    }
    Long effectiveBranchId = resolveEffectiveBranchId(req, principal);
    if (effectiveBranchId != null) {
      Branch br =
          branchRepository
              .findById(effectiveBranchId)
              .orElseThrow(() -> new BusinessException("Chi nhánh không tồn tại: " + effectiveBranchId));
      if (!br.getStoreId().equals(req.storeId())) {
        throw new BusinessException("Chi nhánh không thuộc cửa hàng của đơn.");
      }
    }
    LocalDateTime t = now();
    SalesOrder o = new SalesOrder();
    o.setOrderCode(nextOrderCode());
    o.setStoreId(req.storeId());
    o.setBranchId(effectiveBranchId);
    o.setCustomerId(req.customerId());
    o.setCashierId(cashierId);
    o.setOrderDate(req.orderDate());
    o.setStatus(DomainConstants.ORDER_DRAFT);
    o.setNote(req.note());
    o.setPaidAmount(BigDecimal.ZERO);
    o.setPaymentStatus(DomainConstants.PAYMENT_STATUS_UNPAID);
    o.setCreatedAt(t);
    o.setUpdatedAt(t);

    BigDecimal subtotal = BigDecimal.ZERO;
    for (SalesOrderLineRequest line : req.lines()) {
      BigDecimal lineTotal = lineTotal(line);
      subtotal = subtotal.add(lineTotal);
      SalesOrderItem item = new SalesOrderItem();
      item.setVariantId(line.variantId());
      item.setQuantity(line.quantity());
      item.setUnitPrice(line.unitPrice());
      item.setDiscountAmount(line.discountAmount());
      item.setLineTotal(lineTotal);
      o.addLine(item);
    }

    BigDecimal headerDiscount = req.headerDiscountAmount().max(BigDecimal.ZERO);
    BigDecimal taxableAmount = subtotal.subtract(headerDiscount).max(BigDecimal.ZERO);
    BigDecimal vatRatePercent = normalizeVatRatePercent(req.vatRatePercent());
    BigDecimal computedVatAmount =
        taxableAmount
            .multiply(vatRatePercent)
            .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
    if (req.vatAmount() != null && !moneyEquals(req.vatAmount(), computedVatAmount)) {
      throw new BusinessException(
          "VAT không hợp lệ (gửi " + req.vatAmount() + ", hệ thống tính " + computedVatAmount + ").");
    }

    o.setSubtotal(subtotal);
    o.setDiscountAmount(headerDiscount);
    o.setTotalAmount(taxableAmount.add(computedVatAmount));

    salesOrderRepository.save(o);
    return get(o.getId(), principal);
  }

  private static BigDecimal normalizeVatRatePercent(BigDecimal raw) {
    if (raw == null) {
      return BigDecimal.ZERO;
    }
    BigDecimal normalized = raw.max(BigDecimal.ZERO);
    if (normalized.compareTo(new BigDecimal("100")) > 0) {
      throw new BusinessException("VAT % phải trong khoảng 0-100.");
    }
    return normalized;
  }

  private Long resolveEffectiveBranchId(
      SalesOrderCreateRequest req, JwtAuthenticatedPrincipal principal) {
    Long branchFromHeader = readBranchIdFromHeader();
    Long requestedBranchId = req.branchId() != null ? req.branchId() : branchFromHeader;

    if (storeAccessService.isBranchOnlyScoped(principal)) {
      List<Long> branchScope = storeAccessService.dataBranchScopeOrDeny(principal);
      if (requestedBranchId == null) {
        if (branchScope.size() == 1) {
          return branchScope.getFirst();
        }
        throw new BusinessException("Tài khoản được gán nhiều chi nhánh, vui lòng chọn chi nhánh.");
      }
      if (!branchScope.contains(requestedBranchId)) {
        throw new BusinessException("Không có quyền thao tác trên chi nhánh đã chọn.");
      }
      return requestedBranchId;
    }

    if (requestedBranchId == null) {
      return null;
    }

    storeAccessService.assertCanAccessBranch(requestedBranchId, principal);
    return requestedBranchId;
  }

  private Long readBranchIdFromHeader() {
    var attrs = RequestContextHolder.getRequestAttributes();
    if (!(attrs instanceof ServletRequestAttributes servletAttrs)) {
      return null;
    }
    String raw = servletAttrs.getRequest().getHeader("X-Branch-Id");
    if (raw == null || raw.isBlank()) {
      return null;
    }
    String value = raw.trim();
    try {
      long parsed = Long.parseLong(value);
      if (parsed <= 0) {
        throw new BusinessException("Header X-Branch-Id phải là số nguyên dương.");
      }
      return parsed;
    } catch (NumberFormatException ex) {
      throw new BusinessException("Header X-Branch-Id không hợp lệ: " + value);
    }
  }

  @Transactional
  public SalesOrderResponse confirm(
      Long orderId, SalesOrderConfirmRequest req, long userId, JwtAuthenticatedPrincipal principal) {
    SalesOrder o =
        salesOrderRepository
            .findWithItemsById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại: " + orderId));
    assertOrderStoreAllowed(o.getStoreId(), principal);

    if (!DomainConstants.ORDER_DRAFT.equals(o.getStatus())) {
      throw new BusinessException("Chỉ đơn trạng thái draft mới xác nhận.");
    }
    if (o.getItems().isEmpty()) {
      throw new BusinessException("Đơn không có dòng chi tiết.");
    }

    List<PaymentLineRequest> payments =
        req.payments() == null ? List.of() : req.payments();

    validatePaymentsVsTotal(o.getTotalAmount(), payments);

    Warehouse fulfillWh =
        warehouseService.resolveFulfillmentWarehouse(o.getStoreId(), o.getBranchId());

    for (SalesOrderItem line : o.getItems()) {
      Inventory inv =
          inventoryRepository
              .findByWarehouseIdAndVariantId(fulfillWh.getId(), line.getVariantId())
              .orElseThrow(
                  () ->
                      new BusinessException(
                          "Không có bản ghi tồn kho cho variant " + line.getVariantId()));
      BigDecimal available =
          inv.getQuantityOnHand().subtract(inv.getReservedQty());
      if (available.compareTo(line.getQuantity()) < 0) {
        throw new BusinessException(
            "Không đủ tồn kho (variant "
                + line.getVariantId()
                + ", cần "
                + line.getQuantity()
                + ", khả dụng "
                + available
                + ")");
      }
    }

    LocalDateTime t = now();

    for (PaymentLineRequest pl : payments) {
      Payment p = new Payment();
      p.setStoreId(o.getStoreId());
      p.setOrderId(o.getId());
      p.setReturnId(null);
      p.setPaymentType(pl.paymentType());
      p.setPaymentMethod(pl.paymentMethod());
      p.setAmount(pl.amount());
      p.setReferenceNo(pl.referenceNo());
      p.setNote(pl.note());
      p.setPaidAt(t);
      p.setCreatedBy(userId);
      p.setCreatedAt(t);
      paymentRepository.save(p);
    }

    for (SalesOrderItem line : o.getItems()) {
      ProductVariant variant =
          variantRepository
              .findById(line.getVariantId())
              .orElseThrow(
                  () ->
                      new BusinessException(
                          "Biến thể không tồn tại: " + line.getVariantId()));
      Inventory inv =
          inventoryRepository
              .findByWarehouseIdAndVariantId(fulfillWh.getId(), line.getVariantId())
              .orElseThrow();
      if (inv.getStoreId() == null) {
        inv.setStoreId(fulfillWh.getStoreId());
      }
      BigDecimal before = inv.getQuantityOnHand();
      BigDecimal after = before.subtract(line.getQuantity());
      inv.setQuantityOnHand(after);
      inv.setUpdatedAt(t);
      inventoryRepository.save(inv);

      InventoryTransaction tx = new InventoryTransaction();
      tx.setStoreId(o.getStoreId());
      tx.setWarehouseId(fulfillWh.getId());
      tx.setVariantId(line.getVariantId());
      tx.setTransactionType(DomainConstants.INV_TX_SALE);
      tx.setReferenceType(DomainConstants.REF_TYPE_SALES_ORDER);
      tx.setReferenceId(o.getId());
      tx.setQtyChange(line.getQuantity().negate());
      tx.setQtyBefore(before);
      tx.setQtyAfter(after);
      tx.setUnitCost(variant.getCostPrice());
      tx.setNote(null);
      tx.setCreatedBy(userId);
      tx.setCreatedAt(t);
      inventoryTransactionRepository.save(tx);
    }

    BigDecimal paidSum =
        payments.stream().map(PaymentLineRequest::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
    o.setPaidAmount(paidSum);
    o.setPaymentStatus(DomainConstants.PAYMENT_STATUS_PAID);
    o.setStatus(DomainConstants.ORDER_COMPLETED);
    o.setUpdatedAt(t);
    salesOrderRepository.save(o);

    return get(orderId, principal);
  }

  private static void validatePaymentsVsTotal(
      BigDecimal totalAmount, List<PaymentLineRequest> payments) {
    BigDecimal sum =
        payments.stream().map(PaymentLineRequest::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
    if (totalAmount.compareTo(BigDecimal.ZERO) > 0) {
      if (payments.isEmpty()) {
        throw new BusinessException("Đơn có tổng > 0 cần ít nhất một dòng thanh toán.");
      }
      if (!moneyEquals(sum, totalAmount)) {
        throw new BusinessException(
            "Tổng thanh toán ("
                + sum
                + ") phải bằng tổng đơn ("
                + totalAmount
                + ").");
      }
    } else {
      if (!payments.isEmpty() && sum.compareTo(BigDecimal.ZERO) != 0) {
        throw new BusinessException("Đơn 0 đồng: không gửi thanh toán hoặc thanh toán = 0.");
      }
    }
  }

  private static boolean moneyEquals(BigDecimal a, BigDecimal b) {
    return a.setScale(4, RoundingMode.HALF_UP).compareTo(b.setScale(4, RoundingMode.HALF_UP)) == 0;
  }

  @Transactional
  public SalesOrderResponse cancel(Long id, JwtAuthenticatedPrincipal principal) {
    SalesOrder o =
        salesOrderRepository.findById(id).orElseThrow(() -> notFound(id));
    assertOrderStoreAllowed(o.getStoreId(), principal);
    if (!DomainConstants.ORDER_DRAFT.equals(o.getStatus())) {
      throw new BusinessException("Chỉ hủy được đơn ở trạng thái draft.");
    }
    o.setStatus(DomainConstants.ORDER_CANCELLED);
    o.setUpdatedAt(now());
    salesOrderRepository.save(o);
    return get(id, principal);
  }

  private void assertOrderStoreAllowed(long storeId, JwtAuthenticatedPrincipal principal) {
    try {
      storeAccessService.assertCanAccessStore(storeId, principal);
    } catch (AccessDeniedException e) {
      throw new AccessDeniedException("Không có quyền thao tác đơn hàng này.");
    }
  }

  private static BigDecimal lineTotal(SalesOrderLineRequest line) {
    BigDecimal gross =
        line.quantity().multiply(line.unitPrice()).setScale(4, RoundingMode.HALF_UP);
    return gross.subtract(line.discountAmount()).max(BigDecimal.ZERO);
  }

  private String nextOrderCode() {
    String datePart = DateTimeFormatter.BASIC_ISO_DATE.format(java.time.LocalDate.now(ZONE));
    for (int i = 0; i < 8; i++) {
      String code = "SO-" + datePart + "-" + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
      if (!salesOrderRepository.existsByOrderCode(code)) {
        return code;
      }
    }
    throw new BusinessException("Không tạo được mã đơn hàng.");
  }

  private SalesOrderResponse toSummaryResponse(SalesOrder o) {
    return new SalesOrderResponse(
        o.getId(),
        o.getOrderCode(),
        o.getStoreId(),
        o.getBranchId(),
        o.getCustomerId(),
        o.getCashierId(),
        o.getOrderDate(),
        o.getStatus(),
        o.getSubtotal(),
        o.getDiscountAmount(),
        o.getTotalAmount(),
        o.getPaidAmount(),
        o.getPaymentStatus(),
        o.getNote(),
        o.getCreatedAt(),
        o.getUpdatedAt(),
        List.of(),
        List.of());
  }

  private SalesOrderResponse toFullResponse(SalesOrder o) {
    Map<Long, String[]> variantLabels =
      variantRepository.findOptionsByIdIn(o.getItems().stream().map(SalesOrderItem::getVariantId).distinct().toList())
        .stream()
        .collect(
          java.util.stream.Collectors.toMap(
            com.quanlybanhang.repository.ProductVariantOptionProjection::getId,
            p -> new String[] {p.getProductName(), p.getVariantName()}));
    List<SalesOrderItemResponse> items =
        o.getItems().stream()
            .map(
                i ->
            {
              String[] labels = variantLabels.get(i.getVariantId());
              return new SalesOrderItemResponse(
                i.getId(),
                i.getVariantId(),
                labels != null ? labels[0] : null,
                labels != null ? labels[1] : null,
                i.getQuantity(),
                i.getUnitPrice(),
                i.getDiscountAmount(),
                i.getLineTotal());
            })
        .toList();
    List<PaymentResponse> pays =
      paymentRepository.findByOrderIdOrderByIdAsc(o.getId()).stream().map(this::toPaymentResponse).toList();
    return new SalesOrderResponse(
      o.getId(),
      o.getOrderCode(),
      o.getStoreId(),
      o.getBranchId(),
      o.getCustomerId(),
      o.getCashierId(),
      o.getOrderDate(),
      o.getStatus(),
      o.getSubtotal(),
      o.getDiscountAmount(),
      o.getTotalAmount(),
      o.getPaidAmount(),
      o.getPaymentStatus(),
      o.getNote(),
      o.getCreatedAt(),
      o.getUpdatedAt(),
      items,
      pays);
  }

  private PaymentResponse toPaymentResponse(Payment p) {
    return new PaymentResponse(
        p.getId(),
        p.getStoreId(),
        p.getOrderId(),
        p.getPaymentType(),
        p.getPaymentMethod(),
        p.getAmount(),
        p.getReferenceNo(),
        p.getNote(),
        p.getPaidAt(),
        p.getCreatedBy(),
        p.getCreatedAt());
  }

  private static ResourceNotFoundException notFound(Long id) {
    return new ResourceNotFoundException("Đơn hàng không tồn tại: " + id);
  }
}
