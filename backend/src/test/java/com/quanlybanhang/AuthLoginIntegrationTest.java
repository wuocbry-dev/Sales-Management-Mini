package com.quanlybanhang;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quanlybanhang.dto.AuthDtos.LoginRequest;
import com.quanlybanhang.model.AppUser;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthLoginIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private AppUserRepository appUserRepository;
  @Autowired private RoleRepository roleRepository;
  @Autowired private UserRoleAssignmentRepository userRoleAssignmentRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  @BeforeEach
  void seedUser() {
    LocalDateTime t = LocalDateTime.now();
    Role role = new Role();
    role.setRoleCode("ADMIN");
    role.setRoleName("Quản trị");
    role.setDescription(null);
    role.setCreatedAt(t);
    role.setUpdatedAt(t);
    roleRepository.save(role);

    AppUser u = new AppUser();
    u.setUsername("itest_admin");
    u.setPasswordHash(passwordEncoder.encode("secret"));
    u.setFullName("ITest Admin");
    u.setPhone(null);
    u.setEmail(null);
    u.setStatus(DomainConstants.STATUS_ACTIVE);
    u.setDefaultStoreId(null);
    u.setCreatedAt(t);
    u.setUpdatedAt(t);
    appUserRepository.save(u);

    UserRoleAssignment link = new UserRoleAssignment();
    link.setId(new UserRoleAssignment.Pk(u.getId(), role.getId()));
    userRoleAssignmentRepository.save(link);
  }

  @Test
  void loginReturnsJwt() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(new LoginRequest("itest_admin", "secret"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").isString())
        .andExpect(jsonPath("$.tokenType").value("Bearer"))
        .andExpect(jsonPath("$.userId").isNumber())
        .andExpect(jsonPath("$.roles[0]").value("ADMIN"));
  }

  @Test
  void loginWrongPasswordReturns401() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(new LoginRequest("itest_admin", "wrong"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("BAD_CREDENTIALS"));
  }
}
