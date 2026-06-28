package com.arrowdatatech.adt_production_report.settings.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CompanySettingsResponse {

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
    private String letterPadImageUrl;
    private String signatureImageUrl;
    private String authorizedPersonName;
    private String designation;
    private Integer sessionTimeout;
    private Integer maxFileSize;
    private String allowedTypes;
    private Boolean enableThirukkural;
    private String thirukkuralTranslation;
    private java.util.List<String> loginQuotes;
}