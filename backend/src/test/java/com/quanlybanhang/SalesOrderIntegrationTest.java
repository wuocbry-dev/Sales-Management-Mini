package com.quanlybanhang;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.quanlybanhang.dto.AuthDtos.LoginRequest;
import com.quanlybanhang.model.AppUser;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Inventory;
import com.quanlybanhang.model.Product;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.model.Role;
import com.quanlybanhang.model.SalesOrder;
import com.quanlybanhang.model.Store;
import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.model.UserStore;
import com.quanlybanhang.repository.AppUserRepository;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.ProductRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.RoleRepository;
import com.quanlybanhang.repository.SalesOrderRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.repository.UserRoleAssignmentRepository;
import com.quanlybanhang.repository.UserStoreRepository;
import com.quanlybanhang.service.WarehouseService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SalesOrderIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @Autowired private AppUserRepository appUserRepository;
  @Autowired private RoleRepository roleRepository;
  @Autowired private UserRoleAssignmentRepository userRoleAssignmentRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  @Autowired private StoreRepository storeRepository;
  @Autowired private ProductRepository productRepository;
  @Autowired private ProductVariantRepository variantRepository;
  @Autowired private InventoryRepository inventoryRepository;
  @Autowired private SalesOrderRepository salesOrderRepository;
  @Autowired private UserStoreRepository userStoreRepository;
  @Autowired private WarehouseService warehouseService;

  private long storeId;
  private long centralWarehouseId;
  private long variantId;
  private long cashierUserId;
  private String token;

  @BeforeEach
  void seed() throws Exception {
    LocalDateTime t = LocalDateTime.now();

    Role role =
        roleRepository
            .findByRoleCode("CASHIER")
            .orElseThrow(() -> new IllegalStateException("Thiếu role CASHIER (bootstrap)."));

    AppUser u = new AppUser();
    u.setUsername("itest_cashier");
    u.setPasswordHash(passwordEncoder.encode("secret"));
    u.setFullName("ITest Cashier");
    u.setStatus(DomainConstants.STATUS_ACTIVE);
    u.setCreatedAt(t);
    u.setUpdatedAt(t);
    appUserRepository.save(u);
    cashierUserId = u.getId();

    UserRoleAssignment link = new UserRoleAssignment();
    link.setId(new UserRoleAssignment.Pk(u.getId(), role.getId()));
    userRoleAssignmentRepository.save(link);

    Store store = new Store();
    store.setStoreCode("ST-IT-1");
    store.setStoreName("Cửa hàng test");
    store.setStatus(DomainConstants.STATUS_ACTIVE);
    store.setCreatedAt(t);
    store.setUpdatedAt(t);
    storeRepository.save(store);
    storeId = store.getId();
    centralWarehouseId = warehouseService.ensureCentralWarehouse(storeId).getId();

    UserStore userStore = new UserStore();
    userStore.setId(new UserStore.Pk(cashierUserId, storeId));
    userStore.setPrimary(true);
    userStoreRepository.save(userStore);

    Product p = new Product();
    p.setProductCode("P-IT-1");
    p.setProductName("Sản phẩm test");
    p.setProductType("variant");
    p.setHasVariant(true);
    p.setTrackInventory(true);
    p.setStatus(DomainConstants.STATUS_ACTIVE);
    p.setCreatedAt(t);
    p.setUpdatedAt(t);
    productRepository.save(p);

    ProductVariant v = new ProductVariant();
    v.setProductId(p.getId());
    v.setSku("SKU-IT-1");
    v.setBarcode(null);
    v.setVariantName("Mặc định");
    v.setAttributesJson(null);
    v.setCostPrice(new BigDecimal("5.0000"));
    v.setSellingPrice(new BigDecimal("10.0000"));
    v.setReorderLevel(BigDecimal.ZERO);
    v.setStatus(DomainConstants.STATUS_ACTIVE);
    v.setCreatedAt(t);
    v.setUpdatedAt(t);
    variantRepository.save(v);
    variantId = v.getId();

    Inventory inv = new Inventory();
    inv.setWarehouseId(centralWarehouseId);
    inv.setVariantId(variantId);
    inv.setQuantityOnHand(new BigDecimal("10.0000"));
    inv.setReservedQty(BigDecimal.ZERO);
    inv.setUpdatedAt(t);
    inventoryRepository.save(inv);

    MvcResult login =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(new LoginRequest("itest_cashier", "secret"))))
            .andExpect(status().isOk())
            .andReturn();
    token = objectMapper.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
  }

  private String createOrderJson(long store, long variant, BigDecimal qty, BigDecimal unitPrice) {
    ObjectNode root = objectMapper.createObjectNode();
    root.put("storeId", store);
    root.putNull("customerId");
    root.put("orderDate", "2026-04-10T10:00:00");
    root.put("headerDiscountAmount", 0);
    root.putNull("note");
    ArrayNode lines = root.putArray("lines");
    ObjectNode line = lines.addObject();
    line.put("variantId", variant);
    line.put("quantity", qty);
    line.put("unitPrice", unitPrice);
    line.put("discountAmount", 0);
    return root.toString();
  }

  private String confirmJson(BigDecimal payAmount) {
    ObjectNode root = objectMapper.createObjectNode();
    ArrayNode pays = root.putArray("payments");
    ObjectNode p = pays.addObject();
    p.put("paymentType", "in");
    p.put("paymentMethod", "cash");
    p.put("amount", payAmount);
    p.putNull("referenceNo");
    p.putNull("note");
    return root.toString();
  }

  @Test
  void createAndConfirm_ok_decrementsInventory() throws Exception {
    String body = createOrderJson(storeId, variantId, new BigDecimal("2"), new BigDecimal("10"));
    MvcResult created =
        mockMvc
            .perform(
                post("/api/sales-orders")
                    .header("Authorization", "Bearer " + token)
                    .contentType(APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value(DomainConstants.ORDER_DRAFT))
            .andReturn();
    long orderId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

    mockMvc
        .perform(
            post("/api/sales-orders/" + orderId + "/confirm")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content(confirmJson(new BigDecimal("20"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value(DomainConstants.ORDER_COMPLETED));

    Inventory after =
        inventoryRepository
            .findByWarehouseIdAndVariantId(centralWarehouseId, variantId)
            .orElseThrow();
    assertThat(after.getQuantityOnHand()).isEqualByComparingTo(new BigDecimal("8.0000"));
  }

  @Test
  void confirmTwice_secondFails() throws Exception {
    String body = createOrderJson(storeId, variantId, BigDecimal.ONE, new BigDecimal("10"));
    MvcResult created =
        mockMvc
            .perform(
                post("/api/sales-orders")
                    .header("Authorization", "Bearer " + token)
                    .contentType(APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isCreated())
            .andReturn();
    long orderId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

    mockMvc
        .perform(
            post("/api/sales-orders/" + orderId + "/confirm")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content(confirmJson(new BigDecimal("10"))))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            post("/api/sales-orders/" + orderId + "/confirm")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content(confirmJson(new BigDecimal("10"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
  }

  @Test
  void create_emptyLines_validation() throws Exception {
    ObjectNode root = objectMapper.createObjectNode();
    root.put("storeId", storeId);
    root.putNull("customerId");
    root.put("orderDate", "2026-04-10T10:00:00");
    root.put("headerDiscountAmount", 0);
    root.putArray("lines");

    mockMvc
        .perform(
            post("/api/sales-orders")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content(root.toString()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  @Test
  void confirm_orderWithNoItems_businessRule() throws Exception {
    LocalDateTime t = LocalDateTime.now();
    SalesOrder o = new SalesOrder();
    o.setOrderCode("SO-EMPTY-LINES-IT");
    o.setStoreId(storeId);
    o.setCashierId(cashierUserId);
    o.setOrderDate(t);
    o.setStatus(DomainConstants.ORDER_DRAFT);
    o.setSubtotal(BigDecimal.ZERO);
    o.setDiscountAmount(BigDecimal.ZERO);
    o.setTotalAmount(BigDecimal.ZERO);
    o.setPaidAmount(BigDecimal.ZERO);
    o.setPaymentStatus(DomainConstants.PAYMENT_STATUS_UNPAID);
    o.setCreatedAt(t);
    o.setUpdatedAt(t);
    salesOrderRepository.save(o);

    mockMvc
        .perform(
            post("/api/sales-orders/" + o.getId() + "/confirm")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content("{\"payments\":[]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value(containsString("dòng chi tiết")));
  }

  @Test
  void create_badStore() throws Exception {
    mockMvc
        .perform(
            post("/api/sales-orders")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content(createOrderJson(999_999L, variantId, BigDecimal.ONE, new BigDecimal("10"))))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void create_badVariant() throws Exception {
    mockMvc
        .perform(
            post("/api/sales-orders")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content(createOrderJson(storeId, 999_999L, BigDecimal.ONE, new BigDecimal("10"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
  }

  @Test
  void confirm_insufficientStock() throws Exception {
    String body = createOrderJson(storeId, variantId, new BigDecimal("100"), new BigDecimal("1"));
    MvcResult created =
        mockMvc
            .perform(
                post("/api/sales-orders")
                    .header("Authorization", "Bearer " + token)
                    .contentType(APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isCreated())
            .andReturn();
    long orderId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

    mockMvc
        .perform(
            post("/api/sales-orders/" + orderId + "/confirm")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content(confirmJson(new BigDecimal("100"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("BUSINESS_RULE"))
        .andExpect(jsonPath("$.message").value(containsString("Không đủ tồn")));
  }

  @Test
  void create_invalidQuantity_validation() throws Exception {
    ObjectNode root = objectMapper.createObjectNode();
    root.put("storeId", storeId);
    root.putNull("customerId");
    root.put("orderDate", "2026-04-10T10:00:00");
    root.put("headerDiscountAmount", 0);
    ArrayNode lines = root.putArray("lines");
    ObjectNode line = lines.addObject();
    line.put("variantId", variantId);
    line.put("quantity", 0);
    line.put("unitPrice", 10);
    line.put("discountAmount", 0);

    mockMvc
        .perform(
            post("/api/sales-orders")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content(root.toString()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  @Test
  void create_negativeUnitPrice_validation() throws Exception {
    ObjectNode root = objectMapper.createObjectNode();
    root.put("storeId", storeId);
    root.putNull("customerId");
    root.put("orderDate", "2026-04-10T10:00:00");
    root.put("headerDiscountAmount", 0);
    ArrayNode lines = root.putArray("lines");
    ObjectNode line = lines.addObject();
    line.put("variantId", variantId);
    line.put("quantity", 1);
    line.put("unitPrice", -1);
    line.put("discountAmount", 0);

    mockMvc
        .perform(
            post("/api/sales-orders")
                .header("Authorization", "Bearer " + token)
                .contentType(APPLICATION_JSON)
                .content(root.toString()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  @Test
  void apiWithoutToken_returns401() throws Exception {
    mockMvc
        .perform(
            post("/api/sales-orders")
                .contentType(APPLICATION_JSON)
                .content(createOrderJson(storeId, variantId, BigDecimal.ONE, new BigDecimal("10"))))
        .andExpect(status().isUnauthorized());
  }
}
