package com.arrowdatatech.adt_production_report.settings.service;

import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import com.arrowdatatech.adt_production_report.media.repository.MediaFileRepository;
import com.arrowdatatech.adt_production_report.settings.dto.CompanySettingsResponse;
import com.arrowdatatech.adt_production_report.settings.dto.UpdateCompanySettingsRequest;
import com.arrowdatatech.adt_production_report.settings.entity.CompanySettings;
import com.arrowdatatech.adt_production_report.settings.repository.CompanySettingsRepository;
import com.arrowdatatech.adt_production_report.settings.entity.MotivationalQuote;
import com.arrowdatatech.adt_production_report.settings.repository.MotivationalQuoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanySettingsService {

    private final CompanySettingsRepository companySettingsRepository;
    private final MediaFileRepository mediaFileRepository;
    private final MotivationalQuoteRepository motivationalQuoteRepository;

    @Transactional(readOnly = true)
    public CompanySettingsResponse getSettings() {
        CompanySettings settings = getOrCreateSingleton();
        return toResponse(settings);
    }

    @Transactional
    public CompanySettingsResponse updateSettings(UpdateCompanySettingsRequest request) {
        CompanySettings settings = getOrCreateSingleton();

        if (request.getCompanyName() != null) settings.setCompanyName(request.getCompanyName().trim());
        if (request.getStreetAddress() != null) settings.setStreetAddress(request.getStreetAddress().trim());
        if (request.getCity() != null) settings.setCity(request.getCity().trim());
        if (request.getState() != null) settings.setState(request.getState().trim());
        if (request.getCountry() != null) settings.setCountry(request.getCountry().trim());
        if (request.getZipCode() != null) settings.setZipCode(request.getZipCode().trim());
        if (request.getCompanyLocation() != null) settings.setCompanyLocation(request.getCompanyLocation().trim());
        if (request.getPhone() != null) settings.setPhone(request.getPhone().trim());
        if (request.getEmail() != null) settings.setEmail(request.getEmail().trim());
        if (request.getPortalName() != null) settings.setPortalName(request.getPortalName().trim());
        if (request.getWelcomeMessage() != null) settings.setWelcomeMessage(request.getWelcomeMessage().trim());
        if (request.getPrimaryColor() != null) settings.setPrimaryColor(request.getPrimaryColor().trim());
        if (request.getSecondaryColor() != null) settings.setSecondaryColor(request.getSecondaryColor().trim());
        if (request.getEnableTopPerformerBanner() != null) settings.setEnableTopPerformerBanner(request.getEnableTopPerformerBanner());
        if (request.getAuthorizedPersonName() != null) settings.setAuthorizedPersonName(request.getAuthorizedPersonName().trim());
        if (request.getDesignation() != null) settings.setDesignation(request.getDesignation().trim());
        if (request.getSessionTimeout() != null) settings.setSessionTimeout(request.getSessionTimeout());
        if (request.getMaxFileSize() != null) settings.setMaxFileSize(request.getMaxFileSize());
        if (request.getAllowedTypes() != null) settings.setAllowedTypes(request.getAllowedTypes().trim());
        if (request.getEnableThirukkural() != null) settings.setEnableThirukkural(request.getEnableThirukkural());
        if (request.getThirukkuralTranslation() != null) settings.setThirukkuralTranslation(request.getThirukkuralTranslation().trim());
        if (request.getAnnouncement() != null) settings.setAnnouncement(request.getAnnouncement().trim());
        if (request.getIsCelebration() != null) settings.setIsCelebration(request.getIsCelebration());
        if (request.getCelebrationText() != null) settings.setCelebrationText(request.getCelebrationText().trim());
        if (request.getCelebrationPhotoUrl() != null) settings.setCelebrationPhotoUrl(request.getCelebrationPhotoUrl().trim());

        if (request.getLetterPadImageId() != null) {
            MediaFile letterPad = mediaFileRepository.findById(request.getLetterPadImageId())
                    .orElseThrow(() -> new ResourceNotFoundException("MediaFile", "id", request.getLetterPadImageId()));
            settings.setLetterPadImage(letterPad);
        }

        if (request.getSignatureImageId() != null) {
            MediaFile signature = mediaFileRepository.findById(request.getSignatureImageId())
                    .orElseThrow(() -> new ResourceNotFoundException("MediaFile", "id", request.getSignatureImageId()));
            settings.setSignatureImage(signature);
        }

        // Handle motivational quotes
        if (request.getLoginQuotes() != null) {
            motivationalQuoteRepository.deleteAll();
            int order = 0;
            for (String quoteStr : request.getLoginQuotes()) {
                if (quoteStr != null && !quoteStr.trim().isEmpty()) {
                    MotivationalQuote quote = MotivationalQuote.builder()
                            .quoteText(quoteStr.trim())
                            .isActive(true)
                            .sortOrder(order++)
                            .build();
                    motivationalQuoteRepository.save(quote);
                }
            }
        }

        settings.setUpdatedAt(OffsetDateTime.now());
        settings = companySettingsRepository.save(settings);
        log.info("Company settings updated");
        return toResponse(settings);
    }

    private CompanySettings getOrCreateSingleton() {
        return companySettingsRepository.findByIsSingletonTrue()
                .orElseGet(() -> {
                    CompanySettings defaultSettings = CompanySettings.builder()
                            .companyName("Arrow Data-Tech")
                            .streetAddress("407, M.G Road, Kottakuppam, (Near Roundana), Near Puducherry")
                            .city("Kottakuppam, Villupuram District")
                            .state("Tamil Nadu")
                            .country("India")
                            .zipCode("605014")
                            .companyLocation("Puducherry")
                            .portalName("ADT - Production Login Portal")
                            .welcomeMessage("Welcome Back! Please Login to Continue")
                            .primaryColor("#c28595")
                            .secondaryColor("#f0979c")
                            .enableTopPerformerBanner(true)
                            .authorizedPersonName("T. Mohamed Usen")
                            .designation("Managing Director")
                            .sessionTimeout(480)
                            .maxFileSize(10)
                            .allowedTypes("jpg,jpeg,png,pdf,doc,docx")
                            .enableThirukkural(true)
                            .thirukkuralTranslation("all")
                            .isSingleton(true)
                            .updatedAt(OffsetDateTime.now())
                            .build();
                    return companySettingsRepository.save(defaultSettings);
                });
    }

    private CompanySettingsResponse toResponse(CompanySettings s) {
        java.util.List<String> quotes = motivationalQuoteRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(MotivationalQuote::getQuoteText)
                .collect(Collectors.toList());

        if (quotes.isEmpty()) {
            quotes = java.util.List.of(
                "Success is not final, failure is not fatal: It is the courage to continue that counts.",
                "The only way to do great work is to love what you do.",
                "Believe you can and you're halfway there."
            );
        }

        return CompanySettingsResponse.builder()
                .companyName(s.getCompanyName())
                .streetAddress(s.getStreetAddress())
                .city(s.getCity())
                .state(s.getState())
                .country(s.getCountry())
                .zipCode(s.getZipCode())
                .companyLocation(s.getCompanyLocation())
                .phone(s.getPhone())
                .email(s.getEmail())
                .portalName(s.getPortalName())
                .welcomeMessage(s.getWelcomeMessage())
                .primaryColor(s.getPrimaryColor())
                .secondaryColor(s.getSecondaryColor())
                .enableTopPerformerBanner(s.getEnableTopPerformerBanner())
                .letterPadImageUrl(s.getLetterPadImage() != null ? "/media/" + s.getLetterPadImage().getId() : null)
                .signatureImageUrl(s.getSignatureImage() != null ? "/media/" + s.getSignatureImage().getId() : null)
                .authorizedPersonName(s.getAuthorizedPersonName())
                .designation(s.getDesignation())
                .sessionTimeout(s.getSessionTimeout())
                .maxFileSize(s.getMaxFileSize())
                .allowedTypes(s.getAllowedTypes())
                .enableThirukkural(s.getEnableThirukkural())
                .thirukkuralTranslation(s.getThirukkuralTranslation())
                .announcement(s.getAnnouncement())
                .isCelebration(s.getIsCelebration())
                .celebrationText(s.getCelebrationText())
                .celebrationPhotoUrl(s.getCelebrationPhotoUrl())
                .loginQuotes(quotes)
                .build();
    }
}
