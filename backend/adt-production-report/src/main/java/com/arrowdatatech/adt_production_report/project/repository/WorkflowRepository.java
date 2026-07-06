package com.arrowdatatech.adt_production_report.project.repository;

import com.arrowdatatech.adt_production_report.project.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {
    List<Workflow> findAllByOrderByNameAsc();
    boolean existsByName(String name);
    java.util.Optional<Workflow> findByNameIgnoreCase(String name);
}
