package com.quanlybanhang.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class RbacDtos {

  private RbacDtos() {}

  public record RoleListRow(Long id, String roleCode, String roleName, String description) {}

  public record PermissionListRow(
      Long id, String permissionCode, String permissionName, String moduleName, String actionName) {}

  public record PermissionOverrideResponse(
      Long overrideId,
      Long roleId,
      Long permissionId,
      String permissionCode,
      Long storeId,
      Long branchId,
      String overrideType) {}

  public record CreatePermissionOverrideRequest(
      @NotNull Long roleId,
      @NotNull Long permissionId,
      Long storeId,
      Long branchId,
      @NotBlank String overrideType) {}
}
