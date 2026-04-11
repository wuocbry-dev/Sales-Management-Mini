package com.quanlybanhang.controller;

import com.quanlybanhang.dto.GoodsReceiptDtos.GoodsReceiptCreateRequest;
import com.quanlybanhang.dto.GoodsReceiptDtos.GoodsReceiptResponse;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.GoodsReceiptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('GOODS_RECEIPT_VIEW')")
  public Page<GoodsReceiptResponse> list(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime fromReceiptDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime toReceiptDate,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return goodsReceiptService.list(
        pageable, storeId, status, fromReceiptDate, toReceiptDate, principal);
  }

  @GetMapping("/{id}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('GOODS_RECEIPT_VIEW')")
  public GoodsReceiptResponse get(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return goodsReceiptService.get(id, principal);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('GOODS_RECEIPT_CREATE')")
  public GoodsReceiptResponse create(
      @Valid @RequestBody GoodsReceiptCreateRequest req,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return goodsReceiptService.createDraft(req, principal);
  }

  @PostMapping("/{id}/confirm")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('GOODS_RECEIPT_CONFIRM')")
  public GoodsReceiptResponse confirm(
      @PathVariable Long id, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return goodsReceiptService.confirm(id, principal);
  }
}
