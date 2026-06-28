package com.arrowdatatech.adt_production_report.settings.entity;

import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "company_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_name", nullable = false, length = 200)
    @Builder.Default
    private String companyName = "Arrow Data-Tech";

    @Column(name = "street_address", columnDefinition = "TEXT")
    private String streetAddress;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "zip_code", length = 20)
    private String zipCode;

    @Column(name = "company_location", length = 200)
    @Builder.Default
    private String companyLocation = "Puducherry";

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "portal_name", nullable = false, length = 100)
    @Builder.Default
    private String portalName = "ADT - Production Login Portal";

    @Column(name = "welcome_message", columnDefinition = "TEXT")
    private String welcomeMessage;

    @Column(name = "primary_color", nullable = false, length = 10)
    @Builder.Default
    private String primaryColor = "#c28595";

    @Column(name = "secondary_color", nullable = false, length = 10)
    @Builder.Default
    private String secondaryColor = "#f0979c";

    @Column(name = "enable_top_performer_banner", nullable = false)
    @Builder.Default
    private Boolean enableTopPerformerBanner = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "letter_pad_image_id",
            foreignKey = @ForeignKey(name = "fk_settings_letter_pad"))
    private MediaFile letterPadImage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signature_image_id",
            foreignKey = @ForeignKey(name = "fk_settings_signature"))
    private MediaFile signatureImage;

    @Column(name = "authorized_person_name", length = 100)
    private String authorizedPersonName;

    @Column(name = "designation", length = 100)
    private String designation;

    // Issue 2 fix: singleton enforcer
    @Column(name = "is_singleton", nullable = false)
    @Builder.Default
    private Boolean isSingleton = true;

    @Column(name = "session_timeout", nullable = false)
    @Builder.Default
    private Integer sessionTimeout = 480;

    @Column(name = "max_file_size", nullable = false)
    @Builder.Default
    private Integer maxFileSize = 10;

    @Column(name = "allowed_types", nullable = false, length = 255)
    @Builder.Default
    private String allowedTypes = "jpg,jpeg,png,pdf,doc,docx";

    @Column(name = "enable_thirukkural", nullable = false)
    @Builder.Default
    private Boolean enableThirukkural = true;

    @Column(name = "thirukkural_translation", nullable = false, length = 50)
    @Builder.Default
    private String thirukkuralTranslation = "all";

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}