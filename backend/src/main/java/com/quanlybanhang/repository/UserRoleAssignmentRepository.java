package com.quanlybanhang.repository;

import com.quanlybanhang.model.UserRoleAssignment;
import com.quanlybanhang.model.UserRoleAssignment.Pk;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, Pk> {

  List<UserRoleAssignment> findById_UserId(Long userId);

  void deleteById_UserId(Long userId);
}
