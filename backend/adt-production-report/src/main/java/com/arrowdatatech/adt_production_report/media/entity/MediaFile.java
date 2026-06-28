package com.arrowdatatech.adt_production_report.media.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "media_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    // UUID-based name on disk/S3 to prevent path conflicts
    @Column(name = "stored_name", nullable = false, length = 255)
    private String storedName;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "file_size", nullable = false)
    @Builder.Default
    private Long fileSize = 0L;

    // S3 key or relative disk path - never a full URL
    @Column(name = "storage_path", nullable = false, columnDefinition = "TEXT")
    private String storagePath;

    // local, s3, r2
    @Column(name = "storage_type", nullable = false, length = 20)
    @Builder.Default
    private String storageType = "local";

    // user_profile, kyc_document, letter_pad, signature, bulk_import, invoice_pdf, qr_code
    @Column(name = "entity_type", length = 60)
    private String entityType;

    // Application-level link (not a DB FK for flexibility)
    @Column(name = "entity_id")
    private UUID entityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by",
            foreignKey = @ForeignKey(name = "fk_media_uploaded_by"))
    private User uploadedBy;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;
}