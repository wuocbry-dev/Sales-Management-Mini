package com.quanlybanhang.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/** Người dùng — bảng `users` (tên class giữ `AppUser` theo code hiện có). */
@Entity
@Table(name = "users")
@Getter
@Setter
public class AppUser {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "user_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "default_store_id")
  private Store defaultStore;

  @Column(nullable = false, length = 50, unique = true)
  private String username;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Column(name = "full_name", nullable = false, length = 150)
  private String fullName;

  @Column(length = 20)
  private String phone;

  @Column(length = 100)
  private String email;

  @Column(nullable = false, length = 8)
  private String status;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @OneToMany
  @JoinColumn(name = "user_id")
  private List<UserRoleAssignment> roleAssignments = new ArrayList<>();

  @OneToMany
  @JoinColumn(name = "user_id")
  private List<UserStore> assignedStores = new ArrayList<>();
}
