package com.arrowdatatech.adt_production_report.careerapp.repository;

import com.arrowdatatech.adt_production_report.careerapp.entity.CareerApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CareerApplicationRepository extends JpaRepository<CareerApplication, UUID> {
    List<CareerApplication> findAllByOrderByCreatedAtDesc();
    List<CareerApplication> findByStatusOrderByCreatedAtDesc(String status);
}
