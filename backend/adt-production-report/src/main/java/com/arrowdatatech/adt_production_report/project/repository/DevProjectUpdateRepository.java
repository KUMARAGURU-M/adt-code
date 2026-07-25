package com.arrowdatatech.adt_production_report.project.repository;

import com.arrowdatatech.adt_production_report.project.entity.DevProjectUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DevProjectUpdateRepository extends JpaRepository<DevProjectUpdate, UUID> {
    List<DevProjectUpdate> findByProjectIdOrderByDateDescCreatedAtDesc(UUID projectId);
}
