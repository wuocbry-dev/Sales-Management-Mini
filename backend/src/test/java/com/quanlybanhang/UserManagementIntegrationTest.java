package com.quanlybanhang;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quanlybanhang.dto.AuthDtos.LoginRequest;
import com.quanlybanhang.dto.UserDtos.CreateUserRequest;
import com.quanlybanhang.model.AppUser;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserManagementIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private AppUserRepository appUserRepository;
  @Autowired private RoleRepository roleRepository;
  @Autowired private UserRoleAssignmentRepository userRoleAssignmentRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  private String adminToken;
  private Long cashierRoleId;

  @BeforeEach
  void seed() throws Exception {
    LocalDateTime t = LocalDateTime.now();
    Role adminRole =
        roleRepository
            .findByRoleCode("SYSTEM_ADMIN")
            .orElseThrow(() -> new IllegalStateException("Thiếu role SYSTEM_ADMIN (bootstrap)."));
    Role cashierRole =
        roleRepository
            .findByRoleCode("CASHIER")
            .orElseThrow(() -> new IllegalStateException("Thiếu role CASHIER (bootstrap)."));
    cashierRoleId = cashierRole.getId();

    AppUser admin = new AppUser();
    admin.setUsername("um_admin");
    admin.setEmail("um_admin@test.local");
    admin.setPasswordHash(passwordEncoder.encode("secret"));
    admin.setFullName("UM Admin");
    admin.setStatus(DomainConstants.STATUS_ACTIVE);
    admin.setDefaultStore(null);
    admin.setCreatedAt(t);
    admin.setUpdatedAt(t);
    appUserRepository.save(admin);

    UserRoleAssignment link = new UserRoleAssignment();
    link.setId(new UserRoleAssignment.Pk(admin.getId(), adminRole.getId()));
    userRoleAssignmentRepository.save(link);

    var loginRes =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(new LoginRequest("um_admin", "secret"))))
            .andExpect(status().isOk())
            .andReturn();
    adminToken =
        objectMapper
            .readTree(loginRes.getResponse().getContentAsString())
            .get("accessToken")
            .asText();
  }

  @Test
  void listUsers_withoutToken_returns401() throws Exception {
    mockMvc.perform(get("/api/users")).andExpect(status().isUnauthorized());
  }

  @Test
  void listUsers_asAdmin_returns200() throws Exception {
    mockMvc
        .perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
  }

  @Test
  void createUser_asAdmin_returns201() throws Exception {
    CreateUserRequest body =
        new CreateUserRequest(
            "staff01",
            "staff01@test.local",
            "password1",
            "Staff One",
            null,
            null,
            List.of(cashierRoleId),
            List.of(),
            null);
    mockMvc
        .perform(
            post("/api/users")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.username").value("staff01"))
        .andExpect(jsonPath("$.roles[0].roleCode").value("CASHIER"));
  }

  @Test
  void listUsers_asCashier_returns403() throws Exception {
    LocalDateTime t = LocalDateTime.now();
    AppUser cashier = new AppUser();
    cashier.setUsername("um_cashier");
    cashier.setEmail("um_c@test.local");
    cashier.setPasswordHash(passwordEncoder.encode("secret"));
    cashier.setFullName("UM Cashier");
    cashier.setStatus(DomainConstants.STATUS_ACTIVE);
    cashier.setDefaultStore(null);
    cashier.setCreatedAt(t);
    cashier.setUpdatedAt(t);
    appUserRepository.save(cashier);
    UserRoleAssignment cl = new UserRoleAssignment();
    cl.setId(new UserRoleAssignment.Pk(cashier.getId(), cashierRoleId));
    userRoleAssignmentRepository.save(cl);

    var loginRes =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(new LoginRequest("um_cashier", "secret"))))
            .andExpect(status().isOk())
            .andReturn();
    String cashierToken =
        objectMapper
            .readTree(loginRes.getResponse().getContentAsString())
            .get("accessToken")
            .asText();

    mockMvc
        .perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + cashierToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }
}
