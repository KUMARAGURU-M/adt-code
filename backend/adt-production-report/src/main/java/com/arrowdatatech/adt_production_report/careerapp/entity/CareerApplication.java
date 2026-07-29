package com.arrowdatatech.adt_production_report.careerapp.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "career_applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CareerApplication extends BaseEntity {

    @Column(name = "job_title", nullable = false, length = 300)
    private String jobTitle;

    @Column(name = "department", length = 200)
    private String department;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "email", nullable = false, length = 300)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "portfolio", length = 500)
    private String portfolio;

    @Column(name = "cover_note", columnDefinition = "TEXT")
    private String coverNote;

    @Column(name = "resume_file_name", length = 400)
    private String resumeFileName;

    @Column(name = "resume_media_file_id")
    private UUID resumeMediaFileId;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "NEW";
}
