package com.arrowdatatech.adt_production_report.invoice.repository;

import com.arrowdatatech.adt_production_report.invoice.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    // Invoice history page with filters
    @Query("""
            SELECT i FROM Invoice i
            JOIN FETCH i.client c
            WHERE (:clientId IS NULL OR i.client.id = :clientId)
            AND (:paymentStatus IS NULL OR i.paymentStatus = :paymentStatus)
            AND (:year IS NULL OR i.periodYear = :year)
            ORDER BY i.invoiceDate DESC
            """)
    Page<Invoice> filterInvoices(UUID clientId, String paymentStatus,
                                 Integer year, Pageable pageable);

    // Auto-increment invoice number per year
    @Query("""
            SELECT COALESCE(MAX(
                CAST(SUBSTRING(i.invoiceNumber,
                    LENGTH('ADT-') + 5 + 1) AS integer)
            ), 0)
            FROM Invoice i
            WHERE i.invoiceNumber LIKE CONCAT('ADT-', :year, '-%')
            """)
    Integer findMaxInvoiceSequenceForYear(Integer year);

    // Invoice history summary totals
    @Query("""
            SELECT SUM(i.grandTotal),
                   SUM(i.totalReceived),
                   SUM(i.grandTotal) - SUM(i.totalReceived),
                   COUNT(i)
            FROM Invoice i
            WHERE (:clientId IS NULL OR i.client.id = :clientId)
            AND i.deletedAt IS NULL
            """)
    Object[] getInvoiceSummaryTotals(UUID clientId);

    // Recent invoices for history panel
    List<Invoice> findTop10ByOrderByCreatedAtDesc();
}