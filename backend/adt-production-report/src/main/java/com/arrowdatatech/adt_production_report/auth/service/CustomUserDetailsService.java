package com.arrowdatatech.adt_production_report.auth.service;

import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // Spring Security calls this during authentication
    // identifier = email OR user_code
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier)
            throws UsernameNotFoundException {

        User user = findByIdentifier(identifier);

        // Build authorities from role assignments
        List<SimpleGrantedAuthority> authorities = user.getRoleAssignments()
                .stream()
                .map(ura -> new SimpleGrantedAuthority("ROLE_" + ura.getRole().getName()))
                .collect(Collectors.toList());

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getId().toString())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .accountLocked(!user.getIsActive())
                .disabled(!user.getIsActive())
                .build();
    }

    // Load by UUID (used in JWT filter)
    @Transactional(readOnly = true)
    public UserDetails loadUserById(java.util.UUID userId) {
        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with id: " + userId));

        List<SimpleGrantedAuthority> authorities = user.getRoleAssignments()
                .stream()
                .map(ura -> new SimpleGrantedAuthority("ROLE_" + ura.getRole().getName()))
                .collect(Collectors.toList());

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getId().toString())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .accountLocked(!user.getIsActive())
                .disabled(!user.getIsActive())
                .build();
    }

    private User findByIdentifier(String identifier) {
        // Try email first
        if (identifier.contains("@")) {
            return userRepository.findByEmailAndDeletedAtIsNull(identifier)
                    .orElseThrow(() -> new UsernameNotFoundException(
                            "User not found with email: " + identifier));
        }
        // Try user_code
        return userRepository.findByUserCodeAndDeletedAtIsNull(identifier)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with user code: " + identifier));
    }
}