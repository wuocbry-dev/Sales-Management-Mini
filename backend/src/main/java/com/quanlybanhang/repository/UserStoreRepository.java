package com.quanlybanhang.repository;

import com.quanlybanhang.model.UserStore;
import com.quanlybanhang.model.UserStore.Pk;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserStoreRepository extends JpaRepository<UserStore, Pk> {

  List<UserStore> findById_UserId(Long userId);

  void deleteById_UserId(Long userId);
}
