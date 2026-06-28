package com.arrowdatatech.adt_production_report.attendance.repository;

import com.arrowdatatech.adt_production_report.attendance.entity.HolidayCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HolidayCalendarRepository
        extends JpaRepository<HolidayCalendar, UUID> {

    Optional<HolidayCalendar> findByHolidayDate(LocalDate date);

    boolean existsByHolidayDate(LocalDate date);

    // Mandatory holidays for a date range - used by scheduler
    @Query("""
            SELECT h FROM HolidayCalendar h
            WHERE h.holidayDate BETWEEN :from AND :to
            AND h.isOptional = false
            ORDER BY h.holidayDate ASC
            """)
    List<HolidayCalendar> findMandatoryHolidaysInRange(LocalDate from, LocalDate to);

    // All holidays for a year
    @Query("""
            SELECT h FROM HolidayCalendar h
            WHERE YEAR(h.holidayDate) = :year
            OR h.applicableYear IS NULL
            ORDER BY h.holidayDate ASC
            """)
    List<HolidayCalendar> findHolidaysForYear(int year);
}