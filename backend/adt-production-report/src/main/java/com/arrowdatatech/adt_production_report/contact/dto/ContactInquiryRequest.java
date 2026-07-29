package com.arrowdatatech.adt_production_report.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactInquiryRequest {
    @NotBlank @Size(max = 200)
    private String name;

    @NotBlank @Email @Size(max = 300)
    private String email;

    @Size(max = 50)
    private String phone;

    @Size(max = 300)
    private String company;

    @Size(max = 100)
    private String service;

    @NotBlank
    private String message;
}
