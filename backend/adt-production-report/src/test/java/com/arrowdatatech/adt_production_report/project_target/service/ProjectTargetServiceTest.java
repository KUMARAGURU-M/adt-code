package com.arrowdatatech.adt_production_report.project_target.service;

import com.arrowdatatech.adt_production_report.job.entity.Job;
import com.arrowdatatech.adt_production_report.job.repository.JobRepository;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.repository.ProjectRepository;
import com.arrowdatatech.adt_production_report.project.repository.UserProjectAssignmentRepository;
import com.arrowdatatech.adt_production_report.project_target.repository.ProjectTargetRepository;
import com.arrowdatatech.adt_production_report.task.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectTargetServiceTest {
    @Mock ProjectTargetRepository targetRepository;
    @Mock ProjectRepository projectRepository;
    @Mock JobRepository jobRepository;
    @Mock UserProjectAssignmentRepository assignmentRepository;
    @Mock TaskRepository taskRepository;
    @InjectMocks ProjectTargetService service;

    @Test
    void allDateBacklogRemainsVisibleWithoutInflatingCompletedOutput() {
        UUID projectId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate end = LocalDate.of(2026, 9, 30);
        Job uploaded = job(" UPLOADED ", 20, start);
        Job dashInsideCycle = job("-", 30, start);
        Job holdBeforeCycle = job("HOLD", 40, start.minusMonths(1));
        Job queryAfterCycle = job("QUERY", 50, end.plusDays(1));
        Job blankWithoutDate = job(null, null, null);
        when(jobRepository.findUploadedJobsByProductionDatesInRange(projectId, start, end))
                .thenReturn(List.of(uploaded));
        when(jobRepository.findIncompleteJobsByProjectId(projectId))
                .thenReturn(List.of(dashInsideCycle, holdBeforeCycle, queryAfterCycle, blankWithoutDate));

        var result = service.getProjectTargetDetail(projectId, 2026, 9);

        assertEquals(4, result.getActualIncompleteBooks());
        assertEquals(120, result.getActualIncompletePages());
        assertEquals(20, result.getActualPagesTotal());
        assertEquals(20, result.getActualPagesSimple());
        assertEquals(20, result.getActualPagesWeek1());
        assertEquals(5, result.getJobs().size());
    }

    private Job job(String status, Integer pages, LocalDate date) {
        return Job.builder().fileStatus(status).pageCount(pages)
                .complexity("Simple").uploadDate(date).build();
    }
}
