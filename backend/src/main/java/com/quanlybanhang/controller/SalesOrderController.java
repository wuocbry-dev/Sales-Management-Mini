package com.quanlybanhang.controller;

import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderConfirmRequest;
import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderCreateRequest;
import com.quanlybanhang.dto.SalesOrderDtos.SalesOrderResponse;
import com.quanlybanhang.security.CurrentUserResolver;
import com.quanlybanhang.service.SalesOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

  private final SalesOrderService salesOrderService;

  @GetMapping
  public Page<SalesOrderResponse> list(Pageable pageable) {
    return salesOrderService.list(pageable);
  }

  @GetMapping("/{id}")
  public SalesOrderResponse get(@PathVariable Long id) {
    return salesOrderService.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public SalesOrderResponse create(@Valid @RequestBody SalesOrderCreateRequest req) {
    return salesOrderService.createDraft(req, CurrentUserResolver.requireUserId());
  }

  @PostMapping("/{id}/confirm")
  public SalesOrderResponse confirm(
      @PathVariable Long id, @Valid @RequestBody SalesOrderConfirmRequest req) {
    return salesOrderService.confirm(id, req, CurrentUserResolver.requireUserId());
  }

  @PostMapping("/{id}/cancel")
  public SalesOrderResponse cancel(@PathVariable Long id) {
    return salesOrderService.cancel(id);
  }
}
