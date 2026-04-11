package com.quanlybanhang.controller;

import com.quanlybanhang.dto.RbacDtos.CreatePermissionOverrideRequest;
import com.quanlybanhang.dto.RbacDtos.PermissionListRow;
import com.quanlybanhang.dto.RbacDtos.PermissionOverrideResponse;
import com.quanlybanhang.dto.RbacDtos.RoleListRow;
import com.quanlybanhang.service.RbacCatalogService;
import com.quanlybanhang.service.RolePermissionOverrideService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rbac")
@RequiredArgsConstructor
public class RbacController {

  private final RbacCatalogService rbacCatalogService;
  private final RolePermissionOverrideService rolePermissionOverrideService;

  @GetMapping("/roles")
  @PreAuthorize(
      "@authz.systemManage(authentication) or hasAuthority('ROLE_VIEW') or hasAuthority('RBAC_MANAGE')")
  public Page<RoleListRow> listRoles(Pageable pageable) {
    return rbacCatalogService.listRoles(pageable);
  }

  @GetMapping("/permissions")
  @PreAuthorize(
      "@authz.systemManage(authentication) or hasAuthority('PERMISSION_VIEW') or hasAuthority('RBAC_MANAGE')")
  public Page<PermissionListRow> listPermissions(Pageable pageable) {
    return rbacCatalogService.listPermissions(pageable);
  }

  @GetMapping("/permission-overrides")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PERMISSION_OVERRIDE_MANAGE')")
  public List<PermissionOverrideResponse> listOverrides(@RequestParam(required = false) Long roleId) {
    return rolePermissionOverrideService.listByRole(roleId);
  }

  @PostMapping("/permission-overrides")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PERMISSION_OVERRIDE_MANAGE')")
  public PermissionOverrideResponse createOverride(@Valid @RequestBody CreatePermissionOverrideRequest req) {
    return rolePermissionOverrideService.create(req);
  }

  @DeleteMapping("/permission-overrides/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('PERMISSION_OVERRIDE_MANAGE')")
  public void deleteOverride(@PathVariable Long id) {
    rolePermissionOverrideService.delete(id);
  }
}
