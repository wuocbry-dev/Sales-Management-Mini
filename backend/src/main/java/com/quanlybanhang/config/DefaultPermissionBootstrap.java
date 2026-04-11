package com.quanlybanhang.config;

import com.quanlybanhang.service.PermissionBootstrapService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Sau {@link DefaultRolesBootstrap}: quyền + gán role–permission tối thiểu cho API và UI nav. */
@Component
@Order(1)
@RequiredArgsConstructor
public class DefaultPermissionBootstrap implements ApplicationRunner {

  private final PermissionBootstrapService permissionBootstrapService;

  @Override
  public void run(ApplicationArguments args) {
    permissionBootstrapService.ensurePermissionsAndRoleGrants();
  }
}
