package com.quanlybanhang.controller;

import com.quanlybanhang.dto.StocktakeDtos.StocktakeCreateRequest;
import com.quanlybanhang.dto.StocktakeDtos.StocktakeResponse;
import com.quanlybanhang.security.CurrentUserResolver;
import com.quanlybanhang.service.StocktakeService;
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
@RequestMapping("/api/stocktakes")
@RequiredArgsConstructor
public class StocktakeController {

  private final StocktakeService stocktakeService;

  @GetMapping
  public Page<StocktakeResponse> list(
      Pageable pageable,
      @RequestParam(required = false) Long storeId,
      @RequestParam(required = false) String status) {
    return stocktakeService.list(pageable, storeId, status);
  }

  @GetMapping("/{id}")
  public StocktakeResponse get(@PathVariable Long id) {
    return stocktakeService.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public StocktakeResponse create(@Valid @RequestBody StocktakeCreateRequest req) {
    return stocktakeService.createDraft(req, CurrentUserResolver.requireUserId());
  }

  @PostMapping("/{id}/confirm")
  public StocktakeResponse confirm(@PathVariable Long id) {
    return stocktakeService.confirm(id, CurrentUserResolver.requireUserId());
  }
}
