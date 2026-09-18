package com.arrowdatatech.adt_production_report.auth.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {
    @Test
    void refreshTokensForTheSameUserAreUnique() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "test-only-secret-with-at-least-thirty-two-bytes");
        ReflectionTestUtils.setField(provider, "refreshTokenExpiry", 60000L);
        UUID userId = UUID.randomUUID();
        String first = provider.generateRefreshToken(userId);
        String second = provider.generateRefreshToken(userId);
        assertNotEquals(first, second);
        assertTrue(provider.validateToken(second));
        assertTrue(provider.isRefreshToken(second));
        assertEquals(userId, provider.getUserIdFromToken(second));
    }
}
