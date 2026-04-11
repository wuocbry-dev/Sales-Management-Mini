package com.quanlybanhang.service;

import com.quanlybanhang.model.Role;
import com.quanlybanhang.repository.RoleRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bổ sung các role mặc định nếu DB chưa seed (đăng ký công khai dùng STORE_MANAGER theo AuthService).
 * Giá trị khớp {@code Docx/sql/DataBase.sql}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoleBootstrapService {

  private final RoleRepository roleRepository;

  private static final Object[][] DEFAULT_ROLES = {
    {"SYSTEM_ADMIN", "System Admin", "Quản trị toàn hệ thống (JWT/RBAC đầy đủ)"},
    {"ADMIN", "Admin (legacy)", "Tương đương quyền cao — giữ tương thích DB cũ"},
    {"STORE_MANAGER", "Store Manager", "Quản lý cửa hàng"},
    {"BRANCH_MANAGER", "Branch Manager", "Quản lý chi nhánh / vận hành không tạo cửa hàng"},
    {"CASHIER", "Cashier", "Thu ngân / nhân viên bán hàng"},
    {"WAREHOUSE_STAFF", "Warehouse Staff", "Nhân viên kho"}
  };

  @Transactional
  public void ensureDefaultRolesExist() {
    LocalDateTime now = LocalDateTime.now();
    for (Object[] row : DEFAULT_ROLES) {
      String code = (String) row[0];
      if (roleRepository.existsByRoleCode(code)) {
        continue;
      }
      Role role = new Role();
      role.setRoleCode(code);
      role.setRoleName((String) row[1]);
      role.setDescription((String) row[2]);
      role.setCreatedAt(now);
      role.setUpdatedAt(now);
      roleRepository.save(role);
      log.info("Đã tạo role mặc định thiếu: {}", code);
    }
  }
}
