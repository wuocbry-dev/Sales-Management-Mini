package com.quanlybanhang.service;

import com.quanlybanhang.dto.CustomerDtos.CustomerRequest;
import com.quanlybanhang.dto.CustomerDtos.CustomerResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.Customer;
import com.quanlybanhang.repository.CustomerRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final CustomerRepository customerRepository;
  private final StoreRepository storeRepository;
  private final StoreAccessService storeAccessService;

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  /** Khớp {@code ENUM('ACTIVE','INACTIVE')} trên MySQL. */
  private static String normalizeActiveInactiveStatus(String raw) {
    if (raw == null || raw.isBlank()) {
      return "ACTIVE";
    }
    return raw.trim().toUpperCase();
  }

  /** Khớp {@code ENUM('MALE','FEMALE','OTHER')} — client có thể gửi chữ thường. */
  private static String normalizeGender(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    return raw.trim().toUpperCase();
  }

  public Page<CustomerResponse> list(
      Pageable pageable, Long storeId, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    if (storeId != null) {
      if (!storeRepository.existsById(storeId)) {
        throw new BusinessException("Cửa hàng không tồn tại: " + storeId);
      }
      if (scope != null && !scope.contains(storeId)) {
        throw new AccessDeniedException("Không có quyền xem cửa hàng này.");
      }
    }

    if (scope == null) {
      if (storeId != null) {
        return customerRepository.findByStoreId(storeId, pageable).map(this::toResponse);
      }
      return customerRepository.findAll(pageable).map(this::toResponse);
    }

    if (storeId != null) {
      return customerRepository.findByStoreId(storeId, pageable).map(this::toResponse);
    }
    return customerRepository.findByStoreIdIn(scope, pageable).map(this::toResponse);
  }

  public CustomerResponse get(Long id, JwtAuthenticatedPrincipal principal) {
    Customer c = customerRepository.findById(id).orElseThrow(() -> notFound(id));
    storeAccessService.assertCanAccessStore(c.getStoreId(), principal);
    return toResponse(c);
  }

  @Transactional
  public CustomerResponse create(CustomerRequest req, JwtAuthenticatedPrincipal principal) {
    long storeId = resolveStoreIdForCreate(req.storeId(), principal);
    if (customerRepository.existsByStoreIdAndCustomerCode(storeId, req.customerCode())) {
      throw new BusinessException(
          "Mã khách hàng đã tồn tại trong cửa hàng: " + req.customerCode());
    }
    LocalDateTime t = now();
    Customer c = new Customer();
    c.setStoreId(storeId);
    c.setCustomerCode(req.customerCode());
    c.setFullName(req.fullName());
    c.setPhone(req.phone());
    c.setEmail(req.email());
    c.setGender(normalizeGender(req.gender()));
    c.setDateOfBirth(req.dateOfBirth());
    c.setAddress(req.address());
    c.setLoyaltyPoints(0);
    c.setTotalSpent(BigDecimal.ZERO);
    c.setStatus(normalizeActiveInactiveStatus(req.status()));
    c.setCreatedAt(t);
    c.setUpdatedAt(t);
    return toResponse(customerRepository.save(c));
  }

  @Transactional
  public CustomerResponse update(Long id, CustomerRequest req, JwtAuthenticatedPrincipal principal) {
    Customer c = customerRepository.findById(id).orElseThrow(() -> notFound(id));
    storeAccessService.assertCanAccessStore(c.getStoreId(), principal);

    if (req.storeId() != null && !req.storeId().equals(c.getStoreId())) {
      throw new BusinessException("Không được thay đổi cửa hàng của khách hàng.");
    }

    if (!c.getCustomerCode().equals(req.customerCode())
        && customerRepository.existsByStoreIdAndCustomerCodeAndIdNot(
            c.getStoreId(), req.customerCode(), id)) {
      throw new BusinessException(
          "Mã khách hàng đã tồn tại trong cửa hàng: " + req.customerCode());
    }
    c.setCustomerCode(req.customerCode());
    c.setFullName(req.fullName());
    c.setPhone(req.phone());
    c.setEmail(req.email());
    c.setGender(normalizeGender(req.gender()));
    c.setDateOfBirth(req.dateOfBirth());
    c.setAddress(req.address());
    c.setStatus(normalizeActiveInactiveStatus(req.status()));
    c.setUpdatedAt(now());
    return toResponse(customerRepository.save(c));
  }

  private long resolveStoreIdForCreate(Long requestedStoreId, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    if (scope == null) {
      if (requestedStoreId == null) {
        throw new BusinessException("Vui lòng chọn cửa hàng (storeId).");
      }
      if (!storeRepository.existsById(requestedStoreId)) {
        throw new BusinessException("Cửa hàng không tồn tại: " + requestedStoreId);
      }
      return requestedStoreId;
    }

    if (requestedStoreId != null) {
      storeAccessService.assertCanAccessStore(requestedStoreId, principal);
      return requestedStoreId;
    }
    if (scope.size() == 1) {
      return scope.get(0);
    }
    throw new BusinessException("Vui lòng chọn cửa hàng (storeId).");
  }

  private CustomerResponse toResponse(Customer c) {
    return new CustomerResponse(
        c.getId(),
        c.getStoreId(),
        c.getCustomerCode(),
        c.getFullName(),
        c.getPhone(),
        c.getEmail(),
        c.getGender(),
        c.getDateOfBirth(),
        c.getAddress(),
        c.getLoyaltyPoints(),
        c.getTotalSpent(),
        c.getStatus(),
        c.getCreatedAt(),
        c.getUpdatedAt());
  }

  private static ResourceNotFoundException notFound(Long id) {
    return new ResourceNotFoundException("Khách hàng không tồn tại: " + id);
  }
}
