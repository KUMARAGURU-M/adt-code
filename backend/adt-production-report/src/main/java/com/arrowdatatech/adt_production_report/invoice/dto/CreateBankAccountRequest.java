package com.arrowdatatech.adt_production_report.invoice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateBankAccountRequest {

    @NotBlank(message = "Account label is required")
    private String label;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Account holder name is required")
    private String accountHolder;

    @NotBlank(message = "Account number is required")
    private String accountNumber;

    private String branch;
    private String ifscCode;
    private String accountType; // Current or Savings
    private String gpayNumber;
    private UUID qrCodeImageId;
    private Boolean isActive;
}
