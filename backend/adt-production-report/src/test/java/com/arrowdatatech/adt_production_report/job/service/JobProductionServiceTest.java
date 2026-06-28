package com.arrowdatatech.adt_production_report.job.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.arrowdatatech.adt_production_report.job.dto.JobResponse;
import com.arrowdatatech.adt_production_report.job.dto.UpdateProductionRequest;
import com.arrowdatatech.adt_production_report.job.entity.Job;
import com.arrowdatatech.adt_production_report.job.repository.JobRepository;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.task.entity.Task;
import com.arrowdatatech.adt_production_report.task.entity.TaskEmployeeAssignment;
import com.arrowdatatech.adt_production_report.task.entity.TaskJobAssignment;
import com.arrowdatatech.adt_production_report.task.repository.TaskJobAssignmentRepository;
import com.arrowdatatech.adt_production_report.user.entity.EmployeeProfile;
import com.arrowdatatech.adt_production_report.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.*;

@ExtendWith(MockitoExtension.class)
class JobProductionServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private TaskJobAssignmentRepository taskJobAssignmentRepository;

    @InjectMocks
    private JobService jobService;

    private Job testJob;
    private Project testProject;
    private UUID jobId;

    @BeforeEach
    void setUp() {
        jobId = UUID.randomUUID();
        testProject = Project.builder()
                .name("Test Publisher")
                .build();
        testProject.setId(UUID.randomUUID());

        testJob = Job.builder()
                .jobIdCode("JOB001")
                .titleName("Test Book Title")
                .project(testProject)
                .processStatus("PENDING")
                .qcStatus("PENDING")
                .build();
        testJob.setId(jobId);
    }

    @Test
    void testSearchProductionJobs_withCalculatedFields() {
        // Mock repository search response
        Page<Job> jobPage = new PageImpl<>(List.of(testJob));
        when(jobRepository.searchProductionJobs(eq(testProject.getId()), any(), any(), any()))
                .thenReturn(jobPage);

        // Setup Task & Employee Assignments
        LocalDate taskDate1 = LocalDate.of(2026, 6, 1);
        LocalDate taskDate2 = LocalDate.of(2026, 6, 10);

        Task task1 = Task.builder()
                .assignedDate(taskDate1)
                .build();
        Task task2 = Task.builder()
                .assignedDate(taskDate2)
                .build();

        EmployeeProfile profile1 = EmployeeProfile.builder().fullName("Alice Smith").build();
        User user1 = User.builder().userCode("EMP001").employeeProfile(profile1).build();
        TaskEmployeeAssignment tea1 = TaskEmployeeAssignment.builder().user(user1).build();
        task1.setEmployeeAssignments(Set.of(tea1));

        EmployeeProfile profile2 = EmployeeProfile.builder().fullName("Bob Jones").build();
        User user2 = User.builder().userCode("EMP002").employeeProfile(profile2).build();
        TaskEmployeeAssignment tea2 = TaskEmployeeAssignment.builder().user(user2).build();
        task2.setEmployeeAssignments(Set.of(tea2));

        TaskJobAssignment tja1 = TaskJobAssignment.builder()
                .job(testJob)
                .task(task1)
                .build();
        TaskJobAssignment tja2 = TaskJobAssignment.builder()
                .job(testJob)
                .task(task2)
                .build();

        when(taskJobAssignmentRepository.findAssignmentsByJobIds(List.of(jobId)))
                .thenReturn(List.of(tja1, tja2));

        // Execute service method
        Page<JobResponse> result = jobService.searchProductionJobs(
                testProject.getId(), null, null, 0, 10);

        // Assertions
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        JobResponse response = result.getContent().get(0);
        assertEquals("JOB001", response.getJobIdCode());
        assertEquals("PENDING", response.getProcessStatus());

        // Verify employees collected correctly
        assertNotNull(response.getEmployees());
        assertEquals(2, response.getEmployees().size());
        assertTrue(response.getEmployees().contains("Alice Smith"));
        assertTrue(response.getEmployees().contains("Bob Jones"));

        // Verify earliest task date is mapped as productionStartDate
        assertEquals(taskDate1, response.getProductionStartDate());
    }

    @Test
    void testUpdateProductionStatus() {
        when(jobRepository.findById(jobId)).thenReturn(Optional.of(testJob));
        when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateProductionRequest request = new UpdateProductionRequest();
        request.setProcessStatus("FINISH");
        request.setQcStatus("WIP");
        LocalDate customEndDate = LocalDate.of(2026, 6, 15);
        request.setEndDate(customEndDate);

        // Execute service method
        JobResponse response = jobService.updateProductionStatus(jobId, request);

        // Assertions
        assertNotNull(response);
        assertEquals("FINISH", response.getProcessStatus());
        assertEquals("WIP", response.getQcStatus());
        assertEquals(customEndDate, response.getEndDate());

        verify(jobRepository).save(testJob);
    }
}
