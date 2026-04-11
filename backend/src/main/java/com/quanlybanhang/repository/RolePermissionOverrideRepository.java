package com.quanlybanhang.repository;

import com.quanlybanhang.model.RolePermissionOverride;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionOverrideRepository extends JpaRepository<RolePermissionOverride, Long> {

  List<RolePermissionOverride> findByRoleIdInAndStoreIdIsNullAndBranchIdIsNull(
      Collection<Long> roleIds);

  List<RolePermissionOverride> findByRoleIdOrderById(Long roleId);

  List<RolePermissionOverride> findAllByOrderByIdAsc();
}
