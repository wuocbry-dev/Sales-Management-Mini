package com.quanlybanhang;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quanlybanhang.dto.AuthDtos.LoginRequest;
import com.quanlybanhang.dto.AuthDtos.RegisterRequest;
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
import org.springframework.http.HttpHeaders;
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
    Role admin =
        roleRepository
            .findByRoleCode("SYSTEM_ADMIN")
            .orElseThrow(() -> new IllegalStateException("Thiếu role SYSTEM_ADMIN (bootstrap)."));

    AppUser u = new AppUser();
    u.setUsername("itest_admin");
    u.setPasswordHash(passwordEncoder.encode("secret"));
    u.setFullName("ITest Admin");
    u.setPhone(null);
    u.setEmail(null);
    u.setStatus(DomainConstants.STATUS_ACTIVE);
    u.setDefaultStore(null);
    u.setCreatedAt(t);
    u.setUpdatedAt(t);
    appUserRepository.save(u);

    UserRoleAssignment link = new UserRoleAssignment();
    link.setId(new UserRoleAssignment.Pk(u.getId(), admin.getId()));
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
        .andExpect(jsonPath("$.user.id").isNumber())
        .andExpect(jsonPath("$.user.username").value("itest_admin"))
        .andExpect(jsonPath("$.roles[0]").value("SYSTEM_ADMIN"));
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
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
  }

  @Test
  void loginLockedAccount_returns403() throws Exception {
    AppUser u = appUserRepository.findByUsername("itest_admin").orElseThrow();
    u.setStatus(DomainConstants.STATUS_LOCKED);
    appUserRepository.save(u);

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(new LoginRequest("itest_admin", "secret"))))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
  }

  @Test
  void me_withoutBearer_returns401() throws Exception {
    mockMvc
        .perform(get("/api/auth/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
  }

  @Test
  void registeredStoreManager_cannotListUsers_returns403() throws Exception {
    RegisterRequest reg =
        new RegisterRequest("itest_cashier", "cashier@itest.local", "secret12", "Cashier", null);
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
        .andExpect(status().isOk());

    var loginRes =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new LoginRequest("itest_cashier", "secret12"))))
            .andExpect(status().isOk())
            .andReturn();
    String token =
        objectMapper
            .readTree(loginRes.getResponse().getContentAsString())
            .get("accessToken")
            .asText();

    mockMvc
        .perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void registerNewUser_returnsStoreManagerAndToken() throws Exception {
    RegisterRequest body =
        new RegisterRequest("dev_user", "dev@example.com", "secret12", "Dev User", null);
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accessToken").isString())
        .andExpect(jsonPath("$.user.username").value("dev_user"))
        .andExpect(jsonPath("$.roles[0]").value("STORE_MANAGER"));
  }

  @Test
  void me_withBearerToken_returnsUser() throws Exception {
    var loginRes =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new LoginRequest("itest_admin", "secret"))))
            .andExpect(status().isOk())
            .andReturn();
    String token =
        objectMapper
            .readTree(loginRes.getResponse().getContentAsString())
            .get("accessToken")
            .asText();

    mockMvc
        .perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("itest_admin"))
        .andExpect(jsonPath("$.roles[0]").value("SYSTEM_ADMIN"));
  }

  @Test
  void registerDuplicateUsername_returns409() throws Exception {
    RegisterRequest body =
        new RegisterRequest("itest_admin", "other@example.com", "secret12", "X", null);
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("USERNAME_ALREADY_EXISTS"));
  }

  @Test
  void registerDuplicateEmail_returns409() throws Exception {
    AppUser u = appUserRepository.findByUsername("itest_admin").orElseThrow();
    u.setEmail("dup@example.com");
    appUserRepository.save(u);

    RegisterRequest body =
        new RegisterRequest("new_name", "dup@example.com", "secret12", "X", null);
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
  }
}
