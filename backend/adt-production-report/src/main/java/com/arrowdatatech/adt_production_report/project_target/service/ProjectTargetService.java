package com.arrowdatatech.adt_production_report.project_target.service;

import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.job.entity.Job;
import com.arrowdatatech.adt_production_report.job.repository.JobRepository;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.repository.ProjectRepository;
import com.arrowdatatech.adt_production_report.project.repository.UserProjectAssignmentRepository;
import com.arrowdatatech.adt_production_report.task.repository.TaskRepository;
import com.arrowdatatech.adt_production_report.project_target.dto.ProjectTargetRequest;
import com.arrowdatatech.adt_production_report.project_target.dto.ProjectTargetResponse;
import com.arrowdatatech.adt_production_report.project_target.dto.ProjectTargetDetailResponse;
import com.arrowdatatech.adt_production_report.project_target.dto.BulkProjectTargetRequest;
import com.arrowdatatech.adt_production_report.project_target.dto.ProjectTargetItemRequest;
import com.arrowdatatech.adt_production_report.project_target.entity.ProjectTarget;
import com.arrowdatatech.adt_production_report.project_target.repository.ProjectTargetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectTargetService {

    private final ProjectTargetRepository targetRepository;
    private final ProjectRepository projectRepository;
    private final JobRepository jobRepository;
    private final UserProjectAssignmentRepository assignmentRepository;
    private final TaskRepository taskRepository;

    private LocalDate[] getBillingCycleRange(UUID projectId, int year, int month, ProjectTarget currentTarget) {
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());

        // Case 1: If current target has explicitly configured dates, use them
        if (currentTarget != null && currentTarget.getBillingCycleStartDate() != null
                && currentTarget.getBillingCycleEndDate() != null) {
            return new LocalDate[]{currentTarget.getBillingCycleStartDate(), currentTarget.getBillingCycleEndDate()};
        }

        // Case 2: Inherit billing cycle dates from the project's most recently configured target
        List<ProjectTarget> historicalTargets = targetRepository.findByProjectIdOrderByYearDescMonthDesc(projectId);
        for (ProjectTarget historical : historicalTargets) {
            if (historical.getBillingCycleStartDate() != null && historical.getBillingCycleEndDate() != null) {
                int histYear = historical.getYear();
                int histMonth = historical.getMonth();
                long monthsDiff = (year - histYear) * 12L + (month - histMonth);
                
                LocalDate inheritedStart = historical.getBillingCycleStartDate().plusMonths(monthsDiff);
                LocalDate inheritedEnd = historical.getBillingCycleEndDate().plusMonths(monthsDiff);
                return new LocalDate[]{inheritedStart, inheritedEnd};
            }
        }

        // Case 3: Fallback to calendar month boundaries
        return new LocalDate[]{startOfMonth, endOfMonth};
    }

    @Transactional(readOnly = true)
    public List<ProjectTargetResponse> getTargetsReport(int year, int month) {
        // 1. Fetch active projects and all targets set for this month
        List<Project> activeProjects = projectRepository.findByIsActiveTrueOrderByNameAsc();
        List<ProjectTarget> targets = targetRepository.findByYearAndMonth(year, month);

        // Map targets by project ID for quick lookup
        Map<UUID, ProjectTarget> targetsByProject = targets.stream()
                .collect(Collectors.toMap(t -> t.getProject().getId(), t -> t, (t1, t2) -> t1));

        // Gather all project IDs to display (all active projects, plus any inactive
        // project that has a target set for this month)
        Set<UUID> targetProjectIds = targets.stream().map(t -> t.getProject().getId()).collect(Collectors.toSet());
        List<Project> projectsToDisplay = new ArrayList<>(activeProjects);
        for (ProjectTarget target : targets) {
            if (!activeProjects.contains(target.getProject())) {
                projectsToDisplay.add(target.getProject());
            }
        }

        // Sort projects to display by name
        projectsToDisplay.sort(Comparator.comparing(Project::getName, String.CASE_INSENSITIVE_ORDER));

        // 2. Fetch jobs active/completed in this month (widened by 1 month to handle
        // custom billing cycles)
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.with(TemporalAdjusters.lastDayOfMonth());
        LocalDate queryStart = startOfMonth.minusMonths(1);
        List<Job> monthJobs = jobRepository.findActiveOrCompletedJobsInDateRange(queryStart, endOfMonth);

        // Group jobs by project ID
        Map<UUID, List<Job>> jobsByProject = monthJobs.stream()
                .filter(j -> j.getProject() != null)
                .collect(Collectors.groupingBy(j -> j.getProject().getId()));

        List<ProjectTargetResponse> report = new ArrayList<>();

        for (Project project : projectsToDisplay) {
            ProjectTarget target = targetsByProject.get(project.getId());

            // 1. Determine billing cycle range
            LocalDate[] range = getBillingCycleRange(project.getId(), year, month, target);
            LocalDate finalCycleStart = range[0];
            LocalDate finalCycleEnd = range[1];

            List<Job> projectJobs = jobsByProject.getOrDefault(project.getId(), List.of()).stream()
                    .filter(j -> {
                        String fileStatusStr = j.getFileStatus() != null ? j.getFileStatus().trim().toLowerCase() : "";
                        boolean isCompleted = fileStatusStr.equals("uploaded");

                        if (isCompleted) {
                            LocalDate effectiveEndDate = j.getEndDate() != null ? j.getEndDate() : j.getEndMonth();
                            LocalDate effectiveUploadDate = j.getUploadDate() != null ? j.getUploadDate() : effectiveEndDate;

                            // Rule: uploadDate falls between billing cycle start and end dates
                            return effectiveUploadDate != null
                                    && !effectiveUploadDate.isBefore(finalCycleStart)
                                    && !effectiveUploadDate.isAfter(finalCycleEnd);
                        } else {
                            LocalDate receive = j.getReceiveDate();
                            LocalDate upload = j.getUploadDate();
                            LocalDate startDay = receive != null ? receive : upload;
                            return startDay != null && !startDay.isAfter(finalCycleEnd);
                        }
                    })
                    .collect(Collectors.toList());

            // Initialize actual metrics
            int completedMonth = 0;
            int completedW1 = 0;
            int completedW2 = 0;
            int completedW3 = 0;
            int completedW4 = 0;
            int completedW5 = 0;

            // Page stats
            int pagesSimple = 0;
            int pagesMedium = 0;
            int pagesComplex = 0;
            int pagesHeavyComplex = 0;
            int pagesTotal = 0;

            int pagesW1 = 0;
            int pagesW2 = 0;
            int pagesW3 = 0;
            int pagesW4 = 0;
            int pagesW5 = 0;

            int pending = 0;
            int inProgress = 0;
            int onHold = 0;
            int other = 0;

            for (Job job : projectJobs) {
                String fileStatusStr = job.getFileStatus() != null ? job.getFileStatus().trim().toLowerCase() : "";
                boolean isCompleted = fileStatusStr.equals("uploaded");

                if (isCompleted) {
                    completedMonth++;
                    int pages = job.getPageCount() != null ? job.getPageCount() : 0;
                    pagesTotal += pages;

                    String compType = job.getComplexity() != null ? job.getComplexity().trim().toLowerCase() : "";
                    if (compType.contains("simple")) {
                        pagesSimple += pages;
                    } else if (compType.contains("heavy") && compType.contains("complex")) {
                        pagesHeavyComplex += pages;
                    } else if (compType.contains("medium")) {
                        pagesMedium += pages;
                    } else if (compType.contains("complex")) {
                        pagesComplex += pages;
                    }

                    LocalDate effectiveEndDate = job.getEndDate() != null ? job.getEndDate() : job.getEndMonth();
                    LocalDate effectiveUploadDate = job.getUploadDate() != null ? job.getUploadDate() : effectiveEndDate;
                    if (effectiveUploadDate != null) {
                        long uploadDays = java.time.temporal.ChronoUnit.DAYS.between(finalCycleStart, effectiveUploadDate);
                        
                        if (uploadDays >= 0) {
                            if (uploadDays < 7) {
                                completedW1++;
                                pagesW1 += pages;
                            } else if (uploadDays >= 7 && uploadDays < 14) {
                                completedW2++;
                                pagesW2 += pages;
                            } else if (uploadDays >= 14 && uploadDays < 21) {
                                completedW3++;
                                pagesW3 += pages;
                            } else if (uploadDays >= 21 && uploadDays < 28) {
                                completedW4++;
                                pagesW4 += pages;
                            } else {
                                // Week 5 (ensure it is within cycleEnd)
                                if (!effectiveUploadDate.isAfter(finalCycleEnd)) {
                                    completedW5++;
                                    pagesW5 += pages;
                                }
                            }
                        }
                    }
                } else {
                    // Check if the job was received on or before the billing cycle end date
                    LocalDate receiveDate = job.getReceiveDate();
                    LocalDate uploadDate = job.getUploadDate();
                    LocalDate effectiveStart = receiveDate != null ? receiveDate : uploadDate;

                    if (effectiveStart != null && !effectiveStart.isAfter(finalCycleEnd)) {
                        String status = job.getStatus() != null ? job.getStatus().trim().toLowerCase() : "";
                        if (status.contains("pending")) {
                            pending++;
                        } else if (status.contains("progress") || status.contains("run")
                                || status.contains("process")) {
                            inProgress++;
                        } else if (status.contains("hold")) {
                            onHold++;
                        } else {
                            other++;
                        }
                    }
                }
            }

            ProjectTargetResponse.ProjectTargetResponseBuilder builder = ProjectTargetResponse.builder()
                    .projectId(project.getId())
                    .projectName(project.getName())
                    .clientName(project.getClient() != null ? project.getClient().getCompanyName() : "N/A")
                    .billingType(project.getType())
                    .complexityLevel(project.getComplexityLevel())
                    .isProjectActive(project.getIsActive())
                    .billingCycleStartDate(finalCycleStart)
                    .billingCycleEndDate(finalCycleEnd)
                    .actualCompletedMonth(completedMonth)
                    .actualCompletedWeek1(completedW1)
                    .actualCompletedWeek2(completedW2)
                    .actualCompletedWeek3(completedW3)
                    .actualCompletedWeek4(completedW4)
                    .actualCompletedWeek5(completedW5)
                    .actualPagesSimple(pagesSimple)
                    .actualPagesMedium(pagesMedium)
                    .actualPagesComplex(pagesComplex)
                    .actualPagesHeavyComplex(pagesHeavyComplex)
                    .actualPagesTotal(pagesTotal)
                    .actualPagesWeek1(pagesW1)
                    .actualPagesWeek2(pagesW2)
                    .actualPagesWeek3(pagesW3)
                    .actualPagesWeek4(pagesW4)
                    .actualPagesWeek5(pagesW5)
                    .actualPending(pending)
                    .actualInProgress(inProgress)
                    .actualOnHold(onHold)
                    .actualOther(other);

            if (target != null) {
                builder.targetId(target.getId())
                        .year(target.getYear())
                        .month(target.getMonth())
                        .monthlyTargetBooks(target.getMonthlyTargetBooks())
                        .weeklyTargetBooks(target.getWeeklyTargetBooks())
                        .week1TargetBooks(target.getWeek1TargetBooks())
                        .week2TargetBooks(target.getWeek2TargetBooks())
                        .week3TargetBooks(target.getWeek3TargetBooks())
                        .week4TargetBooks(target.getWeek4TargetBooks())
                        .week5TargetBooks(target.getWeek5TargetBooks())
                        .targetPagesSimple(target.getTargetPagesSimple())
                        .targetPagesMedium(target.getTargetPagesMedium())
                        .targetPagesComplex(target.getTargetPagesComplex())
                        .targetPagesHeavyComplex(target.getTargetPagesHeavyComplex())
                        .targetPagesTotal(target.getTargetPagesTotal())
                        .targetPagesWeek1(target.getTargetPagesWeek1())
                        .targetPagesWeek2(target.getTargetPagesWeek2())
                        .targetPagesWeek3(target.getTargetPagesWeek3())
                        .targetPagesWeek4(target.getTargetPagesWeek4());
            } else {
                builder.monthlyTargetBooks(0)
                        .weeklyTargetBooks(0)
                        .week1TargetBooks(0)
                        .week2TargetBooks(0)
                        .week3TargetBooks(0)
                        .week4TargetBooks(0)
                        .week5TargetBooks(0)
                        .targetPagesSimple(0)
                        .targetPagesMedium(0)
                        .targetPagesComplex(0)
                        .targetPagesHeavyComplex(0)
                        .targetPagesTotal(0)
                        .targetPagesWeek1(0)
                        .targetPagesWeek2(0)
                        .targetPagesWeek3(0)
                        .targetPagesWeek4(0);
            }

            report.add(builder.build());
        }

        return report;
    }

    @Transactional
    public ProjectTargetResponse saveTarget(ProjectTargetRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        ProjectTarget target = targetRepository.findByProjectIdAndYearAndMonth(
                request.getProjectId(), request.getYear(), request.getMonth())
                .orElse(ProjectTarget.builder()
                        .project(project)
                        .year(request.getYear())
                        .month(request.getMonth())
                        .build());

        target.setBillingCycleStartDate(request.getBillingCycleStartDate());
        target.setBillingCycleEndDate(request.getBillingCycleEndDate());

        target.setMonthlyTargetBooks(request.getMonthlyTargetBooks() != null ? request.getMonthlyTargetBooks() : 0);

        int weekly = request.getWeeklyTargetBooks() != null ? request.getWeeklyTargetBooks()
                : target.getMonthlyTargetBooks() / 4;
        target.setWeeklyTargetBooks(weekly);

        target.setWeek1TargetBooks(request.getWeek1TargetBooks() != null ? request.getWeek1TargetBooks() : 0);
        target.setWeek2TargetBooks(request.getWeek2TargetBooks() != null ? request.getWeek2TargetBooks() : 0);
        target.setWeek3TargetBooks(request.getWeek3TargetBooks() != null ? request.getWeek3TargetBooks() : 0);
        target.setWeek4TargetBooks(request.getWeek4TargetBooks() != null ? request.getWeek4TargetBooks() : 0);
        target.setWeek5TargetBooks(request.getWeek5TargetBooks() != null ? request.getWeek5TargetBooks() : 0);

        target.setTargetPagesSimple(request.getTargetPagesSimple() != null ? request.getTargetPagesSimple() : 0);
        target.setTargetPagesMedium(request.getTargetPagesMedium() != null ? request.getTargetPagesMedium() : 0);
        target.setTargetPagesComplex(request.getTargetPagesComplex() != null ? request.getTargetPagesComplex() : 0);
        target.setTargetPagesHeavyComplex(
                request.getTargetPagesHeavyComplex() != null ? request.getTargetPagesHeavyComplex() : 0);
        target.setTargetPagesTotal(request.getTargetPagesTotal() != null ? request.getTargetPagesTotal() : 0);
        target.setTargetPagesWeek1(request.getTargetPagesWeek1() != null ? request.getTargetPagesWeek1() : 0);
        target.setTargetPagesWeek2(request.getTargetPagesWeek2() != null ? request.getTargetPagesWeek2() : 0);
        target.setTargetPagesWeek3(request.getTargetPagesWeek3() != null ? request.getTargetPagesWeek3() : 0);
        target.setTargetPagesWeek4(request.getTargetPagesWeek4() != null ? request.getTargetPagesWeek4() : 0);

        target.setUpdatedAt(OffsetDateTime.now());
        target = targetRepository.save(target);

        log.info("Saved target details for project {} and period {}/{}", project.getName(), target.getMonth(),
                target.getYear());

        // Return updated stats
        List<ProjectTargetResponse> updatedList = getTargetsReport(target.getYear(), target.getMonth());
        UUID targetProjectId = target.getProject().getId();
        return updatedList.stream()
                .filter(r -> r.getProjectId().equals(targetProjectId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Could not retrieve saved target stats"));
    }

    @Transactional(readOnly = true)
    public ProjectTargetDetailResponse getProjectTargetDetail(UUID projectId, int year, int month) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        // 1. Target config
        ProjectTarget target = targetRepository.findByProjectIdAndYearAndMonth(projectId, year, month)
                .orElse(null);

        // 2. Workflow processes (kept in DTO for compatibility, not rendered in UI)
        List<String> processes = taskRepository.findProcessNamesByProjectId(projectId);

        // 3. Determine billing cycle range
        LocalDate[] range = getBillingCycleRange(projectId, year, month, target);
        LocalDate cycleStart = range[0];
        LocalDate cycleEnd = range[1];

        // 4. Fetch UPLOADED jobs whose startMonth AND endMonth are within the billing
        // cycle
        // (production commenced date and production end date both within billing
        // period)
        List<Job> registryJobs = jobRepository.findUploadedJobsByProductionDatesInRange(
                projectId, cycleStart, cycleEnd);

        // 5. Also fetch all jobs in the billing period for worked-employee tracking
        List<Job> allProjectJobs = jobRepository.findActiveOrCompletedJobsByProjectInDateRange(
                projectId, cycleStart, cycleEnd);

        // Build job→taskTitle lookup map
        List<Object[]> jobTaskRows = taskRepository.findJobIdToTaskTitleByProjectId(projectId);
        Map<UUID, String> jobTaskNameMap = new HashMap<>();
        for (Object[] row : jobTaskRows) {
            if (row[0] != null && row[1] != null) {
                jobTaskNameMap.put((UUID) row[0], (String) row[1]);
            }
        }

        final LocalDate finalCycleStart = cycleStart;
        final LocalDate finalCycleEnd = cycleEnd;

        // 7. Filter registryJobs according to target rules:
        List<Job> qualifiedRegistryJobs = registryJobs.stream()
                .filter(j -> {
                    String fileStatusStr = j.getFileStatus() != null ? j.getFileStatus().trim().toLowerCase() : "";
                    boolean isUploaded = fileStatusStr.equals("uploaded");
                    if (!isUploaded) return false;

                    LocalDate effectiveEndDate = j.getEndDate() != null ? j.getEndDate() : j.getEndMonth();
                    LocalDate effectiveUploadDate = j.getUploadDate() != null ? j.getUploadDate() : effectiveEndDate;

                    return effectiveUploadDate != null
                            && !effectiveUploadDate.isBefore(finalCycleStart)
                            && !effectiveUploadDate.isAfter(finalCycleEnd);
                })
                .collect(Collectors.toList());

        // 7. Compute page output by complexity and weekly actuals from qualifiedRegistryJobs
        int pagesSimple = 0, pagesMedium = 0, pagesComplex = 0, pagesHeavyComplex = 0, pagesTotal = 0;
        int pagesW1 = 0, pagesW2 = 0, pagesW3 = 0, pagesW4 = 0, pagesW5 = 0;

        for (Job job : qualifiedRegistryJobs) {
            int pages = job.getPageCount() != null ? job.getPageCount() : 0;
            pagesTotal += pages;

            String compType = job.getComplexity() != null ? job.getComplexity().trim().toLowerCase() : "";
            if (compType.contains("simple")) {
                pagesSimple += pages;
            } else if (compType.contains("heavy") && compType.contains("complex")) {
                pagesHeavyComplex += pages;
            } else if (compType.contains("medium")) {
                pagesMedium += pages;
            } else if (compType.contains("complex")) {
                pagesComplex += pages;
            }

            // Assign to week based on upload date
            LocalDate effectiveEndDate = job.getEndDate() != null ? job.getEndDate() : job.getEndMonth();
            LocalDate effectiveUploadDate = job.getUploadDate() != null ? job.getUploadDate() : effectiveEndDate;
            if (effectiveUploadDate != null) {
                long uploadDays = java.time.temporal.ChronoUnit.DAYS.between(finalCycleStart, effectiveUploadDate);
                if (uploadDays >= 0) {
                    if (uploadDays < 7) {
                        pagesW1 += pages;
                    } else if (uploadDays >= 7 && uploadDays < 14) {
                        pagesW2 += pages;
                    } else if (uploadDays >= 14 && uploadDays < 21) {
                        pagesW3 += pages;
                    } else if (uploadDays >= 21 && uploadDays < 28) {
                        pagesW4 += pages;
                    } else {
                        // Week 5 (ensure it is within cycleEnd)
                        if (!effectiveUploadDate.isAfter(finalCycleEnd)) {
                            pagesW5 += pages;
                        }
                    }
                }
            }
        }

        // 8. Build JobDetailResponse list from registry jobs
        List<ProjectTargetDetailResponse.JobDetailResponse> jobResponses = qualifiedRegistryJobs.stream()
                .map(j -> {
                    LocalDate effectiveEndDate = j.getEndDate() != null ? j.getEndDate() : j.getEndMonth();
                    LocalDate effectiveStartDate = j.getStartMonth() != null ? j.getStartMonth() : (j.getReceiveDate() != null ? j.getReceiveDate() : effectiveEndDate);
                    int nDays = (effectiveStartDate != null && effectiveEndDate != null)
                            ? (int) java.time.temporal.ChronoUnit.DAYS.between(effectiveStartDate, effectiveEndDate) + 1
                            : 0;
                    return ProjectTargetDetailResponse.JobDetailResponse.builder()
                            .id(j.getId())
                            .jobIdCode(j.getJobIdCode())
                            .xmlIsbn(j.getXmlIsbn())
                            .batch(j.getBatch())
                            .titleName(j.getTitleName())
                            .pageCount(j.getPageCount())
                            .complexity(j.getComplexity())
                            .status(j.getStatus())
                            .fileStatus(j.getFileStatus())
                            .processStatus(j.getProcessStatus())
                            .qcStatus(j.getQcStatus())
                            .receiveDate(j.getReceiveDate())
                            .startMonth(effectiveStartDate)
                            .endMonth(j.getEndMonth())
                            .endDate(j.getEndDate())
                            .uploadDate(j.getUploadDate())
                            .noOfDays(nDays)
                            .taskName(jobTaskNameMap.get(j.getId()))
                            .employeeNames(j.getEmployeeNames())
                            .qcEmployeeNames(j.getQcEmployeeNames())
                            .build();
                })
                .sorted(Comparator.comparing(
                        r -> r.getStartMonth() != null ? r.getStartMonth() : LocalDate.MIN))
                .collect(Collectors.toList());

        // 9. Worked employees (kept for DTO compatibility)
        Map<String, Integer> employeeBookCounts = new HashMap<>();
        for (Job j : allProjectJobs) {
            if (j.getEmployeeNames() != null && !j.getEmployeeNames().isBlank()) {
                for (String name : j.getEmployeeNames().split(",")) {
                    String trimmed = name.trim();
                    if (!trimmed.isEmpty()) {
                        employeeBookCounts.put(trimmed, employeeBookCounts.getOrDefault(trimmed, 0) + 1);
                    }
                }
            }
        }
        List<ProjectTargetDetailResponse.WorkedEmployeeResponse> workedEmployees = employeeBookCounts.entrySet()
                .stream()
                .map(entry -> ProjectTargetDetailResponse.WorkedEmployeeResponse.builder()
                        .employeeName(entry.getKey())
                        .bookCount(entry.getValue())
                        .build())
                .sorted(Comparator.comparing(ProjectTargetDetailResponse.WorkedEmployeeResponse::getBookCount)
                        .reversed())
                .collect(Collectors.toList());

        // 10. Build response
        ProjectTargetDetailResponse.ProjectTargetDetailResponseBuilder builder = ProjectTargetDetailResponse.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .description(project.getDescription())
                .clientName(project.getClient() != null ? project.getClient().getCompanyName() : "N/A")
                .billingType(project.getType())
                .complexityLevel(project.getComplexityLevel())
                .isProjectActive(project.getIsActive())
                .workflowName(project.getWorkflow() != null ? project.getWorkflow().getName() : "N/A")
                .workflowProcesses(processes)
                .actualPagesSimple(pagesSimple)
                .actualPagesMedium(pagesMedium)
                .actualPagesComplex(pagesComplex)
                .actualPagesHeavyComplex(pagesHeavyComplex)
                .actualPagesTotal(pagesTotal)
                .actualPagesWeek1(pagesW1)
                .actualPagesWeek2(pagesW2)
                .actualPagesWeek3(pagesW3)
                .actualPagesWeek4(pagesW4)
                .actualPagesWeek5(pagesW5)
                .workedEmployees(workedEmployees)
                .jobs(jobResponses);

        if (target != null) {
            builder.targetId(target.getId())
                    .year(target.getYear())
                    .month(target.getMonth())
                    .billingCycleStartDate(target.getBillingCycleStartDate())
                    .billingCycleEndDate(target.getBillingCycleEndDate())
                    .monthlyTargetBooks(target.getMonthlyTargetBooks())
                    .weeklyTargetBooks(target.getWeeklyTargetBooks())
                    .week1TargetBooks(target.getWeek1TargetBooks())
                    .week2TargetBooks(target.getWeek2TargetBooks())
                    .week3TargetBooks(target.getWeek3TargetBooks())
                    .week4TargetBooks(target.getWeek4TargetBooks())
                    .week5TargetBooks(target.getWeek5TargetBooks())
                    .targetPagesSimple(target.getTargetPagesSimple())
                    .targetPagesMedium(target.getTargetPagesMedium())
                    .targetPagesComplex(target.getTargetPagesComplex())
                    .targetPagesHeavyComplex(target.getTargetPagesHeavyComplex())
                    .targetPagesTotal(target.getTargetPagesTotal())
                    .targetPagesWeek1(target.getTargetPagesWeek1())
                    .targetPagesWeek2(target.getTargetPagesWeek2())
                    .targetPagesWeek3(target.getTargetPagesWeek3())
                    .targetPagesWeek4(target.getTargetPagesWeek4());
        } else {
            builder.billingCycleStartDate(cycleStart)
                    .billingCycleEndDate(cycleEnd)
                    .monthlyTargetBooks(0).weeklyTargetBooks(0)
                    .week1TargetBooks(0).week2TargetBooks(0)
                    .week3TargetBooks(0).week4TargetBooks(0)
                    .week5TargetBooks(0)
                    .targetPagesSimple(0).targetPagesMedium(0)
                    .targetPagesComplex(0).targetPagesHeavyComplex(0)
                    .targetPagesTotal(0)
                    .targetPagesWeek1(0).targetPagesWeek2(0)
                    .targetPagesWeek3(0).targetPagesWeek4(0);
        }

        return builder.build();
    }

    @Transactional
    public List<ProjectTargetResponse> saveBulkTargets(BulkProjectTargetRequest request) {
        log.info("Bulk saving targets for client {} and period {}/{}", request.getClientId(), request.getMonth(),
                request.getYear());

        for (ProjectTargetItemRequest item : request.getTargets()) {
            Project project = projectRepository.findById(item.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project", "id", item.getProjectId()));

            // Find existing target for project, year, month
            ProjectTarget target = targetRepository.findByProjectIdAndYearAndMonth(
                    project.getId(), request.getYear(), request.getMonth())
                    .orElse(new ProjectTarget());

            target.setProject(project);
            target.setYear(request.getYear());
            target.setMonth(request.getMonth());
            target.setBillingCycleStartDate(request.getBillingCycleStartDate());
            target.setBillingCycleEndDate(request.getBillingCycleEndDate());

            // Map page targets
            target.setTargetPagesSimple(item.getTargetPagesSimple() != null ? item.getTargetPagesSimple() : 0);
            target.setTargetPagesMedium(item.getTargetPagesMedium() != null ? item.getTargetPagesMedium() : 0);
            target.setTargetPagesComplex(item.getTargetPagesComplex() != null ? item.getTargetPagesComplex() : 0);
            target.setTargetPagesHeavyComplex(
                    item.getTargetPagesHeavyComplex() != null ? item.getTargetPagesHeavyComplex() : 0);
            target.setTargetPagesTotal(item.getTargetPagesTotal() != null ? item.getTargetPagesTotal() : 0);
            target.setTargetPagesWeek1(item.getTargetPagesWeek1() != null ? item.getTargetPagesWeek1() : 0);
            target.setTargetPagesWeek2(item.getTargetPagesWeek2() != null ? item.getTargetPagesWeek2() : 0);
            target.setTargetPagesWeek3(item.getTargetPagesWeek3() != null ? item.getTargetPagesWeek3() : 0);
            target.setTargetPagesWeek4(item.getTargetPagesWeek4() != null ? item.getTargetPagesWeek4() : 0);

            // Map book targets
            target.setMonthlyTargetBooks(item.getMonthlyTargetBooks() != null ? item.getMonthlyTargetBooks() : 0);
            target.setWeeklyTargetBooks(item.getWeeklyTargetBooks() != null ? item.getWeeklyTargetBooks() : 0);
            target.setWeek1TargetBooks(item.getWeek1TargetBooks() != null ? item.getWeek1TargetBooks() : 0);
            target.setWeek2TargetBooks(item.getWeek2TargetBooks() != null ? item.getWeek2TargetBooks() : 0);
            target.setWeek3TargetBooks(item.getWeek3TargetBooks() != null ? item.getWeek3TargetBooks() : 0);
            target.setWeek4TargetBooks(item.getWeek4TargetBooks() != null ? item.getWeek4TargetBooks() : 0);
            target.setWeek5TargetBooks(item.getWeek5TargetBooks() != null ? item.getWeek5TargetBooks() : 0);

            target.setUpdatedAt(OffsetDateTime.now());
            targetRepository.save(target);
        }

        // Return updated targets report
        return getTargetsReport(request.getYear(), request.getMonth());
    }
}
