package com.arrowdatatech.adt_production_report.project_target.repository;

import com.arrowdatatech.adt_production_report.project_target.entity.ProjectTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectTargetRepository extends JpaRepository<ProjectTarget, UUID> {

    Optional<ProjectTarget> findByProjectIdAndYearAndMonth(UUID projectId, Integer year, Integer month);

    List<ProjectTarget> findByYearAndMonth(Integer year, Integer month);

    List<ProjectTarget> findByProjectIdOrderByYearDescMonthDesc(UUID projectId);
}
