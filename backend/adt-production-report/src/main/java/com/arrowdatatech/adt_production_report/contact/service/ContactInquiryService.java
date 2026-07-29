package com.arrowdatatech.adt_production_report.contact.service;

import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.contact.dto.ContactInquiryRequest;
import com.arrowdatatech.adt_production_report.contact.dto.ContactInquiryResponse;
import com.arrowdatatech.adt_production_report.contact.entity.ContactInquiry;
import com.arrowdatatech.adt_production_report.contact.repository.ContactInquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactInquiryService {

    private final ContactInquiryRepository repo;

    @Transactional
    public ContactInquiryResponse submit(ContactInquiryRequest req) {
        ContactInquiry entity = ContactInquiry.builder()
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .company(req.getCompany())
                .service(req.getService())
                .message(req.getMessage())
                .status("NEW")
                .build();
        return ContactInquiryResponse.from(repo.save(entity));
    }

    @Transactional(readOnly = true)
    public List<ContactInquiryResponse> getAll(String status) {
        List<ContactInquiry> list = (status != null && !status.isBlank())
                ? repo.findByStatusOrderByCreatedAtDesc(status.toUpperCase())
                : repo.findAllByOrderByCreatedAtDesc();
        return list.stream().map(ContactInquiryResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public ContactInquiryResponse updateStatus(UUID id, String status) {
        ContactInquiry entity = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ContactInquiry", "id", id));
        entity.setStatus(status.toUpperCase());
        return ContactInquiryResponse.from(repo.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("ContactInquiry", "id", id);
        }
        repo.deleteById(id);
    }
}
