package com.arrowdatatech.adt_production_report.client.repository;

import com.arrowdatatech.adt_production_report.client.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {

    Optional<Client> findByCompanyName(String companyName);

    boolean existsByCompanyName(String companyName);

    // Active clients for Invoice To dropdown
    List<Client> findByIsActiveTrueOrderByCompanyNameAsc();
}