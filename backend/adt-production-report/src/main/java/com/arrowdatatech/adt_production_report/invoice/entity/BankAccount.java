package com.arrowdatatech.adt_production_report.invoice.entity;

import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bank_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "label", nullable = false, length = 60)
    private String label;

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    @Column(name = "account_holder", nullable = false, length = 200)
    private String accountHolder;

    @Column(name = "account_number", nullable = false, unique = true, length = 30)
    private String accountNumber;

    @Column(name = "branch", length = 100)
    private String branch;

    @Column(name = "ifsc_code", length = 20)
    private String ifscCode;

    // Current or Savings
    @Column(name = "account_type", nullable = false, length = 30)
    @Builder.Default
    private String accountType = "Current";

    @Column(name = "gpay_number", length = 20)
    private String gpayNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qr_code_image_id",
            foreignKey = @ForeignKey(name = "fk_bank_qr_image"))
    private MediaFile qrCodeImage;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;
}