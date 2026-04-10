package com.quanlybanhang.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class CustomerDtos {

  private CustomerDtos() {}

  public record CustomerRequest(
      @NotBlank @Size(max = 50) String customerCode,
      @NotBlank @Size(max = 150) String fullName,
      @Size(max = 20) String phone,
      @Size(max = 100) String email,
      @Size(max = 6) String gender,
      LocalDate dateOfBirth,
      @Size(max = 255) String address,
      @NotBlank @Size(max = 8) String status) {}

  public record CustomerResponse(
      Long id,
      String customerCode,
      String fullName,
      String phone,
      String email,
      String gender,
      LocalDate dateOfBirth,
      String address,
      Integer loyaltyPoints,
      BigDecimal totalSpent,
      String status,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}
}
