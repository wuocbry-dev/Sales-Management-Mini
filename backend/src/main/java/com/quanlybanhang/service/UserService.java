package com.quanlybanhang.service;

import com.quanlybanhang.dto.UserDtos.AssignRolesRequest;
import com.quanlybanhang.dto.UserDtos.AssignStoresRequest;
import com.quanlybanhang.dto.UserDtos.CreateUserRequest;
import com.quanlybanhang.dto.UserDtos.RoleRow;
import com.quanlybanhang.dto.UserDtos.StoreRow;
import com.quanlybanhang.dto.UserDtos.UpdateUserRequest;
import com.quanlybanhang.dto.UserDtos.UpdateUserStatusRequest;
import com.quanlybanhang.dto.UserDtos.UserDetailResponse;
import com.quanlybanhang.dto.UserDtos.UserResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.AppUser;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.model.Store;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.model.UserStore;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import com.quanlybanhang.repository.UserStoreRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
  private final PasswordEncoder passwordEncoder;

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
        List.copyOf(stores));
  }
}
