package com.quanlybanhang.controller;

import com.quanlybanhang.dto.GoodsReceiptDtos.GoodsReceiptCreateRequest;
import com.quanlybanhang.dto.GoodsReceiptDtos.GoodsReceiptResponse;
import com.quanlybanhang.security.CurrentUserResolver;
import com.quanlybanhang.service.GoodsReceiptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/goods-receipts")
@RequiredArgsConstructor
public class GoodsReceiptController {

  private final GoodsReceiptService goodsReceiptService;

  @GetMapping
  public Page<GoodsReceiptResponse> list(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime fromReceiptDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime toReceiptDate) {
    return goodsReceiptService.list(
        pageable, storeId, status, fromReceiptDate, toReceiptDate);
  }

  @GetMapping("/{id}")
  public GoodsReceiptResponse get(@PathVariable Long id) {
    return goodsReceiptService.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public GoodsReceiptResponse create(@Valid @RequestBody GoodsReceiptCreateRequest req) {
    return goodsReceiptService.createDraft(req, CurrentUserResolver.requireUserId());
  }

  @PostMapping("/{id}/confirm")
  public GoodsReceiptResponse confirm(@PathVariable Long id) {
    return goodsReceiptService.confirm(id, CurrentUserResolver.requireUserId());
  }
}
