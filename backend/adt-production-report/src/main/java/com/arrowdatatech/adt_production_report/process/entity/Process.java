package com.arrowdatatech.adt_production_report.process.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "processes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Process extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}