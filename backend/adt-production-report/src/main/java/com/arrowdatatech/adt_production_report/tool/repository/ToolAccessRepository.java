package com.arrowdatatech.adt_production_report.tool.repository;

import com.arrowdatatech.adt_production_report.tool.entity.ToolAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ToolAccessRepository extends JpaRepository<ToolAccess, UUID> {

    // All access rows for a specific tool
    List<ToolAccess> findByToolIdOrderByUserIdAsc(UUID toolId);

    // Access row for specific user + tool
    Optional<ToolAccess> findByToolIdAndUserId(UUID toolId, UUID userId);

    // All tools this user has access to
    @Query("""
            SELECT ta FROM ToolAccess ta
            WHERE ta.user.id = :userId
            AND ta.access = 'Granted'
            """)
    List<ToolAccess> findGrantedForUser(@Param("userId") UUID userId);

    // Check if user has access to a specific tool by name
    @Query("""
            SELECT COUNT(ta) > 0 FROM ToolAccess ta
            WHERE ta.user.id = :userId
            AND ta.tool.name = :toolName
            AND ta.access = 'Granted'
            """)
    boolean hasAccessToTool(
            @Param("userId")   UUID userId,
            @Param("toolName") String toolName
    );
}