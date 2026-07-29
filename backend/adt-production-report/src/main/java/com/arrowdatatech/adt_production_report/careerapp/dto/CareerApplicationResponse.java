package com.arrowdatatech.adt_production_report.careerapp.dto;

import com.arrowdatatech.adt_production_report.careerapp.entity.CareerApplication;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class CareerApplicationResponse {
    private UUID id;
    private String jobTitle;
    private String department;
    private String name;
    private String email;
    private String phone;
    private String portfolio;
    private String coverNote;
    private String resumeFileName;
    private String resumeUrl;
    private String status;
    private OffsetDateTime createdAt;

    public static CareerApplicationResponse from(CareerApplication e) {
        CareerApplicationResponse r = new CareerApplicationResponse();
        r.setId(e.getId());
        r.setJobTitle(e.getJobTitle());
        r.setDepartment(e.getDepartment());
        r.setName(e.getName());
        r.setEmail(e.getEmail());
        r.setPhone(e.getPhone());
        r.setPortfolio(e.getPortfolio());
        r.setCoverNote(e.getCoverNote());
        r.setResumeFileName(e.getResumeFileName());
        r.setStatus(e.getStatus());
        r.setCreatedAt(e.getCreatedAt());
        if (e.getResumeMediaFileId() != null) {
            r.setResumeUrl("/media/" + e.getResumeMediaFileId());
        }
        return r;
    }
}
