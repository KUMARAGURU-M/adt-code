package com.arrowdatatech.adt_production_report.client.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateClientRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String pinCode;
    private String panNumber;
    private String gstin;
    private String contactEmail;
    private String contactPhone;
    private Boolean isActive;
}