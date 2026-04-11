package com.quanlybanhang.controller;

import com.quanlybanhang.dto.CustomerDtos.CustomerRequest;
import com.quanlybanhang.dto.CustomerDtos.CustomerResponse;
import com.quanlybanhang.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

  private final CustomerService customerService;

  @GetMapping
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('CUSTOMER_VIEW')")
  public Page<CustomerResponse> list(Pageable pageable) {
    return customerService.list(pageable);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('CUSTOMER_VIEW')")
  public CustomerResponse get(@PathVariable Long id) {
    return customerService.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('CUSTOMER_CREATE')")
  public CustomerResponse create(@Valid @RequestBody CustomerRequest req) {
    return customerService.create(req);
  }

  @PutMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('CUSTOMER_UPDATE')")
  public CustomerResponse update(@PathVariable Long id, @Valid @RequestBody CustomerRequest req) {
    return customerService.update(id, req);
  }
}
