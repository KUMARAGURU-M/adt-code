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
                        AND (:workflowId IS NULL OR j.workflow.id = :workflowId)
                        AND (:jobIdCode IS NULL OR LOWER(j.jobIdCode)
                            LIKE LOWER(CONCAT('%', CAST(:jobIdCode AS string), '%')))
                        AND (:xmlIsbn IS NULL OR LOWER(j.xmlIsbn)
                            LIKE LOWER(CONCAT('%', CAST(:xmlIsbn AS string), '%')))
                        AND (CAST(:startMonthFrom AS date) IS NULL OR j.receiveDate >= :startMonthFrom)
                        AND (CAST(:startMonthTo AS date) IS NULL OR j.receiveDate <= :startMonthTo)
                        AND (CAST(:uploadDateFrom AS date) IS NULL OR j.uploadDate >= :uploadDateFrom)
                        AND (CAST(:uploadDateTo AS date) IS NULL OR j.uploadDate <= :uploadDateTo)
                        AND (:status IS NULL OR j.status = :status)
                        AND (:billingStatus IS NULL OR j.billingStatus = :billingStatus)
                        AND (:complexity IS NULL OR j.complexity = :complexity)
                        AND (:fileStatus IS NULL OR j.fileStatus = :fileStatus)
                        ORDER BY j.jobIdCode ASC
                        """)
        Page<Job> searchJobs(
                        @Param("projectId") UUID projectId,
                        @Param("clientId") UUID clientId,
                        @Param("workflowId") UUID workflowId,
                        @Param("jobIdCode") String jobIdCode,
                        @Param("xmlIsbn") String xmlIsbn,
                        @Param("startMonthFrom") LocalDate startMonthFrom,
                        @Param("startMonthTo") LocalDate startMonthTo,
                        @Param("uploadDateFrom") LocalDate uploadDateFrom,
                        @Param("uploadDateTo") LocalDate uploadDateTo,
                        @Param("status") String status,
                        @Param("billingStatus") String billingStatus,
                        @Param("complexity") String complexity,
                        @Param("fileStatus") String fileStatus,
                        Pageable pageable);

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
                        AND (:clientId IS NULL OR j.project.client.id = :clientId)
                        AND (:workflowId IS NULL OR j.workflow.id = :workflowId)
                        AND (:jobIdCode IS NULL OR LOWER(j.jobIdCode) LIKE LOWER(CONCAT('%', CAST(:jobIdCode AS string), '%')))
                        AND (:complexity IS NULL OR j.complexity = :complexity)
                        AND (:processStatus IS NULL OR j.processStatus = :processStatus)
                        AND (:qcStatus IS NULL OR j.qcStatus = :qcStatus)
                        AND (CAST(:startDate AS date) IS NULL OR j.endDate >= :startDate)
                        AND (CAST(:endDate AS date) IS NULL OR j.endDate <= :endDate)
                        ORDER BY j.jobIdCode ASC
                        """)
        Page<Job> searchProductionJobs(
                        @Param("projectId") UUID projectId,
                        @Param("clientId") UUID clientId,
                        @Param("workflowId") UUID workflowId,
                        @Param("jobIdCode") String jobIdCode,
                        @Param("complexity") String complexity,
                        @Param("processStatus") String processStatus,
                        @Param("qcStatus") String qcStatus,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate,
                        Pageable pageable);

        @Query("""
                        SELECT j FROM Job j
                        WHERE (j.endDate >= :startDate AND j.endDate <= :endDate)
                           OR (j.receiveDate >= :startDate AND j.receiveDate <= :endDate)
                           OR (j.uploadDate >= :startDate AND j.uploadDate <= :endDate)
                           OR (j.startMonth >= :startDate AND j.startMonth <= :endDate)
                           OR (j.endMonth >= :startDate AND j.endMonth <= :endDate)
                        """)
        List<Job> findActiveOrCompletedJobsInDateRange(
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        @Query("""
                        SELECT j FROM Job j
                        WHERE j.project.id = :projectId
                          AND (
                            (j.endDate >= :startDate AND j.endDate <= :endDate)
                            OR (j.receiveDate >= :startDate AND j.receiveDate <= :endDate)
                            OR (j.uploadDate >= :startDate AND j.uploadDate <= :endDate)
                            OR (j.startMonth >= :startDate AND j.startMonth <= :endDate)
                            OR (j.endMonth >= :startDate AND j.endMonth <= :endDate)
                          )
                        ORDER BY j.receiveDate DESC, j.jobIdCode ASC
                        """)
        List<Job> findActiveOrCompletedJobsByProjectInDateRange(
                        @Param("projectId") UUID projectId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);

        /**
         * Fetches only UPLOADED (completed) jobs for the Page Output Registry.
         * Conditions:
         *   - fileStatus = 'uploaded'  (book job file is uploaded/completed)
         *   - startMonth (production commenced date) within billing cycle
         *   - endDate    (production end date)       within billing cycle
         */
        @Query("""
                        SELECT j FROM Job j
                        WHERE j.project.id = :projectId
                          AND LOWER(j.fileStatus) = 'uploaded'
                          AND (
                            (j.startMonth >= :cycleStart AND j.startMonth <= :cycleEnd)
                            OR (j.endDate >= :cycleStart AND j.endDate <= :cycleEnd)
                            OR (j.endMonth >= :cycleStart AND j.endMonth <= :cycleEnd)
                            OR (j.uploadDate >= :cycleStart AND j.uploadDate <= :cycleEnd)
                            OR (j.receiveDate >= :cycleStart AND j.receiveDate <= :cycleEnd)
                          )
                        ORDER BY COALESCE(j.startMonth, j.receiveDate) ASC, j.jobIdCode ASC
                        """)
        List<Job> findUploadedJobsByProductionDatesInRange(
                        @Param("projectId") UUID projectId,
                        @Param("cycleStart") LocalDate cycleStart,
                        @Param("cycleEnd") LocalDate cycleEnd);

        /**
         * Fetches all incomplete jobs (fileStatus != 'uploaded' or is null) for a list of projects.
         */
        @Query("""
                        SELECT j FROM Job j
                        WHERE j.project.id IN :projectIds
                          AND (j.fileStatus IS NULL OR LOWER(j.fileStatus) != 'uploaded')
                        ORDER BY j.receiveDate DESC, j.jobIdCode ASC
                        """)
        List<Job> findIncompleteJobsByProjectIds(@Param("projectIds") List<UUID> projectIds);

        /**
         * Fetches all incomplete jobs (fileStatus != 'uploaded' or is null) for a specific project.
         */
        @Query("""
                        SELECT j FROM Job j
                        WHERE j.project.id = :projectId
                          AND (j.fileStatus IS NULL OR LOWER(j.fileStatus) != 'uploaded')
                        ORDER BY j.receiveDate DESC, j.jobIdCode ASC
                        """)
        List<Job> findIncompleteJobsByProjectId(@Param("projectId") UUID projectId);
}