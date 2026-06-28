package com.arrowdatatech.adt_production_report.invoice.entity;

import com.arrowdatatech.adt_production_report.client.entity.Client;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // Format: ADT-YYYY-NNNN
    @Column(name = "invoice_number", nullable = false, unique = true, length = 30)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_invoice_client"))
    private Client client;

    // Immutable snapshots at invoice creation time
    @Column(name = "vendor_name", nullable = false, length = 200)
    private String vendorName;

    @Column(name = "vendor_address", columnDefinition = "TEXT")
    private String vendorAddress;

    @Column(name = "vendor_pan", length = 20)
    private String vendorPan;

    @Column(name = "vendor_gstin", length = 20)
    private String vendorGstin;

    @Column(name = "invoice_date", nullable = false)
    @Builder.Default
    private LocalDate invoiceDate = LocalDate.now();

    @Column(name = "invoice_title", columnDefinition = "TEXT")
    private String invoiceTitle;

    @Column(name = "period_month", length = 20)
    private String periodMonth;

    @Column(name = "period_year")
    private Integer periodYear;

    @Column(name = "sub_total", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal subTotal = BigDecimal.ZERO;

    @Column(name = "gst_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal gstPercentage = BigDecimal.ZERO;

    @Column(name = "gst_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal gstAmount = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "amount_in_words", columnDefinition = "TEXT")
    private String amountInWords;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id",
            foreignKey = @ForeignKey(name = "fk_invoice_bank"))
    private BankAccount bankAccount;

    // Pending, Paid, Overdue, Partially Paid
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private String paymentStatus = "Pending";

    @Column(name = "total_received", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalReceived = BigDecimal.ZERO;

    // Table Column Configuration JSON — must be @JdbcTypeCode(JSON) so Hibernate
    // binds this String as jsonb rather than character varying (Hibernate 6 requirement)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "column_config", columnDefinition = "jsonb")
    private String columnConfig;

    @Column(name = "letter_pad_enabled", nullable = false)
    @Builder.Default
    private Boolean letterPadEnabled = false;

    @Column(name = "show_signature", nullable = false)
    @Builder.Default
    private Boolean showSignature = true;

    @Column(name = "show_qr", nullable = false)
    @Builder.Default
    private Boolean showQr = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by",
            foreignKey = @ForeignKey(name = "fk_invoice_created_by"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private User createdBy;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // OneToMany: invoice -> line items
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private Set<InvoiceLineItem> lineItems = new HashSet<>();
}