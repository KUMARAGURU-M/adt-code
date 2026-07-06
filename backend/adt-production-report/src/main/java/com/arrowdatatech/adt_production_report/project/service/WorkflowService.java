package com.arrowdatatech.adt_production_report.project.service;

import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.project.dto.WorkflowRequest;
import com.arrowdatatech.adt_production_report.project.dto.WorkflowResponse;
import com.arrowdatatech.adt_production_report.project.entity.Workflow;
import com.arrowdatatech.adt_production_report.project.repository.WorkflowRepository;
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
public class WorkflowService {

    private final WorkflowRepository workflowRepository;

    @Transactional(readOnly = true)
    public List<WorkflowResponse> getAllWorkflows() {
        return workflowRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkflowResponse getWorkflowById(UUID id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", id));
        return toResponse(workflow);
    }

    @Transactional
    public WorkflowResponse createWorkflow(WorkflowRequest request) {
        String trimmedName = request.getName().trim();
        if (workflowRepository.existsByName(trimmedName)) {
            throw new BadRequestException("Workflow '" + trimmedName + "' already exists.");
        }

        Workflow workflow = Workflow.builder()
                .name(trimmedName)
                .build();

        workflow = workflowRepository.save(workflow);
        log.info("Workflow created: {}", workflow.getName());
        return toResponse(workflow);
    }

    @Transactional
    public WorkflowResponse updateWorkflow(UUID id, WorkflowRequest request) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", id));

        String trimmedName = request.getName().trim();
        if (!workflow.getName().equalsIgnoreCase(trimmedName) && workflowRepository.existsByName(trimmedName)) {
            throw new BadRequestException("Workflow '" + trimmedName + "' already exists.");
        }

        workflow.setName(trimmedName);
        workflow = workflowRepository.save(workflow);
        log.info("Workflow updated: {}", workflow.getName());
        return toResponse(workflow);
    }

    @Transactional
    public void deleteWorkflow(UUID id) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", id));

        workflow.setDeletedAt(OffsetDateTime.now());
        workflowRepository.save(workflow);
        log.info("Workflow soft deleted: {}", workflow.getName());
    }

    private WorkflowResponse toResponse(Workflow workflow) {
        return WorkflowResponse.builder()
                .id(workflow.getId())
                .name(workflow.getName())
                .createdAt(workflow.getCreatedAt())
                .build();
    }
}
