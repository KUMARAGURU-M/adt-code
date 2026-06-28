package com.arrowdatatech.adt_production_report.client.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Builder
public class ClientResponse {

    private UUID id;
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
    private OffsetDateTime createdAt;
}