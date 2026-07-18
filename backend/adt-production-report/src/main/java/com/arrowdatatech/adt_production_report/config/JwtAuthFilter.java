package com.arrowdatatech.adt_production_report.config;

import com.arrowdatatech.adt_production_report.auth.service.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractTokenFromRequest(request);

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            try {
                UUID userId = jwtTokenProvider.getUserIdFromToken(token);
                
                // Reconstruct UserDetails directly from token claims to avoid database query
                List<String> roles = jwtTokenProvider.getRolesFromToken(token);
                List<String> permissions = jwtTokenProvider.getPermissionsFromToken(token);
                
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                if (roles != null) {
                    for (String role : roles) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                    }
                }
                if (permissions != null) {
                    for (String permission : permissions) {
                        authorities.add(new SimpleGrantedAuthority(permission));
                    }
                }

                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                        .username(userId.toString())
                        .password("") // Password is not needed for token-based authentication context
                        .authorities(authorities)
                        .accountLocked(false)
                        .disabled(false)
                        .build();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null,
                                userDetails.getAuthorities());

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request));

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            } catch (Exception e) {
                log.error("Cannot set user authentication: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    // Extract Bearer token from Authorization header
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}