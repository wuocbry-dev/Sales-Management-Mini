package com.quanlybanhang.repository;

import java.math.BigDecimal;

/** Kết quả truy vấn gợi ý biến thể (Spring Data interface projection). */
public interface ProductVariantOptionProjection {

  Long getId();

  String getSku();

  String getVariantName();

  String getProductName();

  BigDecimal getSellingPrice();
}
