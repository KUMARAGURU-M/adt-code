package com.arrowdatatech.adt_production_report.settings.repository;

import com.arrowdatatech.adt_production_report.settings.entity.MotivationalQuote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MotivationalQuoteRepository
        extends JpaRepository<MotivationalQuote, UUID> {

    // Active quotes for login page - ordered by sort_order
    List<MotivationalQuote> findByIsActiveTrueOrderBySortOrderAsc();
}