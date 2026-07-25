package com.arrowdatatech.adt_production_report.techdocs.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dev_tech_docs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevTechDoc extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dev_tech_docs_user"))
    private User user;

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
}
