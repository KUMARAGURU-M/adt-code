package com.arrowdatatech.adt_production_report.invoice.controller;

import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import com.arrowdatatech.adt_production_report.invoice.dto.BankAccountResponse;
import com.arrowdatatech.adt_production_report.invoice.dto.CreateBankAccountRequest;
import com.arrowdatatech.adt_production_report.invoice.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BankAccountResponse>>> getActiveBankAccounts() {
        List<BankAccountResponse> list = bankAccountService.getActiveBankAccounts();
        return ResponseEntity.ok(ApiResponse.success("Bank accounts retrieved", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BankAccountResponse>> getBankAccountById(@PathVariable UUID id) {
        BankAccountResponse response = bankAccountService.getBankAccountById(id);
        return ResponseEntity.ok(ApiResponse.success("Bank account retrieved", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<BankAccountResponse>> createBankAccount(
            @Valid @RequestBody CreateBankAccountRequest request) {
        BankAccountResponse response = bankAccountService.createBankAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bank account created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<BankAccountResponse>> updateBankAccount(
            @PathVariable UUID id,
            @Valid @RequestBody CreateBankAccountRequest request) {
        BankAccountResponse response = bankAccountService.updateBankAccount(id, request);
        return ResponseEntity.ok(ApiResponse.success("Bank account updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<Void>> deleteBankAccount(@PathVariable UUID id) {
        bankAccountService.deleteBankAccount(id);
        return ResponseEntity.ok(ApiResponse.success("Bank account deleted successfully", null));
    }
}
