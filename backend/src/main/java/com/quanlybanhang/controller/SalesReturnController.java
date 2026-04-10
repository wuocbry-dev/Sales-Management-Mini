package com.quanlybanhang.controller;

import com.quanlybanhang.dto.SalesReturnDtos.SalesReturnCreateRequest;
import com.quanlybanhang.dto.SalesReturnDtos.SalesReturnResponse;
import com.quanlybanhang.security.CurrentUserResolver;
import com.quanlybanhang.service.SalesReturnService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales-returns")
@RequiredArgsConstructor
public class SalesReturnController {

  private final SalesReturnService salesReturnService;

  @GetMapping
  public Page<SalesReturnResponse> list(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @RequestParam(required = false) Long orderId,
      @RequestParam(required = false) String status) {
    return salesReturnService.list(pageable, storeId, orderId, status);
  }

  @GetMapping("/{id}")
  public SalesReturnResponse get(@PathVariable Long id) {
    return salesReturnService.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public SalesReturnResponse create(@Valid @RequestBody SalesReturnCreateRequest req) {
    return salesReturnService.createDraft(req, CurrentUserResolver.requireUserId());
  }

  @PostMapping("/{id}/confirm")
  public SalesReturnResponse confirm(@PathVariable Long id) {
    return salesReturnService.confirm(id, CurrentUserResolver.requireUserId());
  }
}
