package com.arrowdatatech.adt_production_report.media.repository;

import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MediaFileRepository extends JpaRepository<MediaFile, UUID> {

    @Query("SELECT mf FROM MediaFile mf WHERE mf.entityType = 'chat' AND mf.createdAt < :cutoff")
    List<MediaFile> findChatMediaFilesOlderThan(@Param("cutoff") java.time.OffsetDateTime cutoff);
}
