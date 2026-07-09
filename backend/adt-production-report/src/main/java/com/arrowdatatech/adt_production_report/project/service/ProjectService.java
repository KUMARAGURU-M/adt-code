package com.arrowdatatech.adt_production_report.project.service;

import com.arrowdatatech.adt_production_report.client.entity.Client;
import com.arrowdatatech.adt_production_report.client.repository.ClientRepository;
import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.project.dto.CreateProjectRequest;
import com.arrowdatatech.adt_production_report.project.dto.ProjectResponse;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.entity.Workflow;
import com.arrowdatatech.adt_production_report.project.repository.ProjectRepository;
import com.arrowdatatech.adt_production_report.project.repository.WorkflowRepository;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final WorkflowRepository workflowRepository;

    // ─────────────────────────────────────────────
    // GET ALL ACTIVE PROJECTS
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET ALL PROJECTS (including inactive)
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjectsIncludingInactive() {
        return projectRepository.findAll()
                .stream()
                .filter(p -> p.getDeletedAt() == null)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET PROJECT BY ID
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Project", "id", id));
        return toResponse(project);
    }

    // ─────────────────────────────────────────────
    // CREATE PROJECT
    // ─────────────────────────────────────────────
    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request) {

        String trimmedName = request.getName() != null ? request.getName().trim() : "";
        // Validate unique name per client
        boolean nameExists = request.getClientId() != null
                ? projectRepository.existsByNameAndClientId(trimmedName, request.getClientId())
                : projectRepository.existsByNameAndClientIdIsNull(trimmedName);
        if (nameExists) {
            throw new BadRequestException(
                    "Project '" + trimmedName + "' already exists for this client.");
        }

        // Validate billing type
        validateBillingType(request.getType());

        // Validate complexity
        validateComplexity(request.getComplexityLevel());

        // Find client if provided
        Client client = null;
        if (request.getClientId() != null) {
            client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Client", "id", request.getClientId()));
        }

        Workflow workflow = null;
        if (request.getWorkflowId() != null) {
            workflow = workflowRepository.findById(request.getWorkflowId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Workflow", "id", request.getWorkflowId()));
        }

        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .client(client)
                .workflow(workflow)
                .type(request.getType())
                .complexityLevel(request.getComplexityLevel())
                .ratePerPage(request.getRatePerPage() != null
                        ? request.getRatePerPage() : BigDecimal.ZERO)
                .hourlyRate(request.getHourlyRate())
                .isActive(request.getIsActive() != null
                        ? request.getIsActive() : true)
                .build();

        project = projectRepository.save(project);

        // Log activity
        logAction("CREATE", project);

        log.info("Project created: {}", project.getName());
        return toResponse(project);
    }

    // ─────────────────────────────────────────────
    // UPDATE PROJECT
    // ─────────────────────────────────────────────
    @Transactional
    public ProjectResponse updateProject(UUID id,
                                         CreateProjectRequest request) {

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Project", "id", id));

        String trimmedName = request.getName() != null ? request.getName().trim() : "";
        // Check name uniqueness among OTHER projects for this client
        boolean nameExists = request.getClientId() != null
                ? projectRepository.existsByNameAndClientIdAndIdNot(trimmedName, request.getClientId(), id)
                : projectRepository.existsByNameAndClientIdIsNullAndIdNot(trimmedName, id);
        if (nameExists) {
            throw new BadRequestException(
                    "Project '" + trimmedName + "' already exists for this client.");
        }

        // Validate billing type
        if (request.getType() != null) {
            validateBillingType(request.getType());
            project.setType(request.getType());
        }

        // Validate complexity
        if (request.getComplexityLevel() != null) {
            validateComplexity(request.getComplexityLevel());
            project.setComplexityLevel(request.getComplexityLevel());
        }

        // Update client
        if (request.getClientId() != null) {
            Client client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Client", "id", request.getClientId()));
            project.setClient(client);
        } else {
            project.setClient(null);
        }

        // Update workflow
        if (request.getWorkflowId() != null) {
            Workflow workflow = workflowRepository.findById(request.getWorkflowId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Workflow", "id", request.getWorkflowId()));
            project.setWorkflow(workflow);
        } else {
            project.setWorkflow(null);
        }

        if (request.getName() != null) {
            project.setName(request.getName().trim());
        }
        project.setDescription(request.getDescription());
        if (request.getRatePerPage() != null) {
            project.setRatePerPage(request.getRatePerPage());
        }
        project.setHourlyRate(request.getHourlyRate());
        if (request.getIsActive() != null) {
            project.setIsActive(request.getIsActive());
        }

//        project.setUpdatedAt(OffsetDateTime.now());
        project = projectRepository.save(project);

        logAction("UPDATE", project);

        log.info("Project updated: {}", project.getName());
        return toResponse(project);
    }

    // ─────────────────────────────────────────────
    // UPDATE BILLING TYPE (inline table change)
    // ─────────────────────────────────────────────
    @Transactional
    public ProjectResponse updateBillingType(UUID id, String billingType) {
        validateBillingType(billingType);

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Project", "id", id));

        project.setType(billingType);
//        project.setUpdatedAt(OffsetDateTime.now());
        projectRepository.save(project);

        return toResponse(project);
    }

    // ─────────────────────────────────────────────
    // DELETE PROJECT (soft delete)
    // ─────────────────────────────────────────────
    @Transactional
    public void deleteProject(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Project", "id", id));

        project.setDeletedAt(OffsetDateTime.now());
        project.setIsActive(false);
//        project.setUpdatedAt(OffsetDateTime.now());
        projectRepository.save(project);

        logAction("DELETE", project);

        log.info("Project soft deleted: {}", project.getName());
    }

    // ─────────────────────────────────────────────
    // GET PROJECTS BY CLIENT
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByClient(UUID clientId) {
        return projectRepository.findByClientId(clientId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private void validateBillingType(String type) {
        if (type == null) return;
        List<String> valid = List.of("Per Page", "Hourly",
                "Per Article", "Per KB");
        if (!valid.contains(type)) {
            throw new BadRequestException(
                    "Invalid billing type: " + type +
                            ". Valid types: Per Page, Hourly, Per Article, Per KB");
        }
    }

    private void validateComplexity(String complexity) {
        if (complexity == null) return;
        List<String> valid = List.of("Simple", "Medium",
                "Complex", "Heavy Complex");
        if (!valid.contains(complexity)) {
            throw new BadRequestException(
                    "Invalid complexity level: " + complexity);
        }
    }

    private void logAction(String action, Project project) {
        try {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            userRepository.findByIdWithProfile(currentUserId)
                    .ifPresent(user -> activityLogService.log(
                            user, action, "project",
                            project.getId(), project.getName(), null));
        } catch (Exception e) {
            log.warn("Could not log activity: {}", e.getMessage());
        }
    }
    private ProjectResponse toResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .clientId(project.getClient() != null
                        ? project.getClient().getId() : null)
                .clientName(project.getClient() != null
                        ? project.getClient().getCompanyName() : null)
                .workflowId(project.getWorkflow() != null
                        ? project.getWorkflow().getId() : null)
                .workflowName(project.getWorkflow() != null
                        ? project.getWorkflow().getName() : null)
                .type(project.getType())
                .complexityLevel(project.getComplexityLevel())
                .ratePerPage(project.getRatePerPage())
                .hourlyRate(project.getHourlyRate())
                .isActive(project.getIsActive())
                .createdAt(project.getCreatedAt())
                .build();
    }
}