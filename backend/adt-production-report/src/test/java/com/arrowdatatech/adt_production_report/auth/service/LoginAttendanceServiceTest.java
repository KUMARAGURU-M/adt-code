package com.arrowdatatech.adt_production_report.auth.service;

import com.arrowdatatech.adt_production_report.attendance.entity.AttendanceEmployee;
import com.arrowdatatech.adt_production_report.attendance.repository.AttendanceEmployeeRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LoginAttendanceServiceTest {
    private final AttendanceEmployeeRepository repository = mock(AttendanceEmployeeRepository.class);
    private final LoginAttendanceService service = new LoginAttendanceService(repository);

    @Test
    void doesNotTakeLinkedOrPartialNameMatches() {
        UUID owner = UUID.randomUUID();
        AttendanceEmployee linked = AttendanceEmployee.builder().name("Alex").userId(owner).build();
        AttendanceEmployee partial = AttendanceEmployee.builder().name("Alex Smith").build();
        when(repository.searchEmployees(null, "Alex")).thenReturn(List.of(linked, partial));
        UUID userId = UUID.randomUUID();
        service.ensureEmployee(userId, " Alex ", List.of("Executive"));
        ArgumentCaptor<AttendanceEmployee> saved = ArgumentCaptor.forClass(AttendanceEmployee.class);
        verify(repository).save(saved.capture());
        assertEquals(owner, linked.getUserId());
        assertNull(partial.getUserId());
        assertEquals(userId, saved.getValue().getUserId());
        assertNotSame(linked, saved.getValue());
        assertNotSame(partial, saved.getValue());
    }

    @Test
    void linksSingleExactUnassignedMatch() {
        AttendanceEmployee match = AttendanceEmployee.builder().name("Alex").build();
        when(repository.searchEmployees(null, "Alex")).thenReturn(List.of(match));
        UUID userId = UUID.randomUUID();
        service.ensureEmployee(userId, "Alex", List.of("Executive"));
        verify(repository).save(match);
        assertEquals(userId, match.getUserId());
    }

    @Test
    void doesNotGuessBetweenDuplicateNames() {
        AttendanceEmployee first = AttendanceEmployee.builder().name("Alex").build();
        AttendanceEmployee second = AttendanceEmployee.builder().name("Alex").build();
        when(repository.searchEmployees(null, "Alex")).thenReturn(List.of(first, second));
        service.ensureEmployee(UUID.randomUUID(), "Alex", List.of());
        assertNull(first.getUserId());
        assertNull(second.getUserId());
        verify(repository).save(argThat(employee -> employee != first && employee != second));
    }
}
