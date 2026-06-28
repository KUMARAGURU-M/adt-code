package com.arrowdatatech.adt_production_report.invoice.repository;

import com.arrowdatatech.adt_production_report.invoice.entity.InvoiceLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceLineItemRepository
        extends JpaRepository<InvoiceLineItem, UUID> {

    List<InvoiceLineItem> findByInvoiceIdOrderBySno(UUID invoiceId);

    @Modifying
    @Transactional
    @Query("DELETE FROM InvoiceLineItem ili WHERE ili.invoice.id = :invoiceId")
    void deleteAllByInvoiceId(UUID invoiceId);
}