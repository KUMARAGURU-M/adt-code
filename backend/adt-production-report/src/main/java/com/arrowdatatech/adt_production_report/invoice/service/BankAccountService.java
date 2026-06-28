package com.arrowdatatech.adt_production_report.invoice.service;

import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.invoice.dto.BankAccountResponse;
import com.arrowdatatech.adt_production_report.invoice.dto.CreateBankAccountRequest;
import com.arrowdatatech.adt_production_report.invoice.entity.BankAccount;
import com.arrowdatatech.adt_production_report.invoice.repository.BankAccountRepository;
import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import com.arrowdatatech.adt_production_report.media.repository.MediaFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final MediaFileRepository mediaFileRepository;

    @Transactional(readOnly = true)
    public List<BankAccountResponse> getActiveBankAccounts() {
        return bankAccountRepository.findByIsActiveTrueOrderByLabel()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BankAccountResponse getBankAccountById(UUID id) {
        BankAccount bank = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", id));
        return toResponse(bank);
    }

    @Transactional
    public BankAccountResponse createBankAccount(CreateBankAccountRequest request) {
        if (bankAccountRepository.existsByAccountNumber(request.getAccountNumber().trim())) {
            throw new BadRequestException("Bank account with number " + request.getAccountNumber() + " already exists.");
        }

        MediaFile qrImage = null;
        if (request.getQrCodeImageId() != null) {
            qrImage = mediaFileRepository.findById(request.getQrCodeImageId())
                    .orElseThrow(() -> new ResourceNotFoundException("MediaFile", "id", request.getQrCodeImageId()));
        }

        BankAccount bank = BankAccount.builder()
                .label(request.getLabel().trim())
                .bankName(request.getBankName().trim())
                .accountHolder(request.getAccountHolder().trim())
                .accountNumber(request.getAccountNumber().trim())
                .branch(request.getBranch())
                .ifscCode(request.getIfscCode() != null ? request.getIfscCode().trim() : null)
                .accountType(request.getAccountType() != null ? request.getAccountType() : "Current")
                .gpayNumber(request.getGpayNumber())
                .qrCodeImage(qrImage)
                .isActive(true)
                .build();

        bank = bankAccountRepository.save(bank);
        log.info("Bank Account created: {}", bank.getLabel());
        return toResponse(bank);
    }

    @Transactional
    public BankAccountResponse updateBankAccount(UUID id, CreateBankAccountRequest request) {
        BankAccount bank = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", id));

        if (request.getAccountNumber() != null && !bank.getAccountNumber().equals(request.getAccountNumber().trim())) {
            if (bankAccountRepository.existsByAccountNumber(request.getAccountNumber().trim())) {
                throw new BadRequestException("Bank account with number " + request.getAccountNumber() + " already exists.");
            }
            bank.setAccountNumber(request.getAccountNumber().trim());
        }

        if (request.getLabel() != null) bank.setLabel(request.getLabel().trim());
        if (request.getBankName() != null) bank.setBankName(request.getBankName().trim());
        if (request.getAccountHolder() != null) bank.setAccountHolder(request.getAccountHolder().trim());
        if (request.getBranch() != null) bank.setBranch(request.getBranch());
        if (request.getIfscCode() != null) bank.setIfscCode(request.getIfscCode().trim());
        if (request.getAccountType() != null) bank.setAccountType(request.getAccountType());
        if (request.getGpayNumber() != null) bank.setGpayNumber(request.getGpayNumber());

        if (request.getQrCodeImageId() != null) {
            MediaFile qrImage = mediaFileRepository.findById(request.getQrCodeImageId())
                    .orElseThrow(() -> new ResourceNotFoundException("MediaFile", "id", request.getQrCodeImageId()));
            bank.setQrCodeImage(qrImage);
        } else if (request.getQrCodeImageId() == null && request.getLabel() != null) {
            // keep existing or clear depending on requirement, let's keep existing if not explicitly changed
        }

        if (request.getIsActive() != null) {
            bank.setIsActive(request.getIsActive());
        }

        bank = bankAccountRepository.save(bank);
        log.info("Bank Account updated: {}", bank.getLabel());
        return toResponse(bank);
    }

    @Transactional
    public void deleteBankAccount(UUID id) {
        BankAccount bank = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", id));
        bank.setIsActive(false);
        bankAccountRepository.save(bank);
        log.info("Bank Account soft-deleted (deactivated): {}", bank.getLabel());
    }

    private BankAccountResponse toResponse(BankAccount bank) {
        return BankAccountResponse.builder()
                .id(bank.getId())
                .label(bank.getLabel())
                .bankName(bank.getBankName())
                .accountHolder(bank.getAccountHolder())
                .accountNumber(bank.getAccountNumber())
                .branch(bank.getBranch())
                .ifscCode(bank.getIfscCode())
                .accountType(bank.getAccountType())
                .gpayNumber(bank.getGpayNumber())
                .qrCodeImageId(bank.getQrCodeImage() != null ? bank.getQrCodeImage().getId() : null)
                .qrCodeImageUrl(bank.getQrCodeImage() != null ? "/media/" + bank.getQrCodeImage().getId() : null)
                .isActive(bank.getIsActive())
                .createdAt(bank.getCreatedAt())
                .build();
    }
}
