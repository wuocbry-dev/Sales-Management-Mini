package com.quanlybanhang.controller;

import com.quanlybanhang.dto.StockTransferDtos.StockTransferCreateRequest;
import com.quanlybanhang.dto.StockTransferDtos.StockTransferResponse;
import com.quanlybanhang.security.CurrentUserResolver;
import com.quanlybanhang.service.StockTransferService;
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
@RequestMapping("/api/stock-transfers")
@RequiredArgsConstructor
public class StockTransferController {

  private final StockTransferService stockTransferService;

  @GetMapping
  public Page<StockTransferResponse> list(
      Pageable pageable,
      @RequestParam(required = false) Long fromStoreId,
      @RequestParam(required = false) Long toStoreId,
      @RequestParam(required = false) String status) {
    return stockTransferService.list(pageable, fromStoreId, toStoreId, status);
  }

  @GetMapping("/{id}")
  public StockTransferResponse get(@PathVariable Long id) {
    return stockTransferService.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public StockTransferResponse create(@Valid @RequestBody StockTransferCreateRequest req) {
    return stockTransferService.createDraft(req, CurrentUserResolver.requireUserId());
  }

  @PostMapping("/{id}/confirm")
  public StockTransferResponse confirm(@PathVariable Long id) {
    return stockTransferService.confirm(id, CurrentUserResolver.requireUserId());
  }
}
