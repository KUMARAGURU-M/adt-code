package com.arrowdatatech.adt_production_report.contact.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "contact_inquiries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContactInquiry extends BaseEntity {

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "email", nullable = false, length = 300)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "company", length = 300)
    private String company;

    @Column(name = "service", length = 100)
    private String service;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "NEW";
}
