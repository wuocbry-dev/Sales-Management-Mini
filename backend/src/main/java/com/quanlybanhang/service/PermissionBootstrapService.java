package com.quanlybanhang.service;

import com.quanlybanhang.model.Permission;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.model.RolePermission;
import com.quanlybanhang.model.RolePermission.Pk;
import com.quanlybanhang.repository.PermissionRepository;
import com.quanlybanhang.repository.RolePermissionRepository;
import com.quanlybanhang.repository.RoleRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Đồng bộ bảng {@code permissions} và {@code role_permissions} với mã quyền dùng trong
 * controller — idempotent, bổ sung quyền/liên kết còn thiếu (không xóa tay trong DB).
 *
 * <p>Khớp tài liệu {@code Docx/sql/DataBase.sql}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionBootstrapService {

  private final PermissionRepository permissionRepository;
  private final RoleRepository roleRepository;
  private final RolePermissionRepository rolePermissionRepository;

  private record PermDef(String code, String name, String module, String action) {}

  /** Thứ tự ổn định — SYSTEM_ADMIN và ADMIN nhận toàn bộ. */
  private static final List<PermDef> ALL_DEFS =
      List.of(
          new PermDef("DASHBOARD_VIEW", "Vào màn Điều hành", "DASHBOARD", "VIEW"),
          new PermDef("RBAC_MANAGE", "Quản lý ma trận phân quyền (UI)", "RBAC", "MANAGE"),
          new PermDef("USER_VIEW", "Xem người dùng", "USER", "VIEW"),
          new PermDef("USER_CREATE", "Tạo người dùng", "USER", "CREATE"),
          new PermDef("USER_UPDATE", "Sửa người dùng", "USER", "UPDATE"),
          new PermDef("USER_LOCK", "Khóa/mở tài khoản", "USER", "LOCK"),
          new PermDef(
              "USER_ASSIGN_BRANCH",
              "Gán user vào chi nhánh (trong phạm vi store)",
              "USER",
              "ASSIGN_BRANCH"),
          new PermDef("ROLE_VIEW", "Xem vai trò", "ROLE", "VIEW"),
          new PermDef("ROLE_CREATE", "Tạo vai trò", "ROLE", "CREATE"),
          new PermDef("ROLE_UPDATE", "Sửa vai trò", "ROLE", "UPDATE"),
          new PermDef("PERMISSION_VIEW", "Xem quyền", "PERMISSION", "VIEW"),
          new PermDef("PERMISSION_ASSIGN", "Gán quyền cho vai trò (global)", "PERMISSION", "ASSIGN"),
          new PermDef(
              "PERMISSION_OVERRIDE_MANAGE",
              "Ghi đè quyền theo Store/Branch",
              "RBAC",
              "OVERRIDE"),
          new PermDef("STORE_VIEW", "Xem cửa hàng", "STORE", "VIEW"),
          new PermDef("STORE_CREATE", "Tạo cửa hàng", "STORE", "CREATE"),
          new PermDef("STORE_UPDATE", "Sửa cửa hàng", "STORE", "UPDATE"),
          new PermDef("BRANCH_VIEW", "Xem chi nhánh", "BRANCH", "VIEW"),
          new PermDef("BRANCH_CREATE", "Tạo chi nhánh", "BRANCH", "CREATE"),
          new PermDef("BRANCH_UPDATE", "Sửa chi nhánh", "BRANCH", "UPDATE"),
          new PermDef("PRODUCT_VIEW", "Xem sản phẩm", "PRODUCT", "VIEW"),
          new PermDef("PRODUCT_CREATE", "Tạo sản phẩm", "PRODUCT", "CREATE"),
          new PermDef("PRODUCT_UPDATE", "Sửa sản phẩm", "PRODUCT", "UPDATE"),
          new PermDef("INVENTORY_VIEW", "Xem tồn kho", "INVENTORY", "VIEW"),
          new PermDef(
              "INVENTORY_TRANSACTION_VIEW",
              "Xem lịch sử biến động tồn kho",
              "INVENTORY",
              "TRANSACTION_VIEW"),
          new PermDef("GOODS_RECEIPT_VIEW", "Xem phiếu nhập", "GOODS_RECEIPT", "VIEW"),
          new PermDef("GOODS_RECEIPT_CREATE", "Tạo phiếu nhập", "GOODS_RECEIPT", "CREATE"),
          new PermDef("GOODS_RECEIPT_CONFIRM", "Xác nhận phiếu nhập", "GOODS_RECEIPT", "CONFIRM"),
          new PermDef("TRANSFER_VIEW", "Xem chuyển kho", "TRANSFER", "VIEW"),
          new PermDef("TRANSFER_CREATE", "Tạo chuyển kho", "TRANSFER", "CREATE"),
          new PermDef("TRANSFER_SEND", "Gửi chuyển kho", "TRANSFER", "SEND"),
          new PermDef("TRANSFER_RECEIVE", "Nhận chuyển kho", "TRANSFER", "RECEIVE"),
          new PermDef("STOCKTAKE_VIEW", "Xem kiểm kho", "STOCKTAKE", "VIEW"),
          new PermDef("STOCKTAKE_CREATE", "Tạo kiểm kho", "STOCKTAKE", "CREATE"),
          new PermDef("STOCKTAKE_CONFIRM", "Xác nhận kiểm kho", "STOCKTAKE", "CONFIRM"),
          new PermDef("ORDER_VIEW", "Xem đơn hàng", "ORDER", "VIEW"),
          new PermDef("ORDER_CREATE", "Tạo đơn hàng", "ORDER", "CREATE"),
          new PermDef("ORDER_CONFIRM", "Xác nhận đơn hàng", "ORDER", "CONFIRM"),
          new PermDef("ORDER_CANCEL", "Hủy đơn hàng", "ORDER", "CANCEL"),
          new PermDef("RETURN_VIEW", "Xem trả hàng", "RETURN", "VIEW"),
          new PermDef("RETURN_CREATE", "Tạo trả hàng", "RETURN", "CREATE"),
          new PermDef("RETURN_CONFIRM", "Xác nhận trả hàng", "RETURN", "CONFIRM"),
          new PermDef("CUSTOMER_VIEW", "Xem khách hàng", "CUSTOMER", "VIEW"),
          new PermDef("CUSTOMER_CREATE", "Tạo khách hàng", "CUSTOMER", "CREATE"),
          new PermDef("CUSTOMER_UPDATE", "Sửa khách hàng", "CUSTOMER", "UPDATE"),
          new PermDef("REPORT_VIEW", "Xem báo cáo", "REPORT", "VIEW"),
          new PermDef(
              "REPORT_VIEW_BRANCH", "Xem báo cáo theo chi nhánh", "REPORT", "VIEW_BRANCH"),
          new PermDef("AUDIT_LOG_VIEW", "Xem nhật ký kiểm toán", "AUDIT", "VIEW"));

  /**
   * Quản lý cửa hàng: tạo/sửa cửa hàng (onboarding), chi nhánh, nghiệp vụ — không RBAC toàn hệ
   * thống. Phạm vi dữ liệu vẫn theo JWT {@code storeIds} / {@code branchIds} ở từng service.
   */
  private static final Set<String> STORE_MANAGER =
      Set.of(
          "DASHBOARD_VIEW",
          "STORE_VIEW",
          "STORE_CREATE",
          "STORE_UPDATE",
          "USER_VIEW",
          "USER_ASSIGN_BRANCH",
          "BRANCH_VIEW",
          "BRANCH_CREATE",
          "BRANCH_UPDATE",
          "PRODUCT_VIEW",
          "PRODUCT_CREATE",
          "PRODUCT_UPDATE",
          "INVENTORY_VIEW",
          "INVENTORY_TRANSACTION_VIEW",
          "GOODS_RECEIPT_VIEW",
          "GOODS_RECEIPT_CREATE",
          "GOODS_RECEIPT_CONFIRM",
          "TRANSFER_VIEW",
          "TRANSFER_CREATE",
          "TRANSFER_SEND",
          "TRANSFER_RECEIVE",
          "STOCKTAKE_VIEW",
          "STOCKTAKE_CREATE",
          "STOCKTAKE_CONFIRM",
          "ORDER_VIEW",
          "ORDER_CREATE",
          "ORDER_CONFIRM",
          "ORDER_CANCEL",
          "RETURN_VIEW",
          "RETURN_CREATE",
          "RETURN_CONFIRM",
          "CUSTOMER_VIEW",
          "CUSTOMER_CREATE",
          "CUSTOMER_UPDATE",
          "REPORT_VIEW");

  /** Vận hành POS + kho trên branch + BRANCH_VIEW + báo cáo chi nhánh — không RBAC toàn hệ thống. */
  private static final Set<String> BRANCH_MANAGER =
      Set.of(
          "DASHBOARD_VIEW",
          "STORE_VIEW",
          "BRANCH_VIEW",
          "PRODUCT_VIEW",
          "INVENTORY_VIEW",
          "INVENTORY_TRANSACTION_VIEW",
          "GOODS_RECEIPT_VIEW",
          "GOODS_RECEIPT_CREATE",
          "GOODS_RECEIPT_CONFIRM",
          "TRANSFER_VIEW",
          "TRANSFER_CREATE",
          "TRANSFER_SEND",
          "TRANSFER_RECEIVE",
          "STOCKTAKE_VIEW",
          "STOCKTAKE_CREATE",
          "STOCKTAKE_CONFIRM",
          "ORDER_VIEW",
          "ORDER_CREATE",
          "ORDER_CONFIRM",
          "ORDER_CANCEL",
          "RETURN_VIEW",
          "RETURN_CREATE",
          "RETURN_CONFIRM",
          "CUSTOMER_VIEW",
          "CUSTOMER_CREATE",
          "CUSTOMER_UPDATE",
          "REPORT_VIEW_BRANCH");

  /**
   * Thu ngân tối thiểu: sản phẩm, tồn kho (đọc), đơn (xem/tạo/xác nhận), khách (xem/tạo). Thanh
   * toán nằm trong luồng xác nhận đơn — không tách PAYMENT_CREATE. Không dashboard / hủy đơn /
   * trả hàng / sửa KH (override qua DB nếu cần).
   */
  private static final Set<String> CASHIER =
      Set.of(
          "PRODUCT_VIEW",
          "INVENTORY_VIEW",
          "ORDER_VIEW",
          "ORDER_CREATE",
          "ORDER_CONFIRM",
          "CUSTOMER_VIEW",
          "CUSTOMER_CREATE");

  /**
   * Nhân viên kho tối thiểu: sản phẩm (xem), tồn kho + lịch sử biến động, nhập/chuyển/kiểm kho —
   * không POS, không KH, không dashboard / trả hàng (override DB nếu cần).
   */
  private static final Set<String> WAREHOUSE_STAFF =
      Set.of(
          "PRODUCT_VIEW",
          "INVENTORY_VIEW",
          "INVENTORY_TRANSACTION_VIEW",
          "GOODS_RECEIPT_VIEW",
          "GOODS_RECEIPT_CREATE",
          "GOODS_RECEIPT_CONFIRM",
          "TRANSFER_VIEW",
          "TRANSFER_CREATE",
          "TRANSFER_SEND",
          "TRANSFER_RECEIVE",
          "STOCKTAKE_VIEW",
          "STOCKTAKE_CREATE",
          "STOCKTAKE_CONFIRM");

  @Transactional
  public void ensurePermissionsAndRoleGrants() {
    LocalDateTime now = LocalDateTime.now();
    Map<String, Long> idByCode = new LinkedHashMap<>();
    for (PermDef def : ALL_DEFS) {
      Permission p =
          permissionRepository
              .findByPermissionCode(def.code())
              .orElseGet(
                  () -> {
                    Permission x = new Permission();
                    x.setPermissionCode(def.code());
                    x.setPermissionName(def.name());
                    x.setModuleName(def.module());
                    x.setActionName(def.action());
                    x.setCreatedAt(now);
                    Permission saved = permissionRepository.save(x);
                    log.info("Đã thêm permission: {}", def.code());
                    return saved;
                  });
      idByCode.put(def.code(), p.getId());
    }

    grantAllToRole("SYSTEM_ADMIN", idByCode.keySet(), idByCode);
    grantAllToRole("ADMIN", idByCode.keySet(), idByCode);
    grantAllToRole("STORE_MANAGER", STORE_MANAGER, idByCode);
    grantAllToRole("BRANCH_MANAGER", BRANCH_MANAGER, idByCode);
    grantAllToRole("CASHIER", CASHIER, idByCode);
    grantAllToRole("WAREHOUSE_STAFF", WAREHOUSE_STAFF, idByCode);
  }

  private void grantAllToRole(
      String roleCode, Set<String> permissionCodes, Map<String, Long> idByCode) {
    Role role =
        roleRepository
            .findByRoleCode(roleCode)
            .orElseThrow(
                () ->
                    new IllegalStateException(
                        "Thiếu role " + roleCode + " — chạy RoleBootstrapService trước."));
    for (String code : permissionCodes) {
      Long permId = idByCode.get(code);
      if (permId == null) {
        continue;
      }
      Pk pk = new Pk(role.getId(), permId);
      if (!rolePermissionRepository.existsById(pk)) {
        RolePermission link = new RolePermission();
        link.setId(pk);
        rolePermissionRepository.save(link);
        log.debug("Gán {} → {}", roleCode, code);
      }
    }
  }
}
