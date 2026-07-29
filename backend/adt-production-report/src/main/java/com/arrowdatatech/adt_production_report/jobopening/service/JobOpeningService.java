package com.arrowdatatech.adt_production_report.jobopening.service;

import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.jobopening.dto.JobOpeningRequest;
import com.arrowdatatech.adt_production_report.jobopening.dto.JobOpeningResponse;
import com.arrowdatatech.adt_production_report.jobopening.entity.JobOpening;
import com.arrowdatatech.adt_production_report.jobopening.repository.JobOpeningRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobOpeningService {

    private final JobOpeningRepository repo;

    @Transactional(readOnly = true)
    public List<JobOpeningResponse> getActive() {
        return repo.findByActiveTrueOrderByCreatedAtDesc()
                .stream().map(JobOpeningResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JobOpeningResponse> getAll() {
        return repo.findAllByOrderByCreatedAtDesc()
                .stream().map(JobOpeningResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public JobOpeningResponse create(JobOpeningRequest req) {
        JobOpening entity = JobOpening.builder()
                .title(req.getTitle())
                .department(req.getDepartment())
                .location(req.getLocation())
                .jobType(req.getJobType() != null ? req.getJobType() : "Full-Time")
                .experience(req.getExperience())
                .description(req.getDescription())
                .tags(req.getTags())
                .active(true)
                .build();
        return JobOpeningResponse.from(repo.save(entity));
    }

    @Transactional
    public JobOpeningResponse update(UUID id, JobOpeningRequest req) {
        JobOpening entity = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JobOpening", "id", id));
        entity.setTitle(req.getTitle());
        entity.setDepartment(req.getDepartment());
        entity.setLocation(req.getLocation());
        entity.setJobType(req.getJobType() != null ? req.getJobType() : entity.getJobType());
        entity.setExperience(req.getExperience());
        entity.setDescription(req.getDescription());
        entity.setTags(req.getTags());
        return JobOpeningResponse.from(repo.save(entity));
    }

    @Transactional
    public JobOpeningResponse toggleActive(UUID id) {
        JobOpening entity = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JobOpening", "id", id));
        entity.setActive(!entity.isActive());
        return JobOpeningResponse.from(repo.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("JobOpening", "id", id);
        }
        repo.deleteById(id);
    }
}
