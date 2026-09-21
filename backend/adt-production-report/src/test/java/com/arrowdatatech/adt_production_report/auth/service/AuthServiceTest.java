package com.arrowdatatech.adt_production_report.auth.service;

import com.arrowdatatech.adt_production_report.auth.dto.LoginRequest;
import com.arrowdatatech.adt_production_report.auth.repository.*;
import com.arrowdatatech.adt_production_report.common.audit.service.ActivityLogService;
import com.arrowdatatech.adt_production_report.role.repository.*;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.entity.EmployeeProfile;
import com.arrowdatatech.adt_production_report.media.entity.MediaFile;
import com.arrowdatatech.adt_production_report.auth.entity.UserSession;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.transaction.UnexpectedRollbackException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtTokenProvider jwtTokenProvider;
    @Mock UserRepository userRepository;
    @Mock UserSessionRepository sessionRepository;
    @Mock UserRoleAssignmentRepository roleAssignmentRepository;
    @Mock PermissionRepository permissionRepository;
    @Mock LoginAttendanceService loginAttendanceService;
    @Mock ActivityLogService activityLogService;
    @Mock ImpersonationAuditService impersonationAuditService;
    @InjectMocks AuthService service;

    @Test
    void impersonationUsesTargetProfileAndKeepsAdminAsSessionOwnerReference() {
        UUID adminId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        User admin = User.builder().id(adminId).build();
        MediaFile photo = MediaFile.builder().id(UUID.randomUUID()).isActive(true).build();
        User target = User.builder().id(targetId).userCode("EMP2")
                .employeeProfile(EmployeeProfile.builder().fullName("Target User").profilePhoto(photo).build())
                .build();
        when(userRepository.findByIdWithProfile(adminId)).thenReturn(Optional.of(admin));
        when(userRepository.findByIdWithProfile(targetId)).thenReturn(Optional.of(target));
        when(roleAssignmentRepository.findRoleNamesByUserId(targetId)).thenReturn(List.of("Executive"));
        when(jwtTokenProvider.generateAccessToken(eq(targetId), anyList(), anyList())).thenReturn("target-access");
        when(jwtTokenProvider.generateRefreshToken(targetId)).thenReturn("target-refresh");
        var response = service.impersonateUser(adminId, targetId);
        assertEquals(targetId, response.getUserId());
        assertEquals("Target User", response.getFullName());
        assertEquals(List.of("Executive"), response.getRoles());
        assertEquals("target-access", response.getAccessToken());
        assertEquals("/media/" + photo.getId(), response.getProfilePhotoUrl());
        ArgumentCaptor<UserSession> session = ArgumentCaptor.forClass(UserSession.class);
        verify(sessionRepository).save(session.capture());
        assertSame(admin, session.getValue().getImpersonatedBy());
        assertSame(target, session.getValue().getUser());
        assertNotEquals("target-refresh", session.getValue().getRefreshToken());
    }

    @Test
    void attendanceCommitFailureDoesNotPreventLogin() {
        UUID id = UUID.randomUUID();
        User user = User.builder().id(id).userCode("EMP1").email("employee@example.test").build();
        when(userRepository.findByUserCodeAndDeletedAtIsNull("EMP1")).thenReturn(Optional.of(user));
        when(roleAssignmentRepository.findRoleNamesByUserId(id)).thenReturn(List.of("Executive"));
        when(jwtTokenProvider.generateAccessToken(eq(id), anyList(), anyList())).thenReturn("access");
        when(jwtTokenProvider.generateRefreshToken(id)).thenReturn("refresh");
        doThrow(new UnexpectedRollbackException("attendance commit failed"))
                .when(loginAttendanceService).ensureEmployee(eq(id), anyString(), anyList());
        LoginRequest request = new LoginRequest();
        request.setIdentifier("EMP1");
        request.setPassword("test-password");
        var response = service.login(request, "127.0.0.1", "test");
        assertEquals("access", response.getAccessToken());
        assertEquals(id, response.getUserId());
        verify(sessionRepository).save(any());
    }

    @Test
    void unknownIdentifierReturnsUnauthorizedWithoutCallingAuthenticationProvider() {
        LoginRequest request = new LoginRequest();
        request.setIdentifier("UNKNOWN");
        request.setPassword("test-password");
        var error = assertThrows(
                com.arrowdatatech.adt_production_report.common.exception.UnauthorizedException.class,
                () -> service.login(request, "127.0.0.1", "test"));
        assertEquals("Invalid credentials. Please check your email/ID and password.",
                error.getMessage());
        verifyNoInteractions(authenticationManager);
        verify(sessionRepository, never()).save(any());
    }

    @Test
    void activeProfileCanLoginWhenAuthFlagIsStaleInactive() {
        UUID id = UUID.randomUUID();
        User user = User.builder()
                .id(id)
                .userCode("EMP2")
                .email("employee2@example.test")
                .isActive(false)
                .employeeProfile(EmployeeProfile.builder()
                        .fullName("Employee Two")
                        .employeeStatus("Active")
                        .build())
                .build();
        when(userRepository.findByUserCodeAndDeletedAtIsNull("EMP2")).thenReturn(Optional.of(user));
        when(roleAssignmentRepository.findRoleNamesByUserId(id)).thenReturn(List.of("Executive"));
        when(jwtTokenProvider.generateAccessToken(eq(id), anyList(), anyList())).thenReturn("access");
        when(jwtTokenProvider.generateRefreshToken(id)).thenReturn("refresh");
        LoginRequest request = new LoginRequest();
        request.setIdentifier("EMP2");
        request.setPassword("test-password");
        var response = service.login(request, "127.0.0.1", "test");
        assertTrue(user.getIsActive());
        assertEquals("access", response.getAccessToken());
        verify(userRepository).saveAndFlush(user);
        verify(authenticationManager).authenticate(any());
    }

    @Test
    void nonActiveProfileCannotLoginEvenWhenAuthFlagIsActive() {
        UUID id = UUID.randomUUID();
        User user = User.builder()
                .id(id)
                .userCode("EMP3")
                .email("employee3@example.test")
                .isActive(true)
                .employeeProfile(EmployeeProfile.builder()
                        .fullName("Employee Three")
                        .employeeStatus("Inactive")
                        .build())
                .build();
        when(userRepository.findByUserCodeAndDeletedAtIsNull("EMP3")).thenReturn(Optional.of(user));
        LoginRequest request = new LoginRequest();
        request.setIdentifier("EMP3");
        request.setPassword("test-password");
        var error = assertThrows(
                com.arrowdatatech.adt_production_report.common.exception.UnauthorizedException.class,
                () -> service.login(request, "127.0.0.1", "test"));
        assertEquals("Account is Inactive. Contact your administrator.", error.getMessage());
        assertFalse(user.getIsActive());
        verify(userRepository).saveAndFlush(user);
        verifyNoInteractions(authenticationManager);
        verify(sessionRepository, never()).save(any());
    }
}
