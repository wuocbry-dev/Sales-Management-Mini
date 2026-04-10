package com.quanlybanhang.repository;

import com.quanlybanhang.model.RolePermission;
import com.quanlybanhang.model.RolePermission.Pk;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Pk> {

  List<RolePermission> findById_RoleId(Long roleId);
}
