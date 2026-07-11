package com.arrowdatatech.adt_production_report.client.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client extends BaseEntity {

    @Column(name = "company_name", nullable = false, unique = true, length = 200)
    private String companyName;

    @Column(name = "company_full_name", length = 300)
    private String companyFullName;

    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "pin_code", length = 20)
    private String pinCode;

    @Column(name = "pan_number", length = 20)
    private String panNumber;

    @Column(name = "gstin", length = 20)
    private String gstin;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // OneToMany: one client -> many projects
    @OneToMany(mappedBy = "client", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Project> projects = new HashSet<>();
}