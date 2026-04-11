package com.quanlybanhang.service;

import com.quanlybanhang.dto.BranchDtos.BranchRequest;
import com.quanlybanhang.dto.BranchDtos.BranchResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.Branch;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BranchService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final BranchRepository branchRepository;
  private final StoreRepository storeRepository;
  private final StoreAccessService storeAccessService;
  private final WarehouseService warehouseService;

  public void assertCanAccessStore(long storeId, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
  }

  @Transactional(readOnly = true)
  public Page<BranchResponse> list(long storeId, Pageable pageable, JwtAuthenticatedPrincipal principal) {
    assertCanAccessStore(storeId, principal);
    if (!storeRepository.existsById(storeId)) {
      throw new ResourceNotFoundException("Không tìm thấy cửa hàng.");
    }
    if (storeAccessService.isBranchOnlyScoped(principal)) {
      List<Long> allowed =
          principal.branchIds().stream()
              .filter(
                  bid ->
                      branchRepository
                          .findById(bid)
                          .map(b -> b.getStoreId().equals(storeId))
                          .orElse(false))
              .toList();
      if (allowed.isEmpty()) {
        return Page.empty(pageable);
      }
      return branchRepository.findByStoreIdAndIdIn(storeId, allowed, pageable).map(this::toResponse);
    }
    return branchRepository.findByStoreId(storeId, pageable).map(this::toResponse);
  }

  @Transactional(readOnly = true)
  public BranchResponse get(long storeId, long branchId, JwtAuthenticatedPrincipal principal) {
    assertCanAccessStore(storeId, principal);
    Branch b = loadBranchInStore(storeId, branchId);
    storeAccessService.assertCanAccessBranch(branchId, principal);
    return toResponse(b);
  }

  @Transactional
  public BranchResponse create(long storeId, BranchRequest req, JwtAuthenticatedPrincipal principal) {
    assertCanAccessStore(storeId, principal);
    if (!storeRepository.existsById(storeId)) {
      throw new ResourceNotFoundException("Không tìm thấy cửa hàng.");
    }
    if (branchRepository.existsByStoreIdAndBranchCode(storeId, req.branchCode().trim())) {
      throw new BusinessException("Mã chi nhánh đã tồn tại trong cửa hàng: " + req.branchCode());
    }
    LocalDateTime t = LocalDateTime.now(ZONE);
    Branch e = new Branch();
    e.setStoreId(storeId);
    e.setBranchCode(req.branchCode().trim());
    e.setBranchName(req.branchName().trim());
    e.setPhone(req.phone() != null && !req.phone().isBlank() ? req.phone().trim() : null);
    e.setEmail(req.email() != null && !req.email().isBlank() ? req.email().trim() : null);
    e.setAddress(req.address() != null && !req.address().isBlank() ? req.address().trim() : null);
    e.setStatus(req.status().trim().toUpperCase());
    e.setCreatedAt(t);
    e.setUpdatedAt(t);
    Branch saved = branchRepository.save(e);
    warehouseService.ensureBranchWarehouse(saved);
    return toResponse(saved);
  }

  @Transactional
  public BranchResponse update(long storeId, long branchId, BranchRequest req, JwtAuthenticatedPrincipal principal) {
    assertCanAccessStore(storeId, principal);
    Branch e = loadBranchInStore(storeId, branchId);
    String code = req.branchCode().trim();
    if (!code.equals(e.getBranchCode())
        && branchRepository.existsByStoreIdAndBranchCode(storeId, code)) {
      throw new BusinessException("Mã chi nhánh đã tồn tại trong cửa hàng: " + code);
    }
    e.setBranchCode(code);
    e.setBranchName(req.branchName().trim());
    e.setPhone(req.phone() != null && !req.phone().isBlank() ? req.phone().trim() : null);
    e.setEmail(req.email() != null && !req.email().isBlank() ? req.email().trim() : null);
    e.setAddress(req.address() != null && !req.address().isBlank() ? req.address().trim() : null);
    e.setStatus(req.status().trim().toUpperCase());
    e.setUpdatedAt(LocalDateTime.now(ZONE));
    Branch saved = branchRepository.save(e);
    warehouseService.ensureBranchWarehouse(saved);
    return toResponse(saved);
  }

  private Branch loadBranchInStore(long storeId, long branchId) {
    Branch b =
        branchRepository
            .findById(branchId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh."));
    if (!b.getStoreId().equals(storeId)) {
      throw new ResourceNotFoundException("Không tìm thấy chi nhánh.");
    }
    return b;
  }

  private BranchResponse toResponse(Branch e) {
    return new BranchResponse(
        e.getId(),
        e.getStoreId(),
        e.getBranchCode(),
        e.getBranchName(),
        e.getPhone(),
        e.getEmail(),
        e.getAddress(),
        e.getStatus());
  }

  @Transactional(readOnly = true)
  public BranchResponse getById(long branchId, JwtAuthenticatedPrincipal principal) {
    Branch b =
        branchRepository
            .findById(branchId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh."));
    assertCanAccessStore(b.getStoreId(), principal);
    storeAccessService.assertCanAccessBranch(branchId, principal);
    return toResponse(b);
  }

  @Transactional
  public BranchResponse updateById(long branchId, BranchRequest req, JwtAuthenticatedPrincipal principal) {
    Branch b =
        branchRepository
            .findById(branchId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh."));
    return update(b.getStoreId(), branchId, req, principal);
  }
}
