package com.arrowdatatech.adt_production_report;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
@SpringBootApplication
@EnableScheduling
public class AdtProductionReportApplication {

	public static void main(String[] args) {
		SpringApplication.run(AdtProductionReportApplication.class, args);
	}
}