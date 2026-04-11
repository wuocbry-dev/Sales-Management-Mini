package com.quanlybanhang.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class UserDtos {

  private UserDtos() {}

  public record CreateUserRequest(
      @NotBlank @Size(max = 50) String username,
      @NotBlank @Email @Size(max = 100) String email,
      @NotBlank @Size(min = 6, max = 100) String password,
      @NotBlank @Size(max = 150) String fullName,
      @Size(max = 20) String phone,
      Long defaultStoreId,
      @NotEmpty List<Long> roleIds,
      List<Long> storeIds,
      Long primaryStoreId) {}

  public record UpdateUserRequest(
      @NotBlank @Email @Size(max = 100) String email,
      @NotBlank @Size(max = 150) String fullName,
      @Size(max = 20) String phone,
      Long defaultStoreId) {}

  public record UpdateUserStatusRequest(
      @NotBlank
          @Pattern(
              regexp = "(?i)ACTIVE|INACTIVE|LOCKED",
              message = "status phải là ACTIVE, INACTIVE hoặc LOCKED")
      String status) {}

  public record AssignRolesRequest(@NotEmpty List<Long> roleIds) {}

  public record AssignStoresRequest(
      @NotNull List<Long> storeIds, Long primaryStoreId) {}

  public record AssignBranchesRequest(@NotNull List<Long> branchIds, Long primaryBranchId) {}

  public record UserResponse(
      Long id,
      String username,
      String email,
      String fullName,
      String status,
      Long defaultStoreId,
      List<String> roleCodes) {}

  public record RoleRow(Long id, String roleCode, String roleName) {}

  public record StoreRow(Long storeId, String storeCode, String storeName, boolean primary) {}

  public record BranchRow(
      Long branchId, Long storeId, String branchCode, String branchName, boolean primary) {}

  public record UserDetailResponse(
      Long id,
      String username,
      String email,
      String fullName,
      String phone,
      String status,
      Long defaultStoreId,
      List<RoleRow> roles,
      List<StoreRow> stores,
      List<BranchRow> branches) {}

  /** Tạo nhân viên (CASHIER / WAREHOUSE_STAFF) bởi STORE_MANAGER hoặc quản trị. */
  public record CreateStoreStaffRequest(
      @NotBlank @Size(max = 50) String username,
      @NotBlank @Size(min = 6, max = 100) String password,
      @NotBlank @Size(max = 150) String fullName,
      @Size(max = 20) String phone,
      @Size(max = 100)
          @Pattern(
              regexp = "^$|^[\\w.+-]+@[\\w.-]+\\.[A-Za-z0-9-]{2,}$",
              message = "email không hợp lệ")
      String email,
      @NotBlank @Size(max = 50) String roleCode,
      @NotNull Long branchId,
      @Pattern(
              regexp = "(?i)ACTIVE|INACTIVE|LOCKED",
              message = "status phải là ACTIVE, INACTIVE hoặc LOCKED")
          String status) {}

  public record StoreStaffResponse(
      Long userId,
      String username,
      String fullName,
      String roleCode,
      Long storeId,
      Long branchId,
      String status,
      java.time.LocalDateTime createdAt) {}

  public record ChangeStoreStaffBranchRequest(@NotNull Long newBranchId) {}

  public record ChangeStoreStaffBranchResponse(
      Long userId,
      String username,
      String fullName,
      String roleCode,
      Long storeId,
      Long oldBranchId,
      Long newBranchId,
      String status,
      java.time.LocalDateTime updatedAt) {}
}
