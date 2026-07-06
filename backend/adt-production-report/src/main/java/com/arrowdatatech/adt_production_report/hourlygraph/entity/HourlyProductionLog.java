package com.arrowdatatech.adt_production_report.hourlygraph.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "hourly_production_logs", uniqueConstraints = {
        @UniqueConstraint(name = "uq_hourly_production_logs_date_user", columnNames = {"date", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HourlyProductionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_hourly_prod_logs_user"))
    private User user;

    @Column(name = "shift_name", length = 100)
    private String shiftName;

    @Column(name = "in_time", length = 10)
    private String inTime;

    @Column(name = "out_time", length = 10)
    private String outTime;

    @Column(name = "project_name", length = 255)
    private String projectName;

    @Column(name = "process_name", length = 255)
    private String processName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hours", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String hours = "[]";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
