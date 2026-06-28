package com.arrowdatatech.adt_production_report.job.repository;

import com.arrowdatatech.adt_production_report.job.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    // Per-project uniqueness — matches DB constraint UNIQUE(project_id, job_id_code)
    boolean existsByProjectIdAndJobIdCode(UUID projectId, String jobIdCode);

    List<Job> findByProjectIdOrderByReceiveDateDesc(UUID projectId);

    // Jobs linked to a batch — for rollback
    List<Job> findByImportBatchId(UUID importBatchId);

    @Query("""
            SELECT j FROM Job j
            WHERE (:projectId IS NULL OR j.project.id = :projectId)
            AND (:clientId IS NULL OR j.project.client.id = :clientId)
            AND (:jobIdCode IS NULL OR LOWER(j.jobIdCode)
                LIKE LOWER(CONCAT('%', CAST(:jobIdCode AS string), '%')))
            AND (:xmlIsbn IS NULL OR LOWER(j.xmlIsbn)
                LIKE LOWER(CONCAT('%', CAST(:xmlIsbn AS string), '%')))
            AND (:startMonthFrom IS NULL OR j.startMonth >= :startMonthFrom)
            AND (:startMonthTo IS NULL OR j.startMonth <= :startMonthTo)
            AND (:status IS NULL OR j.status = :status)
            AND (:billingStatus IS NULL OR j.billingStatus = :billingStatus)
            AND (:complexity IS NULL OR j.complexity = :complexity)
            AND (:fileStatus IS NULL OR j.fileStatus = :fileStatus)
            ORDER BY j.receiveDate DESC
            """)
    Page<Job> searchJobs(
            @Param("projectId")     UUID projectId,
            @Param("clientId")      UUID clientId,
            @Param("jobIdCode")     String jobIdCode,
            @Param("xmlIsbn")       String xmlIsbn,
            @Param("startMonthFrom") LocalDate startMonthFrom,
            @Param("startMonthTo")  LocalDate startMonthTo,
            @Param("status")        String status,
            @Param("billingStatus") String billingStatus,
            @Param("complexity")    String complexity,
            @Param("fileStatus")    String fileStatus,
            Pageable pageable
    );

    // Available for task assignment
    @Query("""
            SELECT j FROM Job j
            WHERE j.project.id = :projectId
            AND j.status NOT IN ('FINISH','Completed')
            ORDER BY j.jobIdCode ASC
            """)
    List<Job> findAvailableJobsForTask(@Param("projectId") UUID projectId);

    @Query("""
            SELECT DISTINCT j FROM Job j
            WHERE (:projectId IS NULL OR j.project.id = :projectId)
            AND (:startDate IS NULL OR (
                SELECT MIN(t2.assignedDate)
                FROM TaskJobAssignment tja2
                JOIN tja2.task t2
                WHERE tja2.job = j
            ) >= :startDate)
            AND (:endDate IS NULL OR j.endDate <= :endDate)
            ORDER BY j.receiveDate DESC
            """)
    Page<Job> searchProductionJobs(
            @Param("projectId") UUID projectId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );
}