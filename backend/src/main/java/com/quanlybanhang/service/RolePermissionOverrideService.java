package com.quanlybanhang.service;

import com.quanlybanhang.dto.RbacDtos.CreatePermissionOverrideRequest;
import com.quanlybanhang.dto.RbacDtos.PermissionOverrideResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.Branch;
import com.quanlybanhang.model.RolePermissionOverride;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.repository.PermissionRepository;
import com.quanlybanhang.repository.RolePermissionOverrideRepository;
import com.quanlybanhang.repository.RoleRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RolePermissionOverrideService {

  private final RolePermissionOverrideRepository overrideRepository;
  private final RoleRepository roleRepository;
  private final PermissionRepository permissionRepository;
  private final BranchRepository branchRepository;

  @Transactional(readOnly = true)
  public List<PermissionOverrideResponse> listByRole(Long roleId) {
    if (roleId != null && !roleRepository.existsById(roleId)) {
      throw new ResourceNotFoundException("Không tìm thấy role.");
    }
    List<RolePermissionOverride> rows =
        roleId == null
            ? overrideRepository.findAllByOrderByIdAsc()
            : overrideRepository.findByRoleIdOrderById(roleId);
    List<PermissionOverrideResponse> out = new ArrayList<>();
    for (RolePermissionOverride o : rows) {
      out.add(toResponse(o));
    }
    return out;
  }

  @Transactional
  public PermissionOverrideResponse create(CreatePermissionOverrideRequest req) {
    if (!roleRepository.existsById(req.roleId())) {
      throw new ResourceNotFoundException("Không tìm thấy role.");
    }
    if (!permissionRepository.existsById(req.permissionId())) {
      throw new ResourceNotFoundException("Không tìm thấy permission.");
    }
    String type = req.overrideType().trim().toUpperCase();
    if (!"ALLOW".equals(type) && !"DENY".equals(type)) {
      throw new BusinessException("overrideType phải là ALLOW hoặc DENY.");
    }
    Long storeId = req.storeId();
    Long branchId = req.branchId();
    if (branchId != null) {
      Branch b =
          branchRepository
              .findById(branchId)
              .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh."));
      if (storeId != null && !storeId.equals(b.getStoreId())) {
        throw new BusinessException("branch_id không thuộc store_id đã chọn.");
      }
      storeId = b.getStoreId();
    }
    RolePermissionOverride e = new RolePermissionOverride();
    e.setRoleId(req.roleId());
    e.setPermissionId(req.permissionId());
    e.setStoreId(storeId);
    e.setBranchId(branchId);
    e.setOverrideType(type);
    e.setCreatedAt(LocalDateTime.now());
    RolePermissionOverride saved = overrideRepository.save(e);
    return toResponse(saved);
  }

  private PermissionOverrideResponse toResponse(RolePermissionOverride o) {
    String code =
        permissionRepository
            .findById(o.getPermissionId())
            .map(p -> p.getPermissionCode())
            .orElse("");
    return new PermissionOverrideResponse(
        o.getId(),
        o.getRoleId(),
        o.getPermissionId(),
        code,
        o.getStoreId(),
        o.getBranchId(),
        o.getOverrideType());
  }

  @Transactional
  public void delete(long overrideId) {
    if (!overrideRepository.existsById(overrideId)) {
      throw new ResourceNotFoundException("Không tìm thấy bản ghi override.");
    }
    overrideRepository.deleteById(overrideId);
  }
}
