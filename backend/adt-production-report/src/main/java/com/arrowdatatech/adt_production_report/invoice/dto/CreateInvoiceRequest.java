package com.arrowdatatech.adt_production_report.invoice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class CreateInvoiceRequest {

    @NotNull(message = "Client is required")
    private UUID clientId;

    private String invoiceTitle;
    private String periodMonth;
    private Integer periodYear;
    private LocalDate invoiceDate;

    private BigDecimal gstPercentage;

    private UUID bankAccountId;

    private String columnConfig; // JSON string

    private Boolean letterPadEnabled;
    private Boolean showSignature;
    private Boolean showQr;

    @NotNull(message = "Line items are required")
    private List<LineItemRequest> lineItems;

    @Getter
    @Setter
    public static class LineItemRequest {
        private Integer sno;
        private UUID projectId;
        private UUID processId;
        private UUID jobId;
        private String batchName;
        private Integer pages;
        private BigDecimal ratePerPage;
        private BigDecimal deduction;
        private LocalDate uploadedDate;
        private LocalDate startDate;
        private LocalDate endDate;
    }
}