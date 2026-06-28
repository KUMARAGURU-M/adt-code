package com.arrowdatatech.adt_production_report.client.controller;

import com.arrowdatatech.adt_production_report.client.dto.ClientResponse;
import com.arrowdatatech.adt_production_report.client.dto.CreateClientRequest;
import com.arrowdatatech.adt_production_report.client.entity.Client;
import com.arrowdatatech.adt_production_report.client.repository.ClientRepository;
import com.arrowdatatech.adt_production_report.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientRepository clientRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClientResponse>>> getAllClients() {
        List<ClientResponse> clients = clientRepository
                .findByIsActiveTrueOrderByCompanyNameAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Clients retrieved", clients));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> getById(
            @PathVariable UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new com.arrowdatatech.adt_production_report.common.exception
                        .ResourceNotFoundException("Client", "id", id));
        return ResponseEntity.ok(
                ApiResponse.success("Client retrieved", toResponse(client)));
    }

    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<ClientResponse>> createClient(
            @Valid @RequestBody CreateClientRequest request) {
        if (clientRepository.existsByCompanyName(request.getCompanyName())) {
            throw new com.arrowdatatech.adt_production_report.common.exception
                    .BadRequestException("Client already exists.");
        }
        Client client = new Client();
        client.setCompanyName(request.getCompanyName());
        client.setAddressLine1(request.getAddressLine1());
        client.setAddressLine2(request.getAddressLine2());
        client.setCity(request.getCity());
        client.setState(request.getState());
        client.setCountry(request.getCountry());
        client.setPinCode(request.getPinCode());
        client.setPanNumber(request.getPanNumber());
        client.setGstin(request.getGstin());
        client.setContactEmail(request.getContactEmail());
        client.setContactPhone(request.getContactPhone());
        client.setIsActive(true);
//        client.setUpdatedAt(OffsetDateTime.now());
        client = clientRepository.save(client);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Client created", toResponse(client)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<ClientResponse>> updateClient(
            @PathVariable UUID id,
            @Valid @RequestBody CreateClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new com.arrowdatatech.adt_production_report.common.exception
                        .ResourceNotFoundException("Client", "id", id));
        client.setCompanyName(request.getCompanyName());
        client.setAddressLine1(request.getAddressLine1());
        client.setCity(request.getCity());
        client.setState(request.getState());
        client.setCountry(request.getCountry());
        client.setPinCode(request.getPinCode());
        client.setPanNumber(request.getPanNumber());
        client.setGstin(request.getGstin());
        client.setContactEmail(request.getContactEmail());
        client.setContactPhone(request.getContactPhone());
        if (request.getIsActive() != null) {
            client.setIsActive(request.getIsActive());
        }
//        client.setUpdatedAt(OffsetDateTime.now());
        clientRepository.save(client);
        return ResponseEntity.ok(
                ApiResponse.success("Client updated", toResponse(client)));
    }

    private ClientResponse toResponse(Client c) {
        return ClientResponse.builder()
                .id(c.getId())
                .companyName(c.getCompanyName())
                .addressLine1(c.getAddressLine1())
                .addressLine2(c.getAddressLine2())
                .city(c.getCity())
                .state(c.getState())
                .country(c.getCountry())
                .pinCode(c.getPinCode())
                .panNumber(c.getPanNumber())
                .gstin(c.getGstin())
                .contactEmail(c.getContactEmail())
                .contactPhone(c.getContactPhone())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}