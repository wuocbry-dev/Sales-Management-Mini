package com.quanlybanhang.repository;

import com.quanlybanhang.model.AppUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Repository cho bảng `users` — entity `AppUser`. */
public interface UserRepository extends JpaRepository<AppUser, Long> {

  Optional<AppUser> findByUsername(String username);

  Optional<AppUser> findByEmailIgnoreCase(String email);

  @Query(
      "SELECT u FROM AppUser u WHERE LOWER(u.username) = LOWER(:login)"
          + " OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(:login))")
  Optional<AppUser> findByUsernameOrEmail(@Param("login") String login);

  boolean existsByUsername(String username);

  boolean existsByEmailIgnoreCase(String email);
}
