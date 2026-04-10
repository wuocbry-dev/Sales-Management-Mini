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

  public record UserDetailResponse(
      Long id,
      String username,
      String email,
      String fullName,
      String phone,
      String status,
      Long defaultStoreId,
      List<RoleRow> roles,
      List<StoreRow> stores) {}
}
