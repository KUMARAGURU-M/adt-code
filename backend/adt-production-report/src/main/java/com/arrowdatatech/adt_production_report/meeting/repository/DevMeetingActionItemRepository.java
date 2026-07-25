package com.arrowdatatech.adt_production_report.meeting.repository;

import com.arrowdatatech.adt_production_report.meeting.entity.DevMeetingActionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DevMeetingActionItemRepository extends JpaRepository<DevMeetingActionItem, UUID> {
}
