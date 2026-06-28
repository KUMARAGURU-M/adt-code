package com.arrowdatatech.adt_production_report.invoice.controller;

import com.arrowdatatech.adt_production_report.common.audit.dto.PagedResponse;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.invoice.dto.*;
import com.arrowdatatech.adt_production_report.invoice.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<InvoiceResponse>>> getInvoices(
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Page<InvoiceResponse> result = invoiceService.getInvoices(clientId, paymentStatus, year, page, size);

        PagedResponse<InvoiceResponse> response = PagedResponse.<InvoiceResponse>builder()
                .content(result.getContent())
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Invoices retrieved", response));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<InvoiceSummaryResponse>> getInvoiceSummary(
            @RequestParam(required = false) UUID clientId) {
        InvoiceSummaryResponse summary = invoiceService.getInvoiceSummary(clientId);
        return ResponseEntity.ok(ApiResponse.success("Invoice summary retrieved", summary));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable UUID id) {
        InvoiceResponse invoice = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.success("Invoice retrieved", invoice));
    }

    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @Valid @RequestBody CreateInvoiceRequest request) {
        InvoiceResponse created = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invoice created successfully", created));
    }

    @PutMapping("/{id}/payment")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updatePaymentStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {

        String status = (String) body.get("paymentStatus");
        Number totalReceivedNum = (Number) body.get("totalReceived");
        BigDecimal totalReceived = totalReceivedNum != null ? BigDecimal.valueOf(totalReceivedNum.doubleValue()) : null;

        if (status == null) {
            throw new com.arrowdatatech.adt_production_report.common.exception.BadRequestException("paymentStatus is required");
        }

        InvoiceResponse updated = invoiceService.updatePaymentStatus(id, status, totalReceived);
        return ResponseEntity.ok(ApiResponse.success("Invoice payment status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<Void>> deleteInvoice(@PathVariable UUID id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.ok(ApiResponse.success("Invoice deleted successfully", null));
    }
}
