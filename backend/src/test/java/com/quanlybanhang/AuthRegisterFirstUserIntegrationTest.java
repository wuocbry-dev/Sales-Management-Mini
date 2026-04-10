package com.quanlybanhang;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quanlybanhang.dto.AuthDtos.RegisterRequest;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.RoleRepository;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** User đầu tiên trong DB (không seed user) → role ADMIN. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthRegisterFirstUserIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private AppUserRepository appUserRepository;
  @Autowired private RoleRepository roleRepository;

  @BeforeEach
  void seedRolesOnly() {
    LocalDateTime t = LocalDateTime.now();
    Role admin = new Role();
    admin.setRoleCode("ADMIN");
    admin.setRoleName("Admin");
    admin.setCreatedAt(t);
    admin.setUpdatedAt(t);
    roleRepository.save(admin);
    Role cashier = new Role();
    cashier.setRoleCode("CASHIER");
    cashier.setRoleName("Cashier");
    cashier.setCreatedAt(t);
    cashier.setUpdatedAt(t);
    roleRepository.save(cashier);
  }

  @Test
  void firstRegister_getsAdminRole() throws Exception {
    assertEquals(0, appUserRepository.count());

    RegisterRequest body =
        new RegisterRequest("bootstrap", "boot@example.com", "secret12", "Bootstrap", null);
    mockMvc
        .perform(
            post("/api/auth/register")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.user.username").value("bootstrap"))
        .andExpect(jsonPath("$.roles[0]").value("ADMIN"));
  }
}
