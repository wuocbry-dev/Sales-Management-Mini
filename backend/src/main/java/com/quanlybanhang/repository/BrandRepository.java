package com.quanlybanhang.repository;

import com.quanlybanhang.model.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, Long> {

  boolean existsByBrandCode(String brandCode);
}
