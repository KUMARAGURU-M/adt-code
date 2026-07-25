package com.arrowdatatech.adt_production_report.meeting.repository;

import com.arrowdatatech.adt_production_report.meeting.entity.DevMeeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DevMeetingRepository extends JpaRepository<DevMeeting, UUID> {
}
