package com.arrowdatatech.adt_production_report.leave.repository;

import com.arrowdatatech.adt_production_report.leave.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, UUID> {

    List<LeaveBalance> findByUserIdAndYearOrderByLeaveTypeNameAsc(
            UUID userId, Short year);

    List<LeaveBalance> findByYearOrderByUserIdAsc(Short year);

    Optional<LeaveBalance> findByUserIdAndLeaveTypeIdAndYear(
            UUID userId, UUID leaveTypeId, Short year);
}