package com.arrowdatatech.adt_production_report.tool.repository;

import com.arrowdatatech.adt_production_report.tool.entity.Tool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ToolRepository extends JpaRepository<Tool, UUID> {
    List<Tool> findByIsActiveTrueOrderByNameAsc();
    Optional<Tool> findByNameAndIsActiveTrue(String name);
}