package com.arrowdatatech.adt_production_report.tool.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tool_access",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_tool_access",
                columnNames = {"tool_id", "user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ToolAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tool_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ta_tool"))
    private Tool tool;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ta_user"))
    private User user;

    // Granted | Denied
    @Column(name = "access", nullable = false, length = 20)
    @Builder.Default
    private String access = "Denied";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by",
            foreignKey = @ForeignKey(name = "fk_ta_granted_by"))
    private User grantedBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;
}