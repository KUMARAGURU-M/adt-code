package com.arrowdatatech.adt_production_report.invoice.repository;

import com.arrowdatatech.adt_production_report.invoice.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, UUID> {

    List<BankAccount> findByIsActiveTrueOrderByLabel();

    boolean existsByAccountNumber(String accountNumber);
}