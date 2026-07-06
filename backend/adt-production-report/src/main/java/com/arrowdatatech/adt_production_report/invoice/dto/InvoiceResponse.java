package com.arrowdatatech.adt_production_report.invoice.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class InvoiceResponse {

    private UUID id;
    private String invoiceNumber;

    // Client info
    private UUID clientId;
    private String clientName;
    private String clientAddress;
    private String clientPan;
    private String clientGstin;

    // Vendor info (snapshot)
    private String vendorName;
    private String vendorAddress;
    private String vendorPan;
    private String vendorGstin;

    private LocalDate invoiceDate;
    private String invoiceTitle;
    private String periodMonth;
    private Integer periodYear;

    private BigDecimal subTotal;
    private BigDecimal gstPercentage;
    private BigDecimal gstAmount;
    private BigDecimal grandTotal;
    private String amountInWords;

    private String paymentStatus;
    private BigDecimal totalReceived;

    private UUID bankAccountId;

    private String columnConfig;
    private Boolean letterPadEnabled;
    private Boolean showSignature;
    private Boolean showQr;

    private OffsetDateTime createdAt;

    private List<LineItemResponse> lineItems;

    @Getter
    @Builder
    public static class LineItemResponse {
        private UUID id;
        private Integer sno;
        private String projectName;
        private String processName;
        private String batchName;
        private Integer pages;
        private BigDecimal ratePerPage;
        private BigDecimal amount;
        private BigDecimal deduction;
        private BigDecimal total;
        private LocalDate uploadedDate;
        private LocalDate startDate;
        private LocalDate endDate;
        private String language;
        private UUID workflowId;
        private String workflowName;
        private String processNames;
        private String workflowNames;
    }
}
