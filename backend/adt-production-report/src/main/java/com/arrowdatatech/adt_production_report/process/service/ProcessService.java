package com.arrowdatatech.adt_production_report.process.service;

import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.process.dto.CreateProcessRequest;
import com.arrowdatatech.adt_production_report.process.dto.ProcessResponse;
import com.arrowdatatech.adt_production_report.process.entity.Process;
import com.arrowdatatech.adt_production_report.process.repository.ProcessRepository;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessService {

    private final ProcessRepository processRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    // ─────────────────────────────────────────────
    // GET ALL ACTIVE PROCESSES
    // Used by: WorkWise dropdown, Task creation
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProcessResponse> getAllActiveProcesses() {
        return processRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET ALL PROCESSES (including inactive)
    // Used by: Process Management admin page
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProcessResponse> getAllProcesses() {
        return processRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getName().compareTo(b.getName()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET PROCESS BY ID
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ProcessResponse getProcessById(UUID id) {
        Process process = processRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Process", "id", id));
        return toResponse(process);
    }

    // ─────────────────────────────────────────────
    // CREATE PROCESS
    // ─────────────────────────────────────────────
    @Transactional
    public ProcessResponse createProcess(CreateProcessRequest request) {

        // Validate unique name
        if (processRepository.existsByName(request.getName().trim())) {
            throw new BadRequestException(
                    "Process '" + request.getName() + "' already exists.");
        }

        Process process = Process.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null
                        ? request.getIsActive() : true)
//                .updatedAt(OffsetDateTime.now())
                .build();

        process = processRepository.save(process);

        logAction("CREATE", process);
        log.info("Process created: {}", process.getName());

        return toResponse(process);
    }

    // ─────────────────────────────────────────────
    // UPDATE PROCESS
    // ─────────────────────────────────────────────
    @Transactional
    public ProcessResponse updateProcess(UUID id,
                                         CreateProcessRequest request) {

        Process process = processRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Process", "id", id));

        // Check name uniqueness if name changed
        if (request.getName() != null
                && !process.getName().equals(request.getName().trim())
                && processRepository.existsByName(request.getName().trim())) {
            throw new BadRequestException(
                    "Process '" + request.getName() + "' already exists.");
        }

        if (request.getName() != null) {
            process.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            process.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            process.setIsActive(request.getIsActive());
        }

        process.setUpdatedAt(OffsetDateTime.now());
        process = processRepository.save(process);

        logAction("UPDATE", process);
        log.info("Process updated: {}", process.getName());

        return toResponse(process);
    }

    // ─────────────────────────────────────────────
    // DELETE PROCESS
    // Hard delete only if not used in any task
    // Otherwise deactivate (soft)
    // ─────────────────────────────────────────────
    @Transactional
    public void deleteProcess(UUID id) {
        Process process = processRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Process", "id", id));

        // Check if used in tasks - if so, just deactivate
        // (Task uses RESTRICT FK so we cannot hard delete)
        try {
            processRepository.deleteById(id);
            log.info("Process hard deleted: {}", process.getName());
        } catch (Exception e) {
            // Has FK references - deactivate instead
            process.setIsActive(false);
            process.setUpdatedAt(OffsetDateTime.now());
            processRepository.save(process);
            log.info("Process deactivated (has task references): {}",
                    process.getName());
        }

        logAction("DELETE", process);
    }

    // ─────────────────────────────────────────────
    // GET PROCESSES BY PROJECT
    // Used by: WorkWise process dropdown
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProcessResponse> getProcessesByProject(UUID projectId) {
        return processRepository.findByProjectId(projectId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // GET PROCESSES ASSIGNED TO USER
    // Used by: Employee WorkWise dropdown
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ProcessResponse> getProcessesForUser(UUID userId) {
        return processRepository.findByAssignedUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    private void logAction(String action, Process process) {
        try {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            userRepository.findByIdWithProfile(currentUserId)
                    .ifPresent(user -> activityLogService.log(
                            user, action, "process",
                            process.getId(), process.getName(), null));
        } catch (Exception e) {
            log.warn("Could not log activity: {}", e.getMessage());
        }
    }

    private ProcessResponse toResponse(Process process) {
        return ProcessResponse.builder()
                .id(process.getId())
                .name(process.getName())
                .description(process.getDescription())
                .isActive(process.getIsActive())
                .createdAt(process.getCreatedAt())
                .build();
    }
}