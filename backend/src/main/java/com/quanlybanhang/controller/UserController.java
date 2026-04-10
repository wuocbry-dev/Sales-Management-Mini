package com.quanlybanhang.controller;

import com.quanlybanhang.dto.UserDtos.AssignRolesRequest;
import com.quanlybanhang.dto.UserDtos.AssignStoresRequest;
import com.quanlybanhang.dto.UserDtos.CreateUserRequest;
import com.quanlybanhang.dto.UserDtos.UpdateUserRequest;
import com.quanlybanhang.dto.UserDtos.UpdateUserStatusRequest;
import com.quanlybanhang.dto.UserDtos.UserDetailResponse;
import com.quanlybanhang.dto.UserDtos.UserResponse;
import com.quanlybanhang.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

  private final UserService userService;

  @GetMapping
  public Page<UserResponse> list(Pageable pageable) {
    return userService.list(pageable);
  }

  @GetMapping("/{id}")
  public UserDetailResponse get(@PathVariable Long id) {
    return userService.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public UserDetailResponse create(@Valid @RequestBody CreateUserRequest req) {
    return userService.create(req);
  }

  @PutMapping("/{id}")
  public UserDetailResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {
    return userService.update(id, req);
  }

  @PutMapping("/{id}/status")
  public UserDetailResponse updateStatus(
      @PathVariable Long id, @Valid @RequestBody UpdateUserStatusRequest req) {
    return userService.updateStatus(id, req);
  }

  @PutMapping("/{id}/roles")
  public UserDetailResponse assignRoles(
      @PathVariable Long id, @Valid @RequestBody AssignRolesRequest req) {
    return userService.assignRoles(id, req);
  }

  @PutMapping("/{id}/stores")
  public UserDetailResponse assignStores(
      @PathVariable Long id, @Valid @RequestBody AssignStoresRequest req) {
    return userService.assignStores(id, req);
  }
}
