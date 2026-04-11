package com.quanlybanhang.service;

import com.quanlybanhang.dto.CustomerDtos.CustomerRequest;
import com.quanlybanhang.dto.CustomerDtos.CustomerResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.Customer;
import com.quanlybanhang.repository.CustomerRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final CustomerRepository customerRepository;

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

  public Page<CustomerResponse> list(Pageable pageable) {
    return customerRepository.findAll(pageable).map(this::toResponse);
  }

  public CustomerResponse get(Long id) {
    return customerRepository.findById(id).map(this::toResponse).orElseThrow(() -> notFound(id));
  }

  @Transactional
  public CustomerResponse create(CustomerRequest req) {
    if (customerRepository.existsByCustomerCode(req.customerCode())) {
      throw new BusinessException("Mã khách hàng đã tồn tại: " + req.customerCode());
    }
    LocalDateTime t = now();
    Customer c = new Customer();
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
  public CustomerResponse update(Long id, CustomerRequest req) {
    Customer c = customerRepository.findById(id).orElseThrow(() -> notFound(id));
    if (!c.getCustomerCode().equals(req.customerCode())
        && customerRepository.existsByCustomerCode(req.customerCode())) {
      throw new BusinessException("Mã khách hàng đã tồn tại: " + req.customerCode());
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

  private CustomerResponse toResponse(Customer c) {
    return new CustomerResponse(
        c.getId(),
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
