package com.quanlybanhang.controller;

import com.quanlybanhang.dto.DashboardDtos.ReportSummaryResponse;
import com.quanlybanhang.service.ReportQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Báo cáo doanh thu / đơn hoàn tất — {@code REPORT_VIEW} hoặc {@code REPORT_VIEW_BRANCH}. */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

  private final ReportQueryService reportQueryService;

  @GetMapping("/summary")
  @PreAuthorize("@authz.reportRead(authentication)")
  public ReportSummaryResponse summary() {
    return reportQueryService.summary();
  }
}
