package com.arrowdatatech.adt_production_report.user.entity;

import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "employee_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // OneToOne: one profile -> one user
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_emp_profile_user"))
    private User user;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "timezone", nullable = false, length = 60)
    @Builder.Default
    private String timezone = "Asia/Kolkata";

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    // ManyToOne: profile -> media file (profile photo)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_photo_id",
            foreignKey = @ForeignKey(name = "fk_emp_profile_photo"))
    private MediaFile profilePhoto;

    // ManyToOne: profile -> media file (KYC document)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_document_id",
            foreignKey = @ForeignKey(name = "fk_emp_profile_kyc"))
    private MediaFile kycDocument;

    @Column(name = "is_top_performer", nullable = false)
    @Builder.Default
    private Boolean isTopPerformer = false;

    @Column(name = "show_calendar_stats", nullable = false)
    @Builder.Default
    private Boolean showCalendarStats = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}