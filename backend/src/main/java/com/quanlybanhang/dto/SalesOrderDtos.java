package com.quanlybanhang.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class SalesOrderDtos {

  private SalesOrderDtos() {}

  public record SalesOrderLineRequest(
      @NotNull Long variantId,
      @NotNull @DecimalMin(value = "0.0001") BigDecimal quantity,
      @NotNull @DecimalMin(value = "0") BigDecimal unitPrice,
      @NotNull @DecimalMin(value = "0") BigDecimal discountAmount) {}

  public record SalesOrderCreateRequest(
      @NotNull Long storeId,
      Long customerId,
      @NotNull LocalDateTime orderDate,
      @NotNull @DecimalMin(value = "0") BigDecimal headerDiscountAmount,
      @Size(max = 500) String note,
      @NotEmpty @Valid List<SalesOrderLineRequest> lines) {}

  public record PaymentLineRequest(
      @NotBlank @Size(max = 6) String paymentType,
      @NotBlank @Size(max = 13) String paymentMethod,
      @NotNull @DecimalMin(value = "0") BigDecimal amount,
      @Size(max = 100) String referenceNo,
      @Size(max = 255) String note) {}

  /** Khi tổng đơn > 0, danh sách thanh toán không được rỗng và tổng phải khớp total_amount. */
  public record SalesOrderConfirmRequest(@Valid List<PaymentLineRequest> payments) {}

  public record SalesOrderItemResponse(
      Long id,
      Long variantId,
      BigDecimal quantity,
      BigDecimal unitPrice,
      BigDecimal discountAmount,
      BigDecimal lineTotal) {}

  public record PaymentResponse(
      Long id,
      Long storeId,
      Long orderId,
      String paymentType,
      String paymentMethod,
      BigDecimal amount,
      String referenceNo,
      String note,
      LocalDateTime paidAt,
      Long createdBy,
      LocalDateTime createdAt) {}

  public record SalesOrderResponse(
      Long id,
      String orderCode,
      Long storeId,
      Long customerId,
      Long cashierId,
      LocalDateTime orderDate,
      String status,
      BigDecimal subtotal,
      BigDecimal discountAmount,
      BigDecimal totalAmount,
      BigDecimal paidAmount,
      String paymentStatus,
      String note,
      LocalDateTime createdAt,
      LocalDateTime updatedAt,
      List<SalesOrderItemResponse> items,
      List<PaymentResponse> payments) {}
}
