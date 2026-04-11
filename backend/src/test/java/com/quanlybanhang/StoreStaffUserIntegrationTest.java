package com.quanlybanhang;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quanlybanhang.dto.AuthDtos.LoginRequest;
import com.quanlybanhang.dto.UserDtos.ChangeStoreStaffBranchRequest;
import com.quanlybanhang.dto.UserDtos.CreateStoreStaffRequest;
import com.quanlybanhang.model.AppUser;
import com.quanlybanhang.model.Branch;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.model.Store;
import com.quanlybanhang.model.UserBranch;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.model.UserStore;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.UserBranchRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import com.quanlybanhang.repository.UserStoreRepository;
import java.time.LocalDateTime;
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
class StoreStaffUserIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private AppUserRepository appUserRepository;
  @Autowired private RoleRepository roleRepository;
  @Autowired private UserRoleAssignmentRepository userRoleAssignmentRepository;
  @Autowired private UserStoreRepository userStoreRepository;
  @Autowired private StoreRepository storeRepository;
  @Autowired private BranchRepository branchRepository;
  @Autowired private UserBranchRepository userBranchRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  private long storeAId;
  private long branchA1Id;
  private long branchA2Id;
  private long branchB1Id;
  private long branchB2Id;
  private long storeBId;
  private String smToken;

  @BeforeEach
  void seed() throws Exception {
    LocalDateTime t = LocalDateTime.now();

    Role smRole =
        roleRepository
            .findByRoleCode("STORE_MANAGER")
            .orElseThrow(() -> new IllegalStateException("Thiếu role STORE_MANAGER (bootstrap)."));

    Store storeA = new Store();
    storeA.setStoreCode("SS-A");
    storeA.setStoreName("Store A");
    storeA.setStatus("ACTIVE");
    storeA.setCreatedAt(t);
    storeA.setUpdatedAt(t);
    storeRepository.save(storeA);
    storeAId = storeA.getId();

    Store storeB = new Store();
    storeB.setStoreCode("SS-B");
    storeB.setStoreName("Store B");
    storeB.setStatus("ACTIVE");
    storeB.setCreatedAt(t);
    storeB.setUpdatedAt(t);
    storeRepository.save(storeB);
    storeBId = storeB.getId();

    Branch bA = new Branch();
    bA.setStoreId(storeAId);
    bA.setBranchCode("SS-A-B1");
    bA.setBranchName("CN A1");
    bA.setStatus("ACTIVE");
    bA.setCreatedAt(t);
    bA.setUpdatedAt(t);
    branchRepository.save(bA);
    branchA1Id = bA.getId();

    Branch bA2 = new Branch();
    bA2.setStoreId(storeAId);
    bA2.setBranchCode("SS-A-B2");
    bA2.setBranchName("CN A2");
    bA2.setStatus("ACTIVE");
    bA2.setCreatedAt(t);
    bA2.setUpdatedAt(t);
    branchRepository.save(bA2);
    branchA2Id = bA2.getId();

    Branch bB = new Branch();
    bB.setStoreId(storeB.getId());
    bB.setBranchCode("SS-B-B1");
    bB.setBranchName("CN B1");
    bB.setStatus("ACTIVE");
    bB.setCreatedAt(t);
    bB.setUpdatedAt(t);
    branchRepository.save(bB);
    branchB1Id = bB.getId();

    Branch bB2 = new Branch();
    bB2.setStoreId(storeBId);
    bB2.setBranchCode("SS-B-B2");
    bB2.setBranchName("CN B2");
    bB2.setStatus("ACTIVE");
    bB2.setCreatedAt(t);
    bB2.setUpdatedAt(t);
    branchRepository.save(bB2);
    branchB2Id = bB2.getId();

    AppUser sm = new AppUser();
    sm.setUsername("ss_sm");
    sm.setEmail("ss_sm@test.local");
    sm.setPasswordHash(passwordEncoder.encode("secret"));
    sm.setFullName("Store Manager Test");
    sm.setStatus("ACTIVE");
    sm.setCreatedAt(t);
    sm.setUpdatedAt(t);
    appUserRepository.save(sm);

    UserRoleAssignment smLink = new UserRoleAssignment();
    smLink.setId(new UserRoleAssignment.Pk(sm.getId(), smRole.getId()));
    userRoleAssignmentRepository.save(smLink);

    UserStore us = new UserStore();
    us.setId(new UserStore.Pk(sm.getId(), storeAId));
    us.setPrimary(true);
    userStoreRepository.save(us);

    var loginRes =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new LoginRequest("ss_sm", "secret"))))
            .andExpect(status().isOk())
            .andReturn();
    smToken =
        objectMapper
            .readTree(loginRes.getResponse().getContentAsString())
            .get("accessToken")
            .asText();
  }

  @Test
  void createStoreStaff_asStoreManager_cashier_success() throws Exception {
    CreateStoreStaffRequest body =
        new CreateStoreStaffRequest(
            "ss_cashier1",
            "password1",
            "Cashier One",
            "0909111111",
            "ss_cashier1@test.local",
            "CASHIER",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.username").value("ss_cashier1"))
        .andExpect(jsonPath("$.roleCode").value("CASHIER"))
        .andExpect(jsonPath("$.storeId").value((int) storeAId))
        .andExpect(jsonPath("$.branchId").value((int) branchA1Id));
  }

  @Test
  void createStoreStaff_asStoreManager_warehouse_success() throws Exception {
    CreateStoreStaffRequest body =
        new CreateStoreStaffRequest(
            "ss_wh1",
            "password1",
            "WH One",
            null,
            "ss_wh1@test.local",
            "WAREHOUSE_STAFF",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.roleCode").value("WAREHOUSE_STAFF"));
  }

  @Test
  void createStoreStaff_invalidRole_rejected() throws Exception {
    CreateStoreStaffRequest body =
        new CreateStoreStaffRequest(
            "ss_badrole",
            "password1",
            "Bad",
            null,
            "ss_bad@test.local",
            "STORE_MANAGER",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("INVALID_ROLE_FOR_STORE_MANAGER"));
  }

  @Test
  void createStoreStaff_branchOtherStore_forbidden() throws Exception {
    CreateStoreStaffRequest body =
        new CreateStoreStaffRequest(
            "ss_wrongbr",
            "password1",
            "Wrong Br",
            null,
            "ss_wrongbr@test.local",
            "CASHIER",
            branchB1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("BRANCH_NOT_IN_MANAGER_STORE"));
  }

  @Test
  void createStoreStaff_duplicateUsername_conflict() throws Exception {
    CreateStoreStaffRequest first =
        new CreateStoreStaffRequest(
            "ss_dup",
            "password1",
            "Dup",
            null,
            "ss_dup1@test.local",
            "CASHIER",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(first)))
        .andExpect(status().isCreated());

    CreateStoreStaffRequest second =
        new CreateStoreStaffRequest(
            "ss_dup",
            "password1",
            "Dup2",
            null,
            "ss_dup2@test.local",
            "WAREHOUSE_STAFF",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(second)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("USERNAME_ALREADY_EXISTS"));
  }

  @Test
  void createStoreStaff_duplicateEmail_conflict() throws Exception {
    CreateStoreStaffRequest first =
        new CreateStoreStaffRequest(
            "ss_e1",
            "password1",
            "E1",
            null,
            "same_email@test.local",
            "CASHIER",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(first)))
        .andExpect(status().isCreated());

    CreateStoreStaffRequest second =
        new CreateStoreStaffRequest(
            "ss_e2",
            "password1",
            "E2",
            null,
            "same_email@test.local",
            "WAREHOUSE_STAFF",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(second)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
  }

  @Test
  void storeStaff_withoutToken_unauthorized() throws Exception {
    CreateStoreStaffRequest body =
        new CreateStoreStaffRequest(
            "ss_nt",
            "password1",
            "NT",
            null,
            "ss_nt@test.local",
            "CASHIER",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff").contentType(APPLICATION_JSON).content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void storeStaff_asCashier_forbidden() throws Exception {
    Role cashierRole =
        roleRepository
            .findByRoleCode("CASHIER")
            .orElseThrow(() -> new IllegalStateException("Thiếu role CASHIER (bootstrap)."));
    LocalDateTime t = LocalDateTime.now();
    AppUser c = new AppUser();
    c.setUsername("ss_cashier_only");
    c.setEmail("ss_co@test.local");
    c.setPasswordHash(passwordEncoder.encode("secret"));
    c.setFullName("Cashier Only");
    c.setStatus("ACTIVE");
    c.setCreatedAt(t);
    c.setUpdatedAt(t);
    appUserRepository.save(c);
    UserRoleAssignment cl = new UserRoleAssignment();
    cl.setId(new UserRoleAssignment.Pk(c.getId(), cashierRole.getId()));
    userRoleAssignmentRepository.save(cl);
    UserStore us = new UserStore();
    us.setId(new UserStore.Pk(c.getId(), storeAId));
    us.setPrimary(true);
    userStoreRepository.save(us);

    var loginRes =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new LoginRequest("ss_cashier_only", "secret"))))
            .andExpect(status().isOk())
            .andReturn();
    String cashierToken =
        objectMapper
            .readTree(loginRes.getResponse().getContentAsString())
            .get("accessToken")
            .asText();

    CreateStoreStaffRequest body =
        new CreateStoreStaffRequest(
            "ss_by_cashier",
            "password1",
            "X",
            null,
            "ss_by_cashier@test.local",
            "CASHIER",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + cashierToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void getStoreStaff_byId_ok() throws Exception {
    CreateStoreStaffRequest body =
        new CreateStoreStaffRequest(
            "ss_get1",
            "password1",
            "Get One",
            null,
            "ss_get1@test.local",
            "CASHIER",
            branchA1Id,
            null);
    var res =
        mockMvc
            .perform(
                post("/api/users/store-staff")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                    .contentType(APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andReturn();
    long uid =
        objectMapper.readTree(res.getResponse().getContentAsString()).get("userId").asLong();

    mockMvc
        .perform(
            get("/api/users/store-staff/" + uid)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").value((int) uid))
        .andExpect(jsonPath("$.roleCode").value("CASHIER"));
  }

  @Test
  void listStoreStaff_asStoreManager_ok() throws Exception {
    CreateStoreStaffRequest body =
        new CreateStoreStaffRequest(
            "ss_list1",
            "password1",
            "List One",
            null,
            "ss_list1@test.local",
            "CASHIER",
            branchA1Id,
            null);
    mockMvc
        .perform(
            post("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isCreated());

    mockMvc
        .perform(
            get("/api/users/store-staff")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .param("roleCode", "CASHIER"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[0].username").value("ss_list1"));
  }

  @Test
  void changeBranch_cashier_success() throws Exception {
    CreateStoreStaffRequest create =
        new CreateStoreStaffRequest(
            "ss_mv_cash",
            "password1",
            "Move Cash",
            null,
            "ss_mv_cash@test.local",
            "CASHIER",
            branchA1Id,
            null);
    var res =
        mockMvc
            .perform(
                post("/api/users/store-staff")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                    .contentType(APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(create)))
            .andExpect(status().isCreated())
            .andReturn();
    long uid =
        objectMapper.readTree(res.getResponse().getContentAsString()).get("userId").asLong();

    ChangeStoreStaffBranchRequest body = new ChangeStoreStaffBranchRequest(branchA2Id);
    mockMvc
        .perform(
            put("/api/users/store-staff/" + uid + "/change-branch")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.oldBranchId").value((int) branchA1Id))
        .andExpect(jsonPath("$.newBranchId").value((int) branchA2Id))
        .andExpect(jsonPath("$.storeId").value((int) storeAId));
  }

  @Test
  void changeBranch_warehouseStaff_success() throws Exception {
    CreateStoreStaffRequest create =
        new CreateStoreStaffRequest(
            "ss_mv_wh",
            "password1",
            "Move WH",
            null,
            "ss_mv_wh@test.local",
            "WAREHOUSE_STAFF",
            branchA2Id,
            null);
    var res =
        mockMvc
            .perform(
                post("/api/users/store-staff")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                    .contentType(APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(create)))
            .andExpect(status().isCreated())
            .andReturn();
    long uid =
        objectMapper.readTree(res.getResponse().getContentAsString()).get("userId").asLong();

    ChangeStoreStaffBranchRequest body = new ChangeStoreStaffBranchRequest(branchA1Id);
    mockMvc
        .perform(
            put("/api/users/store-staff/" + uid + "/change-branch")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.roleCode").value("WAREHOUSE_STAFF"));
  }

  @Test
  void changeBranch_storeManagerUser_forbidden() throws Exception {
    Role smRole =
        roleRepository
            .findByRoleCode("STORE_MANAGER")
            .orElseThrow(() -> new IllegalStateException("Thiếu role STORE_MANAGER (bootstrap)."));
    LocalDateTime t = LocalDateTime.now();
    AppUser otherSm = new AppUser();
    otherSm.setUsername("ss_other_sm");
    otherSm.setEmail("ss_other_sm@test.local");
    otherSm.setPasswordHash(passwordEncoder.encode("secret"));
    otherSm.setFullName("Other SM");
    otherSm.setStatus("ACTIVE");
    otherSm.setCreatedAt(t);
    otherSm.setUpdatedAt(t);
    appUserRepository.save(otherSm);
    UserRoleAssignment link = new UserRoleAssignment();
    link.setId(new UserRoleAssignment.Pk(otherSm.getId(), smRole.getId()));
    userRoleAssignmentRepository.save(link);
    UserStore usm = new UserStore();
    usm.setId(new UserStore.Pk(otherSm.getId(), storeAId));
    usm.setPrimary(true);
    userStoreRepository.save(usm);
    UserBranch ub = new UserBranch();
    ub.setId(new UserBranch.Pk(otherSm.getId(), branchA1Id));
    ub.setPrimary(true);
    userBranchRepository.save(ub);

    ChangeStoreStaffBranchRequest body = new ChangeStoreStaffBranchRequest(branchA2Id);
    mockMvc
        .perform(
            put("/api/users/store-staff/" + otherSm.getId() + "/change-branch")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("INVALID_TARGET_ROLE"));
  }

  @Test
  void changeBranch_targetBranchOtherStore_forbidden() throws Exception {
    CreateStoreStaffRequest create =
        new CreateStoreStaffRequest(
            "ss_mv_cross",
            "password1",
            "Cross",
            null,
            "ss_mv_cross@test.local",
            "CASHIER",
            branchA1Id,
            null);
    var res =
        mockMvc
            .perform(
                post("/api/users/store-staff")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                    .contentType(APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(create)))
            .andExpect(status().isCreated())
            .andReturn();
    long uid =
        objectMapper.readTree(res.getResponse().getContentAsString()).get("userId").asLong();

    ChangeStoreStaffBranchRequest body = new ChangeStoreStaffBranchRequest(branchB1Id);
    mockMvc
        .perform(
            put("/api/users/store-staff/" + uid + "/change-branch")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("TARGET_BRANCH_NOT_IN_MANAGER_STORE"));
  }

  @Test
  void changeBranch_sameBranch_badRequest() throws Exception {
    CreateStoreStaffRequest create =
        new CreateStoreStaffRequest(
            "ss_mv_same",
            "password1",
            "Same",
            null,
            "ss_mv_same@test.local",
            "CASHIER",
            branchA1Id,
            null);
    var res =
        mockMvc
            .perform(
                post("/api/users/store-staff")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                    .contentType(APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(create)))
            .andExpect(status().isCreated())
            .andReturn();
    long uid =
        objectMapper.readTree(res.getResponse().getContentAsString()).get("userId").asLong();

    ChangeStoreStaffBranchRequest body = new ChangeStoreStaffBranchRequest(branchA1Id);
    mockMvc
        .perform(
            put("/api/users/store-staff/" + uid + "/change-branch")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("SAME_BRANCH_ASSIGNMENT"));
  }

  @Test
  void changeBranch_withoutToken_unauthorized() throws Exception {
    ChangeStoreStaffBranchRequest body = new ChangeStoreStaffBranchRequest(branchA2Id);
    mockMvc
        .perform(
            put("/api/users/store-staff/999/change-branch")
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void changeBranch_asCashier_forbidden() throws Exception {
    Role cashierRole =
        roleRepository
            .findByRoleCode("CASHIER")
            .orElseThrow(() -> new IllegalStateException("Thiếu role CASHIER (bootstrap)."));
    LocalDateTime t = LocalDateTime.now();
    AppUser c = new AppUser();
    c.setUsername("ss_put_cashier");
    c.setEmail("ss_put_c@test.local");
    c.setPasswordHash(passwordEncoder.encode("secret"));
    c.setFullName("Put Cashier");
    c.setStatus("ACTIVE");
    c.setCreatedAt(t);
    c.setUpdatedAt(t);
    appUserRepository.save(c);
    UserRoleAssignment cl = new UserRoleAssignment();
    cl.setId(new UserRoleAssignment.Pk(c.getId(), cashierRole.getId()));
    userRoleAssignmentRepository.save(cl);
    UserStore us = new UserStore();
    us.setId(new UserStore.Pk(c.getId(), storeAId));
    us.setPrimary(true);
    userStoreRepository.save(us);
    UserBranch ub = new UserBranch();
    ub.setId(new UserBranch.Pk(c.getId(), branchA1Id));
    ub.setPrimary(true);
    userBranchRepository.save(ub);

    var loginRes =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            new LoginRequest("ss_put_cashier", "secret"))))
            .andExpect(status().isOk())
            .andReturn();
    String cashierToken =
        objectMapper
            .readTree(loginRes.getResponse().getContentAsString())
            .get("accessToken")
            .asText();

    CreateStoreStaffRequest staff =
        new CreateStoreStaffRequest(
            "ss_put_victim",
            "password1",
            "Victim",
            null,
            "ss_put_victim@test.local",
            "CASHIER",
            branchA2Id,
            null);
    var staffRes =
        mockMvc
            .perform(
                post("/api/users/store-staff")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                    .contentType(APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(staff)))
            .andExpect(status().isCreated())
            .andReturn();
    long victimId =
        objectMapper.readTree(staffRes.getResponse().getContentAsString()).get("userId").asLong();

    ChangeStoreStaffBranchRequest body = new ChangeStoreStaffBranchRequest(branchA1Id);
    mockMvc
        .perform(
            put("/api/users/store-staff/" + victimId + "/change-branch")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + cashierToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void changeBranch_userNotInManagerScope_forbidden() throws Exception {
    Role cashierRole =
        roleRepository
            .findByRoleCode("CASHIER")
            .orElseThrow(() -> new IllegalStateException("Thiếu role CASHIER (bootstrap)."));
    LocalDateTime t = LocalDateTime.now();
    AppUser inB = new AppUser();
    inB.setUsername("ss_cash_store_b");
    inB.setEmail("ss_cash_b@test.local");
    inB.setPasswordHash(passwordEncoder.encode("secret"));
    inB.setFullName("Cashier Store B");
    inB.setStatus("ACTIVE");
    inB.setCreatedAt(t);
    inB.setUpdatedAt(t);
    appUserRepository.save(inB);
    UserRoleAssignment cl = new UserRoleAssignment();
    cl.setId(new UserRoleAssignment.Pk(inB.getId(), cashierRole.getId()));
    userRoleAssignmentRepository.save(cl);
    UserStore usb = new UserStore();
    usb.setId(new UserStore.Pk(inB.getId(), storeBId));
    usb.setPrimary(true);
    userStoreRepository.save(usb);
    UserBranch ubb = new UserBranch();
    ubb.setId(new UserBranch.Pk(inB.getId(), branchB1Id));
    ubb.setPrimary(true);
    userBranchRepository.save(ubb);

    ChangeStoreStaffBranchRequest body = new ChangeStoreStaffBranchRequest(branchB2Id);
    mockMvc
        .perform(
            put("/api/users/store-staff/" + inB.getId() + "/change-branch")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + smToken)
                .contentType(APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("USER_NOT_IN_MANAGER_SCOPE"));
  }
}
