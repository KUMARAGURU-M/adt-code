package com.arrowdatatech.adt_production_report.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO strictly for users updating their own profile.
 * Notice the complete absence of sensitive fields like role, shift, or isActive.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    // Only safe, personal fields go here
    private String phone;
    private String timezone;

    // You can expand this in the future with other safe fields:
    // private String profilePhotoUrl;
    // private String bio;
}