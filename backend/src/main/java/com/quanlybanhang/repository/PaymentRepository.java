package com.quanlybanhang.repository;

import com.quanlybanhang.model.Payment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

  List<Payment> findByOrderIdOrderByIdAsc(Long orderId);
}
