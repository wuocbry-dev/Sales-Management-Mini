package com.quanlybanhang.repository;

import com.quanlybanhang.model.UserBranch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBranchRepository extends JpaRepository<UserBranch, UserBranch.Pk> {

  List<UserBranch> findById_UserId(Long userId);

  void deleteById_UserId(Long userId);
}
