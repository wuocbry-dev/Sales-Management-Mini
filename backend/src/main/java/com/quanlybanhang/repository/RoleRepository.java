package com.quanlybanhang.repository;

import com.quanlybanhang.model.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {

  boolean existsByRoleCode(String roleCode);

  Optional<Role> findByRoleCode(String roleCode);
}
