package com.quanlybanhang.config;

import com.quanlybanhang.service.RoleBootstrapService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Chạy sau khi context sẵn sàng để đảm bảo có đủ role_code cho luồng đăng ký. */
@Component
@Order(0)
@RequiredArgsConstructor
public class DefaultRolesBootstrap implements ApplicationRunner {

  private final RoleBootstrapService roleBootstrapService;

  @Override
  public void run(ApplicationArguments args) {
    roleBootstrapService.ensureDefaultRolesExist();
  }
}
