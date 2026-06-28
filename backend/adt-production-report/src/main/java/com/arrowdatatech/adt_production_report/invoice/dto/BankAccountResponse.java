package com.arrowdatatech.adt_production_report.invoice.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class BankAccountResponse {
    private UUID id;
    private String label;
    private String bankName;
    private String accountHolder;
    private String accountNumber;
    private String branch;
    private String ifscCode;
    private String accountType;
    private String gpayNumber;
    private UUID qrCodeImageId;
    private String qrCodeImageUrl;
    private Boolean isActive;
    private OffsetDateTime createdAt;
}
