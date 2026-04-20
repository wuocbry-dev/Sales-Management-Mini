package com.quanlybanhang.controller;

import com.quanlybanhang.dto.DashboardDtos.DashboardKpisResponse;
import com.quanlybanhang.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

  private final DashboardService dashboardService;

  @GetMapping("/kpis")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('DASHBOARD_VIEW')")
  public DashboardKpisResponse kpis(
      @RequestParam(name = "period", required = false) String period) {
    return dashboardService.kpis(period);
  }
}
