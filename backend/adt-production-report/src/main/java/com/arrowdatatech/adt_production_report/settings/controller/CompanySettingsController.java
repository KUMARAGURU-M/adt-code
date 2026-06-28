package com.arrowdatatech.adt_production_report.settings.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.settings.dto.CompanySettingsResponse;
import com.arrowdatatech.adt_production_report.settings.dto.UpdateCompanySettingsRequest;
import com.arrowdatatech.adt_production_report.settings.service.CompanySettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings")
@RequiredArgsConstructor
public class CompanySettingsController {

    private final CompanySettingsService companySettingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<CompanySettingsResponse>> getSettings() {
        CompanySettingsResponse response = companySettingsService.getSettings();
        return ResponseEntity.ok(ApiResponse.success("Company settings retrieved", response));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<CompanySettingsResponse>> getPublicSettings() {
        CompanySettingsResponse response = companySettingsService.getSettings();
        return ResponseEntity.ok(ApiResponse.success("Public settings retrieved", response));
    }

    @PutMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<CompanySettingsResponse>> updateSettings(
            @Valid @RequestBody UpdateCompanySettingsRequest request) {
        CompanySettingsResponse response = companySettingsService.updateSettings(request);
        return ResponseEntity.ok(ApiResponse.success("Company settings updated successfully", response));
    }
}
