package com.arrowdatatech.adt_production_report.contact.dto;

import com.arrowdatatech.adt_production_report.contact.entity.ContactInquiry;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class ContactInquiryResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String company;
    private String service;
    private String message;
    private String status;
    private OffsetDateTime createdAt;

    public static ContactInquiryResponse from(ContactInquiry e) {
        ContactInquiryResponse r = new ContactInquiryResponse();
        r.setId(e.getId());
        r.setName(e.getName());
        r.setEmail(e.getEmail());
        r.setPhone(e.getPhone());
        r.setCompany(e.getCompany());
        r.setService(e.getService());
        r.setMessage(e.getMessage());
        r.setStatus(e.getStatus());
        r.setCreatedAt(e.getCreatedAt());
        return r;
    }
}
