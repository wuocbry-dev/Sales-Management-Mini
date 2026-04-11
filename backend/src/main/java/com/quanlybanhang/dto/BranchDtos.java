package com.quanlybanhang.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class BranchDtos {

  private BranchDtos() {}

  public record BranchRequest(
      @NotBlank @Size(max = 50) String branchCode,
      @NotBlank @Size(max = 255) String branchName,
      @Size(max = 20) String phone,
      @Email @Size(max = 100) String email,
      @Size(max = 255) String address,
      @NotBlank @Size(max = 8) String status) {}

  public record BranchResponse(
      Long branchId,
      Long storeId,
      String branchCode,
      String branchName,
      String phone,
      String email,
      String address,
      String status) {}
}
