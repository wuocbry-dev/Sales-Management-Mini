package com.quanlybanhang.service;

import com.quanlybanhang.dto.UserDtos.AssignBranchesRequest;
import com.quanlybanhang.dto.UserDtos.AssignRolesRequest;
import com.quanlybanhang.dto.UserDtos.AssignStoresRequest;
import com.quanlybanhang.dto.UserDtos.BranchRow;
import com.quanlybanhang.dto.UserDtos.ChangeStoreStaffBranchRequest;
import com.quanlybanhang.dto.UserDtos.ChangeStoreStaffBranchResponse;
import com.quanlybanhang.dto.UserDtos.CreateStoreStaffRequest;
import com.quanlybanhang.dto.UserDtos.CreateUserRequest;
import com.quanlybanhang.dto.UserDtos.RoleRow;
import com.quanlybanhang.dto.UserDtos.StoreRow;
import com.quanlybanhang.dto.UserDtos.StoreStaffResponse;
import com.quanlybanhang.dto.UserDtos.UpdateStoreStaffRequest;
import com.quanlybanhang.dto.UserDtos.UpdateUserRequest;
import com.quanlybanhang.dto.UserDtos.UpdateUserStatusRequest;
import com.quanlybanhang.dto.UserDtos.UserDetailResponse;
import com.quanlybanhang.dto.UserDtos.UserResponse;
import com.quanlybanhang.exception.AuthApiException;
import com.quanlybanhang.exception.AuthErrorCodes;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.AppUser;
import com.quanlybanhang.model.Branch;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.model.Store;
import com.quanlybanhang.model.UserBranch;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.model.UserStore;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.UserBranchRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import com.quanlybanhang.repository.UserStoreRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

  private final AppUserRepository appUserRepository;
  private final RoleRepository roleRepository;
  private final StoreRepository storeRepository;
  private final UserRoleAssignmentRepository userRoleAssignmentRepository;
  private final UserStoreRepository userStoreRepository;
  private final UserBranchRepository userBranchRepository;
  private final BranchRepository branchRepository;
  private final PasswordEncoder passwordEncoder;
  private final StoreAccessService storeAccessService;

  @Transactional(readOnly = true)
  public Page<UserResponse> list(Pageable pageable) {
    return appUserRepository.findAll(pageable).map(this::toUserResponse);
  }

  @Transactional(readOnly = true)
  public UserDetailResponse get(Long id) {
    return toDetail(loadUser(id));
  }

  @Transactional
  public UserDetailResponse create(CreateUserRequest req) {
    String username = req.username().trim();
    if (appUserRepository.existsByUsername(username)) {
      throw new BusinessException("Tên đăng nhập đã được sử dụng.");
    }
    String email = req.email().trim();
    if (appUserRepository.existsByEmailIgnoreCase(email)) {
      throw new BusinessException("Email đã được sử dụng.");
    }
    assertRolesExist(req.roleIds());
    List<Long> storeIds = req.storeIds() != null ? req.storeIds() : List.of();
    assertStoresExist(storeIds);
    if (req.defaultStoreId() != null) {
      if (!storeRepository.existsById(req.defaultStoreId())) {
        throw new ResourceNotFoundException("Không tìm thấy cửa hàng mặc định.");
      }
    }

    LocalDateTime t = LocalDateTime.now();
    AppUser u = new AppUser();
    u.setUsername(username);
    u.setEmail(email);
    u.setPasswordHash(passwordEncoder.encode(req.password()));
    u.setFullName(req.fullName().trim());
    if (req.phone() != null && !req.phone().isBlank()) {
      u.setPhone(req.phone().trim());
    }
    u.setStatus("ACTIVE");
    u.setCreatedAt(t);
    u.setUpdatedAt(t);
    applyDefaultStore(u, req.defaultStoreId());
    appUserRepository.save(u);

    replaceRoles(u.getId(), req.roleIds());
    replaceStores(u.getId(), storeIds, req.primaryStoreId());

    return get(u.getId());
  }

  @Transactional
  public UserDetailResponse update(Long id, UpdateUserRequest req) {
    AppUser u = loadUser(id);
    String email = req.email().trim();
    appUserRepository
        .findByEmailIgnoreCase(email)
        .ifPresent(
            other -> {
              if (!other.getId().equals(id)) {
                throw new BusinessException("Email đã được sử dụng.");
              }
            });

    u.setEmail(email);
    u.setFullName(req.fullName().trim());
    if (req.phone() == null || req.phone().isBlank()) {
      u.setPhone(null);
    } else {
      u.setPhone(req.phone().trim());
    }
    applyDefaultStore(u, req.defaultStoreId());
    u.setUpdatedAt(LocalDateTime.now());
    appUserRepository.save(u);
    return get(id);
  }

  @Transactional
  public UserDetailResponse updateStatus(Long id, UpdateUserStatusRequest req) {
    AppUser u = loadUser(id);
    u.setStatus(normalizeStatus(req.status()));
    u.setUpdatedAt(LocalDateTime.now());
    appUserRepository.save(u);
    return get(id);
  }

  @Transactional
  public UserDetailResponse assignRoles(Long id, AssignRolesRequest req) {
    loadUser(id);
    assertRolesExist(req.roleIds());
    replaceRoles(id, req.roleIds());
    return get(id);
  }

  @Transactional
  public UserDetailResponse assignStores(Long id, AssignStoresRequest req) {
    loadUser(id);
    List<Long> storeIds = req.storeIds();
    assertStoresExist(storeIds);
    replaceStores(id, storeIds, req.primaryStoreId());
    return get(id);
  }

  @Transactional
  public UserDetailResponse assignBranches(Long id, AssignBranchesRequest req) {
    loadUser(id);
    List<Long> branchIds = req.branchIds();
    assertBranchesExist(branchIds);
    replaceBranches(id, branchIds, req.primaryBranchId());
    return get(id);
  }

  @Transactional(readOnly = true)
  public Page<UserResponse> listUsersForStore(
      long storeId, Pageable pageable, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    return appUserRepository.pageUsersLinkedToStore(storeId, pageable).map(this::toUserResponse);
  }

  @Transactional
  public StoreStaffResponse createStoreStaff(
      CreateStoreStaffRequest req, JwtAuthenticatedPrincipal principal) {
    String roleCodeUpper = req.roleCode() == null ? "" : req.roleCode().trim().toUpperCase();
    if (!"CASHIER".equals(roleCodeUpper) && !"WAREHOUSE_STAFF".equals(roleCodeUpper)) {
      throw new AuthApiException(
          HttpStatus.BAD_REQUEST,
          AuthErrorCodes.INVALID_ROLE_FOR_STORE_MANAGER,
          "Chỉ được tạo role CASHIER hoặc WAREHOUSE_STAFF.");
    }

    Branch branch =
        branchRepository
            .findById(req.branchId())
            .orElseThrow(
                () ->
                    new AuthApiException(
                        HttpStatus.NOT_FOUND,
                        AuthErrorCodes.BRANCH_NOT_FOUND,
                        "Không tìm thấy chi nhánh."));
    long storeId = branch.getStoreId();

    if (!storeAccessService.isFullSystemAccess()) {
      if (principal == null || principal.storeIds().isEmpty()) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN,
            AuthErrorCodes.STORE_MANAGER_NOT_ASSIGNED_TO_STORE,
            "Tài khoản chưa được gán cửa hàng.");
      }
      if (!storeAccessService.canAccessStore(storeId, principal)) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN,
            AuthErrorCodes.BRANCH_NOT_IN_MANAGER_STORE,
            "Chi nhánh không thuộc cửa hàng bạn quản lý.");
      }
    }

    String username = req.username().trim();
    if (appUserRepository.existsByUsername(username)) {
      throw new AuthApiException(
          HttpStatus.CONFLICT,
          AuthErrorCodes.USERNAME_ALREADY_EXISTS,
          "Tên đăng nhập đã được sử dụng.");
    }
    String emailNorm = req.email() == null ? "" : req.email().trim();
    if (!emailNorm.isEmpty() && appUserRepository.existsByEmailIgnoreCase(emailNorm)) {
      throw new AuthApiException(
          HttpStatus.CONFLICT, AuthErrorCodes.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng.");
    }

    Role role =
        roleRepository
            .findByRoleCode(roleCodeUpper)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role."));

    LocalDateTime t = LocalDateTime.now();
    AppUser u = new AppUser();
    u.setUsername(username);
    u.setEmail(emailNorm.isEmpty() ? null : emailNorm);
    u.setPasswordHash(passwordEncoder.encode(req.password()));
    u.setFullName(req.fullName().trim());
    if (req.phone() != null && !req.phone().isBlank()) {
      u.setPhone(req.phone().trim());
    }
    String st =
        req.status() == null || req.status().isBlank()
            ? "ACTIVE"
            : normalizeStatus(req.status());
    u.setStatus(st);
    u.setCreatedAt(t);
    u.setUpdatedAt(t);
    applyDefaultStore(u, storeId);
    appUserRepository.save(u);

    replaceRoles(u.getId(), List.of(role.getId()));
    replaceStores(u.getId(), List.of(storeId), storeId);
    replaceBranches(u.getId(), List.of(branch.getId()), branch.getId());

    return toStoreStaffResponse(u, roleCodeUpper, storeId, branch.getId());
  }

  @Transactional(readOnly = true)
  public Page<StoreStaffResponse> listStoreStaff(
      String roleCode,
      Long branchId,
      String status,
      Long storeIdFilter,
      Pageable pageable,
      JwtAuthenticatedPrincipal principal) {
    String roleFilter = blankToNull(roleCode == null ? null : roleCode.trim().toUpperCase());
    String statusFilter = blankToNull(status == null ? null : normalizeStatus(status));
    if (storeAccessService.isFullSystemAccess()) {
      if (storeIdFilter != null) {
        if (!storeRepository.existsById(storeIdFilter)) {
          throw new ResourceNotFoundException("Không tìm thấy cửa hàng.");
        }
        return appUserRepository
            .pageStoreStaffInStores(
                List.of(storeIdFilter), roleFilter, branchId, statusFilter, pageable)
            .map(u -> toStoreStaffResponseFromUser(u));
      }
      return appUserRepository
          .pageStoreStaffAll(roleFilter, branchId, statusFilter, pageable)
          .map(this::toStoreStaffResponseFromUser);
    }
    if (principal == null || principal.storeIds().isEmpty()) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN,
          AuthErrorCodes.STORE_MANAGER_NOT_ASSIGNED_TO_STORE,
          "Tài khoản chưa được gán cửa hàng.");
    }
    return appUserRepository
        .pageStoreStaffInStores(
            principal.storeIds(), roleFilter, branchId, statusFilter, pageable)
        .map(this::toStoreStaffResponseFromUser);
  }

  @Transactional(readOnly = true)
  public StoreStaffResponse getStoreStaff(Long id, JwtAuthenticatedPrincipal principal) {
    AppUser u = loadUser(id);
    String staffRole = staffRoleCodeForUser(u.getId());
    if (staffRole == null) {
      throw new ResourceNotFoundException("Không tìm thấy nhân viên.");
    }
    if (!storeAccessService.isFullSystemAccess()) {
      if (principal == null) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN, AuthErrorCodes.FORBIDDEN, "Không có quyền.");
      }
      if (!userLinkedToAnyStore(u.getId(), principal.storeIds())) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN, AuthErrorCodes.FORBIDDEN, "Không có quyền xem nhân viên này.");
      }
    }
    return toStoreStaffResponseFromUser(u);
  }

  /**
   * Xóa mềm nhân viên cửa hàng: {@code INACTIVE} — giữ bản ghi, không cho đăng nhập (xem {@link
   * com.quanlybanhang.security.CustomUserDetailsService}).
   */
  @Transactional
  public StoreStaffResponse softDeactivateStoreStaff(
      Long userId, JwtAuthenticatedPrincipal principal) {
    if (principal != null && principal.userId() == userId) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN,
          AuthErrorCodes.CANNOT_DEACTIVATE_SELF,
          "Không thể vô hiệu chính tài khoản đang đăng nhập.");
    }
    AppUser u = loadUser(userId);
    if (!onlyCashierOrWarehouseStaffRoles(userId)) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN,
          AuthErrorCodes.INVALID_TARGET_ROLE,
          "Chỉ được vô hiệu nhân viên CASHIER hoặc WAREHOUSE_STAFF.");
    }
    if (staffRoleCodeForUser(userId) == null) {
      throw new ResourceNotFoundException("Không tìm thấy nhân viên.");
    }
    if (!storeAccessService.isFullSystemAccess()) {
      if (principal == null) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN, AuthErrorCodes.FORBIDDEN, "Không có quyền.");
      }
      if (!userLinkedToAnyStore(userId, principal.storeIds())) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN,
            AuthErrorCodes.FORBIDDEN,
            "Không có quyền vô hiệu nhân viên này.");
      }
    }
    if (isInactiveUserStatus(u.getStatus())) {
      return toStoreStaffResponseFromUser(u);
    }
    LocalDateTime t = LocalDateTime.now();
    u.setStatus("INACTIVE");
    u.setUpdatedAt(t);
    appUserRepository.save(u);
    return toStoreStaffResponseFromUser(u);
  }

  /**
   * Điều chuyển nhân viên CASHIER / WAREHOUSE_STAFF sang chi nhánh khác trong cùng cửa hàng —
   * cập nhật bảng {@code user_branches} (một bản ghi, primary = chi nhánh mới).
   */
  @Transactional
  public ChangeStoreStaffBranchResponse changeStoreStaffBranch(
      Long userId, ChangeStoreStaffBranchRequest req, JwtAuthenticatedPrincipal principal) {
    AppUser u =
        appUserRepository
            .findById(userId)
            .orElseThrow(
                () ->
                    new AuthApiException(
                        HttpStatus.NOT_FOUND,
                        AuthErrorCodes.USER_NOT_FOUND,
                        "Không tìm thấy người dùng."));

    if (isInactiveUserStatus(u.getStatus())) {
      throw new AuthApiException(
          HttpStatus.BAD_REQUEST,
          AuthErrorCodes.INVALID_TARGET_ROLE,
          "Nhân viên đã ngưng hoạt động — không đổi chi nhánh.");
    }

    if (!onlyCashierOrWarehouseStaffRoles(userId)) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN,
          AuthErrorCodes.INVALID_TARGET_ROLE,
          "Chỉ được điều chuyển nhân viên chỉ có role CASHIER hoặc WAREHOUSE_STAFF.");
    }
    String roleCode = staffRoleCodeForUser(userId);
    if (roleCode == null) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN,
          AuthErrorCodes.INVALID_TARGET_ROLE,
          "Không xác định được role nhân viên.");
    }

    Long oldBranchId = resolveCurrentBranchId(userId);
    if (oldBranchId == null) {
      throw new AuthApiException(
          HttpStatus.BAD_REQUEST,
          AuthErrorCodes.INVALID_TARGET_ROLE,
          "Người dùng chưa được gán chi nhánh.");
    }
    Branch oldBranch =
        branchRepository
            .findById(oldBranchId)
            .orElseThrow(
                () ->
                    new AuthApiException(
                        HttpStatus.NOT_FOUND,
                        AuthErrorCodes.BRANCH_NOT_FOUND,
                        "Không tìm thấy chi nhánh hiện tại."));
    long storeId = oldBranch.getStoreId();

    if (!storeAccessService.isFullSystemAccess()) {
      if (principal == null || principal.storeIds().isEmpty()) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN,
            AuthErrorCodes.STORE_MANAGER_NOT_ASSIGNED_TO_STORE,
            "Tài khoản chưa được gán cửa hàng.");
      }
      if (!principal.storeIds().contains(storeId)
          || !appUserRepository.existsUserLinkedToStore(userId, storeId)) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN,
            AuthErrorCodes.USER_NOT_IN_MANAGER_SCOPE,
            "Người dùng không thuộc phạm vi cửa hàng bạn quản lý.");
      }
    }

    Branch newBranch =
        branchRepository
            .findById(req.newBranchId())
            .orElseThrow(
                () ->
                    new AuthApiException(
                        HttpStatus.NOT_FOUND,
                        AuthErrorCodes.BRANCH_NOT_FOUND,
                        "Không tìm thấy chi nhánh đích."));
    if (!Objects.equals(storeId, newBranch.getStoreId())) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN,
          AuthErrorCodes.TARGET_BRANCH_NOT_IN_MANAGER_STORE,
          "Chi nhánh đích phải thuộc cùng cửa hàng với chi nhánh hiện tại.");
    }
    if (!storeAccessService.isFullSystemAccess()
        && !storeAccessService.canAccessStore(newBranch.getStoreId(), principal)) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN,
          AuthErrorCodes.TARGET_BRANCH_NOT_IN_MANAGER_STORE,
          "Không có quyền thao tác trên chi nhánh đích.");
    }

    if (Objects.equals(oldBranchId, newBranch.getId())) {
      throw new AuthApiException(
          HttpStatus.BAD_REQUEST,
          AuthErrorCodes.SAME_BRANCH_ASSIGNMENT,
          "Người dùng đã được gán chi nhánh này.");
    }

    replaceBranches(userId, List.of(newBranch.getId()), newBranch.getId());

    LocalDateTime now = LocalDateTime.now();
    u.setUpdatedAt(now);
    appUserRepository.save(u);

    return new ChangeStoreStaffBranchResponse(
        u.getId(),
        u.getUsername(),
        u.getFullName(),
        roleCode,
        storeId,
        oldBranchId,
        newBranch.getId(),
        u.getStatus(),
        now);
  }

  @Transactional
  public StoreStaffResponse updateStoreStaff(
      Long userId, UpdateStoreStaffRequest req, JwtAuthenticatedPrincipal principal) {
    AppUser u = loadUser(userId);
    if (staffRoleCodeForUser(userId) == null) {
      throw new ResourceNotFoundException("Không tìm thấy nhân viên.");
    }
    if (!onlyCashierOrWarehouseStaffRoles(userId)) {
      throw new AuthApiException(
          HttpStatus.FORBIDDEN,
          AuthErrorCodes.INVALID_TARGET_ROLE,
          "Chỉ được sửa nhân viên CASHIER hoặc WAREHOUSE_STAFF.");
    }
    if (!storeAccessService.isFullSystemAccess()) {
      if (principal == null || principal.storeIds().isEmpty()) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN,
            AuthErrorCodes.STORE_MANAGER_NOT_ASSIGNED_TO_STORE,
            "Tài khoản chưa được gán cửa hàng.");
      }
      if (!userLinkedToAnyStore(userId, principal.storeIds())) {
        throw new AuthApiException(
            HttpStatus.FORBIDDEN, AuthErrorCodes.FORBIDDEN, "Không có quyền sửa nhân viên này.");
      }
    }

    String emailNorm = req.email() == null ? "" : req.email().trim();
    if (!emailNorm.isEmpty()
        && appUserRepository.existsByEmailIgnoreCaseAndIdNot(emailNorm, userId)) {
      throw new AuthApiException(
          HttpStatus.CONFLICT, AuthErrorCodes.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng.");
    }

    String newPw = req.password() == null ? "" : req.password().trim();
    if (!newPw.isEmpty() && newPw.length() < 6) {
      throw new AuthApiException(
          HttpStatus.BAD_REQUEST,
          AuthErrorCodes.INVALID_PASSWORD,
          "Mật khẩu mới tối thiểu 6 ký tự.");
    }

    LocalDateTime t = LocalDateTime.now();
    u.setFullName(req.fullName().trim());
    if (req.phone() == null || req.phone().isBlank()) {
      u.setPhone(null);
    } else {
      u.setPhone(req.phone().trim());
    }
    u.setEmail(emailNorm.isEmpty() ? null : emailNorm);
    if (!newPw.isEmpty()) {
      u.setPasswordHash(passwordEncoder.encode(newPw));
    }
    u.setUpdatedAt(t);
    appUserRepository.save(u);
    return toStoreStaffResponseFromUser(u);
  }

  @Transactional
  public UserDetailResponse assignBranchesForStore(
      long storeId,
      long userId,
      AssignBranchesRequest req,
      JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    AppUser u = loadUser(userId);
    if (isInactiveUserStatus(u.getStatus())) {
      throw new BusinessException(
          "Người dùng đã ngưng hoạt động — không thể phân chi nhánh trong cửa hàng.");
    }
    List<Long> branchIds = req.branchIds();
    assertBranchesBelongToStore(storeId, branchIds);
    if (!storeAccessService.isFullSystemAccess()
        && !appUserRepository.existsUserLinkedToStore(userId, storeId)) {
      throw new BusinessException("Người dùng không thuộc cửa hàng này.");
    }
    replaceBranches(userId, branchIds, req.primaryBranchId());
    return get(userId);
  }

  private AppUser loadUser(Long id) {
    return appUserRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
  }

  private String normalizeStatus(String raw) {
    return raw == null ? "" : raw.trim().toUpperCase();
  }

  private void applyDefaultStore(AppUser u, Long defaultStoreId) {
    if (defaultStoreId == null) {
      u.setDefaultStore(null);
      return;
    }
    Store s =
        storeRepository
            .findById(defaultStoreId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cửa hàng mặc định."));
    u.setDefaultStore(s);
  }

  private void assertRolesExist(List<Long> roleIds) {
    for (Long rid : roleIds) {
      if (!roleRepository.existsById(rid)) {
        throw new ResourceNotFoundException("Không tìm thấy role.");
      }
    }
  }

  private void assertStoresExist(List<Long> storeIds) {
    for (Long sid : storeIds) {
      if (!storeRepository.existsById(sid)) {
        throw new ResourceNotFoundException("Không tìm thấy cửa hàng.");
      }
    }
  }

  private void assertBranchesExist(List<Long> branchIds) {
    for (Long bid : branchIds) {
      if (!branchRepository.existsById(bid)) {
        throw new ResourceNotFoundException("Không tìm thấy chi nhánh.");
      }
    }
  }

  private void assertBranchesBelongToStore(long storeId, List<Long> branchIds) {
    for (Long bid : branchIds) {
      var br =
          branchRepository
              .findById(bid)
              .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh."));
      if (!Objects.equals(storeId, br.getStoreId())) {
        throw new BusinessException("Chi nhánh không thuộc cửa hàng này.");
      }
    }
  }

  private void replaceRoles(Long userId, List<Long> roleIds) {
    userRoleAssignmentRepository.deleteById_UserId(userId);
    for (Long rid : roleIds) {
      UserRoleAssignment link = new UserRoleAssignment();
      link.setId(new UserRoleAssignment.Pk(userId, rid));
      userRoleAssignmentRepository.save(link);
    }
  }

  private void replaceStores(Long userId, List<Long> storeIds, Long primaryStoreId) {
    if (primaryStoreId != null && !storeIds.contains(primaryStoreId)) {
      throw new BusinessException("primaryStoreId phải nằm trong storeIds.");
    }
    userStoreRepository.deleteById_UserId(userId);
    for (Long sid : storeIds) {
      UserStore us = new UserStore();
      us.setId(new UserStore.Pk(userId, sid));
      us.setPrimary(primaryStoreId != null && primaryStoreId.equals(sid));
      userStoreRepository.save(us);
    }
  }

  private void replaceBranches(Long userId, List<Long> branchIds, Long primaryBranchId) {
    if (primaryBranchId != null && !branchIds.contains(primaryBranchId)) {
      throw new BusinessException("primaryBranchId phải nằm trong branchIds.");
    }
    userBranchRepository.deleteById_UserId(userId);
    for (Long bid : branchIds) {
      UserBranch ub = new UserBranch();
      ub.setId(new UserBranch.Pk(userId, bid));
      ub.setPrimary(primaryBranchId != null && primaryBranchId.equals(bid));
      userBranchRepository.save(ub);
    }
  }

  private UserResponse toUserResponse(AppUser u) {
    List<String> codes = roleCodesForUser(u.getId());
    Long defId = u.getDefaultStore() != null ? u.getDefaultStore().getId() : null;
    return new UserResponse(
        u.getId(),
        u.getUsername(),
        u.getEmail(),
        u.getFullName(),
        u.getStatus(),
        defId,
        codes);
  }

  private List<String> roleCodesForUser(Long userId) {
    List<String> codes = new ArrayList<>();
    for (UserRoleAssignment link : userRoleAssignmentRepository.findById_UserId(userId)) {
      roleRepository
          .findById(link.getId().getRoleId())
          .map(Role::getRoleCode)
          .ifPresent(codes::add);
    }
    codes.sort(Comparator.naturalOrder());
    return List.copyOf(codes);
  }

  private UserDetailResponse toDetail(AppUser u) {
    List<RoleRow> roles = new ArrayList<>();
    for (UserRoleAssignment link : userRoleAssignmentRepository.findById_UserId(u.getId())) {
      roleRepository
          .findById(link.getId().getRoleId())
          .ifPresent(
              r ->
                  roles.add(new RoleRow(r.getId(), r.getRoleCode(), r.getRoleName())));
    }
    roles.sort(Comparator.comparing(RoleRow::roleCode));

    List<StoreRow> stores = new ArrayList<>();
    for (UserStore us : userStoreRepository.findById_UserId(u.getId())) {
      Long sid = us.getId().getStoreId();
      storeRepository
          .findById(sid)
          .ifPresent(
              st ->
                  stores.add(
                      new StoreRow(
                          st.getId(), st.getStoreCode(), st.getStoreName(), us.isPrimary())));
    }
    stores.sort(Comparator.comparing(StoreRow::storeCode));

    List<BranchRow> branches = new ArrayList<>();
    for (UserBranch ub : userBranchRepository.findById_UserId(u.getId())) {
      Long bid = ub.getId().getBranchId();
      branchRepository
          .findById(bid)
          .ifPresent(
              br ->
                  branches.add(
                      new BranchRow(
                          br.getId(),
                          br.getStoreId(),
                          br.getBranchCode(),
                          br.getBranchName(),
                          ub.isPrimary())));
    }
    branches.sort(Comparator.comparing(BranchRow::branchCode));

    Long defId = u.getDefaultStore() != null ? u.getDefaultStore().getId() : null;

    return new UserDetailResponse(
        u.getId(),
        u.getUsername(),
        u.getEmail(),
        u.getFullName(),
        u.getPhone(),
        u.getStatus(),
        defId,
        List.copyOf(roles),
        List.copyOf(stores),
        List.copyOf(branches));
  }

  private static String blankToNull(String s) {
    if (s == null || s.isBlank()) {
      return null;
    }
    return s;
  }

  private static boolean isInactiveUserStatus(String status) {
    if (status == null || status.isBlank()) {
      return false;
    }
    String s = status.trim();
    return s.equalsIgnoreCase("INACTIVE") || s.equalsIgnoreCase(DomainConstants.STATUS_INACTIVE);
  }

  /** Chỉ role CASHIER và/hoặc WAREHOUSE_STAFF, không role khác. */
  private boolean onlyCashierOrWarehouseStaffRoles(Long userId) {
    List<String> codes = roleCodesForUser(userId);
    if (codes.isEmpty()) {
      return false;
    }
    for (String c : codes) {
      if (!"CASHIER".equals(c) && !"WAREHOUSE_STAFF".equals(c)) {
        return false;
      }
    }
    return true;
  }

  /** Chi nhánh “hiện tại”: primary nếu có, không thì bản ghi đầu. */
  private Long resolveCurrentBranchId(Long userId) {
    List<UserBranch> branches = userBranchRepository.findById_UserId(userId);
    if (branches.isEmpty()) {
      return null;
    }
    for (UserBranch ub : branches) {
      if (ub.isPrimary()) {
        return ub.getId().getBranchId();
      }
    }
    return branches.getFirst().getId().getBranchId();
  }

  private String staffRoleCodeForUser(Long userId) {
    List<String> codes = roleCodesForUser(userId);
    if (codes.contains("CASHIER")) {
      return "CASHIER";
    }
    if (codes.contains("WAREHOUSE_STAFF")) {
      return "WAREHOUSE_STAFF";
    }
    return null;
  }

  private boolean userLinkedToAnyStore(long userId, List<Long> storeIds) {
    for (Long sid : storeIds) {
      if (appUserRepository.existsUserLinkedToStore(userId, sid)) {
        return true;
      }
    }
    return false;
  }

  private StoreStaffResponse toStoreStaffResponse(
      AppUser u, String roleCode, long storeId, long branchId) {
    return new StoreStaffResponse(
        u.getId(),
        u.getUsername(),
        u.getFullName(),
        u.getPhone(),
        u.getEmail(),
        roleCode,
        storeId,
        branchId,
        u.getStatus(),
        u.getCreatedAt());
  }

  private StoreStaffResponse toStoreStaffResponseFromUser(AppUser u) {
    String role = staffRoleCodeForUser(u.getId());
    if (role == null) {
      throw new BusinessException("Người dùng không phải nhân viên kho / thu ngân.");
    }
    Long storeId;
    Long branchId;
    List<UserBranch> branches = userBranchRepository.findById_UserId(u.getId());
    UserBranch pickedBranch = null;
    for (UserBranch ub : branches) {
      if (ub.isPrimary()) {
        pickedBranch = ub;
        break;
      }
    }
    if (pickedBranch == null && !branches.isEmpty()) {
      pickedBranch = branches.getFirst();
    }
    if (pickedBranch != null) {
      Long bid = pickedBranch.getId().getBranchId();
      Branch br =
          branchRepository
              .findById(bid)
              .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh."));
      storeId = br.getStoreId();
      branchId = bid;
    } else {
      storeId = null;
      branchId = null;
      for (UserStore us : userStoreRepository.findById_UserId(u.getId())) {
        storeId = us.getId().getStoreId();
        break;
      }
      if (storeId == null && u.getDefaultStore() != null) {
        storeId = u.getDefaultStore().getId();
      }
    }
    return new StoreStaffResponse(
        u.getId(),
        u.getUsername(),
        u.getFullName(),
        u.getPhone(),
        u.getEmail(),
        role,
        storeId,
        branchId,
        u.getStatus(),
        u.getCreatedAt());
  }
}
