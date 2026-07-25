package com.arrowdatatech.adt_production_report.project.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "dev_project_updates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevProjectUpdate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dev_project_updates_project"))
    private DevProject project;

    @Column(name = "author", nullable = false)
    private String author;

    @Column(name = "update_text", nullable = false, columnDefinition = "TEXT")
    private String updateText;

    @Column(name = "update_date", nullable = false)
    @Builder.Default
    private LocalDate date = LocalDate.now();
}
