package com.arrowdatatech.adt_production_report.careerapp.service;

import com.arrowdatatech.adt_production_report.careerapp.dto.CareerApplicationResponse;
import com.arrowdatatech.adt_production_report.careerapp.entity.CareerApplication;
import com.arrowdatatech.adt_production_report.careerapp.repository.CareerApplicationRepository;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import com.arrowdatatech.adt_production_report.media.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CareerApplicationService {

    private final CareerApplicationRepository repo;
    private final MediaService mediaService;

    @Transactional
    public CareerApplicationResponse submit(
            String jobTitle, String department, String name, String email,
            String phone, String portfolio, String coverNote, MultipartFile resume) {

        UUID mediaFileId = null;
        String resumeFileName = null;

        if (resume != null && !resume.isEmpty()) {
            MediaFile mediaFile = mediaService.uploadFile(resume, "resume", null);
            mediaFileId = mediaFile.getId();
            resumeFileName = mediaFile.getOriginalName();
        }

        CareerApplication entity = CareerApplication.builder()
                .jobTitle(jobTitle)
                .department(department)
                .name(name)
                .email(email)
                .phone(phone)
                .portfolio(portfolio)
                .coverNote(coverNote)
                .resumeFileName(resumeFileName)
                .resumeMediaFileId(mediaFileId)
                .status("NEW")
                .build();

        return CareerApplicationResponse.from(repo.save(entity));
    }

    @Transactional(readOnly = true)
    public List<CareerApplicationResponse> getAll(String status) {
        List<CareerApplication> list = (status != null && !status.isBlank())
                ? repo.findByStatusOrderByCreatedAtDesc(status.toUpperCase())
                : repo.findAllByOrderByCreatedAtDesc();
        return list.stream().map(CareerApplicationResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public CareerApplicationResponse updateStatus(UUID id, String status) {
        CareerApplication entity = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CareerApplication", "id", id));
        entity.setStatus(status.toUpperCase());
        return CareerApplicationResponse.from(repo.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("CareerApplication", "id", id);
        }
        repo.deleteById(id);
    }
}
