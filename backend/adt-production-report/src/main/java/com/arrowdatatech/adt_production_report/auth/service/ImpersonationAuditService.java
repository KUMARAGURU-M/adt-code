package com.arrowdatatech.adt_production_report.auth.service;

import com.arrowdatatech.adt_production_report.auth.entity.ImpersonationLog;
import com.arrowdatatech.adt_production_report.auth.repository.ImpersonationLogRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImpersonationAuditService {

    private final ImpersonationLogRepository impersonationLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 3)
    public void logStarted(User admin, User targetUser) {
        ImpersonationLog impLog = ImpersonationLog.builder()
                .admin(admin)
                .targetUser(targetUser)
                .startedAt(OffsetDateTime.now())
                .build();
        impersonationLogRepository.save(impLog);
    }
}
