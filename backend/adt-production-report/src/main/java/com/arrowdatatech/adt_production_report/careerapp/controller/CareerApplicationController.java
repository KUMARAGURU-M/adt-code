package com.arrowdatatech.adt_production_report.careerapp.controller;

import com.arrowdatatech.adt_production_report.careerapp.dto.CareerApplicationResponse;
import com.arrowdatatech.adt_production_report.careerapp.service.CareerApplicationService;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CareerApplicationController {

    private final CareerApplicationService service;

    /** Public — career application form with resume upload */
    @PostMapping("/public/careers/apply")
    public ResponseEntity<ApiResponse<CareerApplicationResponse>> apply(
            @RequestParam("role")       String jobTitle,
            @RequestParam(value = "department", required = false, defaultValue = "General") String department,
            @RequestParam("name")       String name,
            @RequestParam("email")      String email,
            @RequestParam(value = "phone",     required = false) String phone,
            @RequestParam(value = "portfolio", required = false) String portfolio,
            @RequestParam(value = "coverNote", required = false) String coverNote,
            @RequestParam(value = "resume",    required = false) MultipartFile resume) {

        CareerApplicationResponse result = service.submit(
                jobTitle, department, name, email, phone, portfolio, coverNote, resume);
        return ResponseEntity.ok(ApiResponse.success("Application submitted", result));
    }

    /** Admin — list all applications */
    @GetMapping("/admin/careers/applications")
    public ResponseEntity<ApiResponse<List<CareerApplicationResponse>>> list(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("OK", service.getAll(status)));
    }

    /** Admin — update status */
    @PutMapping("/admin/careers/applications/{id}/status")
    public ResponseEntity<ApiResponse<CareerApplicationResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Updated",
                service.updateStatus(id, body.get("status"))));
    }

    /** Admin — delete */
    @DeleteMapping("/admin/careers/applications/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }
}
