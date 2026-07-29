package com.arrowdatatech.adt_production_report.contact.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.contact.dto.ContactInquiryRequest;
import com.arrowdatatech.adt_production_report.contact.dto.ContactInquiryResponse;
import com.arrowdatatech.adt_production_report.contact.service.ContactInquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ContactController {

    private final ContactInquiryService service;

    /** Public — company website contact form */
    @PostMapping("/public/contact")
    public ResponseEntity<ApiResponse<ContactInquiryResponse>> submit(
            @Valid @RequestBody ContactInquiryRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Inquiry submitted", service.submit(req)));
    }

    /** Admin — list all inquiries */
    @GetMapping("/admin/contact")
    public ResponseEntity<ApiResponse<List<ContactInquiryResponse>>> list(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("OK", service.getAll(status)));
    }

    /** Admin — update status */
    @PutMapping("/admin/contact/{id}/status")
    public ResponseEntity<ApiResponse<ContactInquiryResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Updated", service.updateStatus(id, body.get("status"))));
    }

    /** Admin — delete */
    @DeleteMapping("/admin/contact/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }
}
