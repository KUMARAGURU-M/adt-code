package com.arrowdatatech.adt_production_report.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Email or User ID is required")
    @JsonProperty("identifier")
    private String identifier;

    @NotBlank(message = "Password is required")
    @JsonProperty("password")
    private String password;

    @JsonProperty("loginType")
    private String loginType = "Employee";

    @JsonProperty("captchaCode")
    private String captchaCode;

    @JsonProperty("captchaAnswer")
    private String captchaAnswer;
}