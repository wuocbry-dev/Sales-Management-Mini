package com.quanlybanhang.repository;

import com.quanlybanhang.model.AppUser;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Repository cho bảng `users` — entity `AppUser`. */
public interface UserRepository extends JpaRepository<AppUser, Long> {

  Optional<AppUser> findByUsername(String username);

  Optional<AppUser> findByEmailIgnoreCase(String email);

  @Query(
      "SELECT u FROM AppUser u WHERE LOWER(u.username) = LOWER(:login)"
          + " OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(:login))")
  Optional<AppUser> findByUsernameOrEmail(@Param("login") String login);

  boolean existsByUsername(String username);

  boolean existsByEmailIgnoreCase(String email);

  @Query(
      "SELECT DISTINCT u FROM AppUser u WHERE "
          + "EXISTS (SELECT 1 FROM UserStore us WHERE us.id.userId = u.id AND us.id.storeId = :storeId) "
          + "OR EXISTS (SELECT 1 FROM UserBranch ub JOIN Branch b ON b.id = ub.id.branchId "
          + "WHERE ub.id.userId = u.id AND b.storeId = :storeId)")
  Page<AppUser> pageUsersLinkedToStore(@Param("storeId") Long storeId, Pageable pageable);

  @Query(
      "SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM AppUser u WHERE u.id = :userId AND ("
          + "EXISTS (SELECT 1 FROM UserStore us WHERE us.id.userId = u.id AND us.id.storeId = :storeId) OR "
          + "EXISTS (SELECT 1 FROM UserBranch ub JOIN Branch b ON b.id = ub.id.branchId "
          + "WHERE ub.id.userId = u.id AND b.storeId = :storeId))")
  boolean existsUserLinkedToStore(@Param("userId") Long userId, @Param("storeId") Long storeId);

  /** Nhân viên bán hàng / kho trong phạm vi một hoặc nhiều cửa hàng. */
  @Query(
      "SELECT DISTINCT u FROM AppUser u "
          + "JOIN UserRoleAssignment ura ON ura.id.userId = u.id "
          + "JOIN Role r ON r.id = ura.id.roleId "
          + "WHERE r.roleCode IN ('CASHIER', 'WAREHOUSE_STAFF') "
          + "AND (:roleCode IS NULL OR r.roleCode = :roleCode) "
          + "AND (:status IS NULL OR u.status = :status) "
          + "AND (:branchId IS NULL OR EXISTS (SELECT 1 FROM UserBranch ub "
          + "WHERE ub.id.userId = u.id AND ub.id.branchId = :branchId)) "
          + "AND (EXISTS (SELECT 1 FROM UserStore us WHERE us.id.userId = u.id "
          + "AND us.id.storeId IN :storeIds) OR EXISTS (SELECT 1 FROM UserBranch ub2 "
          + "JOIN Branch b ON b.id = ub2.id.branchId WHERE ub2.id.userId = u.id "
          + "AND b.storeId IN :storeIds))")
  Page<AppUser> pageStoreStaffInStores(
      @Param("storeIds") java.util.List<Long> storeIds,
      @Param("roleCode") String roleCode,
      @Param("branchId") Long branchId,
      @Param("status") String status,
      Pageable pageable);

  /** Toàn hệ thống (quản trị): mọi CASHIER / WAREHOUSE_STAFF. */
  @Query(
      "SELECT DISTINCT u FROM AppUser u "
          + "JOIN UserRoleAssignment ura ON ura.id.userId = u.id "
          + "JOIN Role r ON r.id = ura.id.roleId "
          + "WHERE r.roleCode IN ('CASHIER', 'WAREHOUSE_STAFF') "
          + "AND (:roleCode IS NULL OR r.roleCode = :roleCode) "
          + "AND (:status IS NULL OR u.status = :status) "
          + "AND (:branchId IS NULL OR EXISTS (SELECT 1 FROM UserBranch ub "
          + "WHERE ub.id.userId = u.id AND ub.id.branchId = :branchId))")
  Page<AppUser> pageStoreStaffAll(
      @Param("roleCode") String roleCode,
      @Param("branchId") Long branchId,
      @Param("status") String status,
      Pageable pageable);
}
