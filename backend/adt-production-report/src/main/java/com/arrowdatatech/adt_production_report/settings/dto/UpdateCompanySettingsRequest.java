package com.arrowdatatech.adt_production_report.settings.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCompanySettingsRequest {

    private String companyName;
    private String streetAddress;
    private String city;
    private String state;
    private String country;
    private String zipCode;
    private String companyLocation;
    private String phone;
    private String email;
    private String portalName;
    private String welcomeMessage;
    private String primaryColor;
    private String secondaryColor;
    private Boolean enableTopPerformerBanner;
    private String authorizedPersonName;
    private String designation;
    private java.util.UUID letterPadImageId;
    private java.util.UUID signatureImageId;
    private Integer sessionTimeout;
    private Integer maxFileSize;
    private String allowedTypes;
    private Boolean enableThirukkural;
    private String thirukkuralTranslation;
    private String announcement;
    private Boolean isCelebration;
    private String celebrationText;
    private String celebrationPhotoUrl;
    private java.util.List<String> loginQuotes;
}