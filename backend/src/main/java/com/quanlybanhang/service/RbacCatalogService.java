package com.quanlybanhang.service;

import com.quanlybanhang.dto.RbacDtos.PermissionListRow;
import com.quanlybanhang.dto.RbacDtos.RoleListRow;
import com.quanlybanhang.model.Permission;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.repository.PermissionRepository;
import com.quanlybanhang.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RbacCatalogService {

  private final RoleRepository roleRepository;
  private final PermissionRepository permissionRepository;

  @Transactional(readOnly = true)
  public Page<RoleListRow> listRoles(Pageable pageable) {
    return roleRepository.findAll(pageable).map(this::toRoleRow);
  }

  @Transactional(readOnly = true)
  public Page<PermissionListRow> listPermissions(Pageable pageable) {
    return permissionRepository.findAll(pageable).map(this::toPermRow);
  }

  private RoleListRow toRoleRow(Role r) {
    return new RoleListRow(
        r.getId(), r.getRoleCode(), r.getRoleName(), r.getDescription());
  }

  private PermissionListRow toPermRow(Permission p) {
    return new PermissionListRow(
        p.getId(),
        p.getPermissionCode(),
        p.getPermissionName(),
        p.getModuleName(),
        p.getActionName());
  }
}
