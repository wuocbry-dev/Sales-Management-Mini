package com.quanlybanhang.repository;

import com.quanlybanhang.model.Permission;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

  Optional<Permission> findByPermissionCode(String permissionCode);
}
