package com.arrowdatatech.adt_production_report.common.util;

import com.arrowdatatech.adt_production_report.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.UUID;

// Static utility - used across all services to get current user
public class SecurityUtils {

    private SecurityUtils() {}

    // Get the UUID of the currently authenticated user
    public static UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder
                .getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new UnauthorizedException("No authenticated user found");
        }

        if (auth.getPrincipal() instanceof UserDetails userDetails) {
            return UUID.fromString(userDetails.getUsername());
        }

        throw new UnauthorizedException("Cannot extract user from token");
    }

    // Check if current user has a specific role
    public static boolean hasRole(String roleName) {
        Authentication auth = SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null) return false;

        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority()
                        .equals("ROLE_" + roleName));
    }

    // Check if current user is Admin
    public static boolean isAdmin() {
        return hasRole("Admin");
    }

    // Check if current user is Manager or Admin
    public static boolean isAdminOrManager() {
        return hasRole("Admin") || hasRole("Manager");
    }
}