package com.arrowdatatech.adt_production_report.task.repository;

import com.arrowdatatech.adt_production_report.task.entity.DevTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DevTaskRepository extends JpaRepository<DevTask, UUID> {
    List<DevTask> findByAssignedToId(UUID userId);
}
