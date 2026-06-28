package com.arrowdatatech.adt_production_report.invoice.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class InvoiceSummaryResponse {
    private BigDecimal totalInvoiced;
    private BigDecimal totalReceived;
    private BigDecimal outstandingAmount;
    private Long invoiceCount;
}
