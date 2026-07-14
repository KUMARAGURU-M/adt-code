package com.arrowdatatech.adt_production_report.config;

import com.arrowdatatech.adt_production_report.auth.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 1. FRONTEND STATIC FILES - PUBLIC
                .requestMatchers("/", "/index.html", "/static/**", "/*.ico", "/*.json", "/*.png", "/images/**").permitAll()
                
                // 2. PUBLIC API ENDPOINTS
                .requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/auth/logout", "/api/users/top-performers", "/api/settings/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/media/**").permitAll()
                
                // 3. SWAGGER UI
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                
                // 4. SECURE API ENDPOINTS
                .requestMatchers("/api/users/reset-password").authenticated()
                .requestMatchers("/api/users/approvers").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/users", "/api/users/**").hasAnyRole("Admin", "Manager", "Team Leader")
                .requestMatchers("/api/users", "/api/users/**").hasAnyRole("Admin", "Manager")
                .requestMatchers("/api/attendance/summary/**", "/api/invoices/**", "/api/bank-accounts/**", "/api/roles/**", "/api/settings/**").hasRole("Admin")
                .requestMatchers(HttpMethod.GET, "/api/projects", "/api/projects/**", "/api/processes", "/api/processes/**", "/api/shifts", "/api/shifts/**").authenticated()
                .requestMatchers("/api/projects", "/api/projects/**", "/api/processes/**", "/api/shifts/**", "/api/activity-logs/**").hasAnyRole("Admin", "Manager")
                .requestMatchers("/api/tasks/my-tasks").authenticated()
                .requestMatchers("/api/tasks/**", "/api/jobs/**", "/api/reports/**").hasAnyRole("Admin", "Manager", "Team Leader")
                .requestMatchers("/api/chat/admin/**").hasRole("Admin")
                .requestMatchers("/api/chat/**", "/api/workwise/**", "/api/leave/**", "/api/notifications/**", "/api/timelog/**").authenticated()
                
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .authenticationProvider(authenticationProvider());

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}