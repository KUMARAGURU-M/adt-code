package com.arrowdatatech.adt_production_report.invoice.service;

import com.arrowdatatech.adt_production_report.client.entity.Client;
import com.arrowdatatech.adt_production_report.client.repository.ClientRepository;
import com.arrowdatatech.adt_production_report.common.exception.BadRequestException;
import com.arrowdatatech.adt_production_report.common.exception.ResourceNotFoundException;
import com.arrowdatatech.adt_production_report.common.util.SecurityUtils;
import com.arrowdatatech.adt_production_report.invoice.dto.*;
import com.arrowdatatech.adt_production_report.invoice.entity.BankAccount;
import com.arrowdatatech.adt_production_report.invoice.entity.Invoice;
import com.arrowdatatech.adt_production_report.invoice.entity.InvoiceLineItem;
import com.arrowdatatech.adt_production_report.invoice.repository.BankAccountRepository;
import com.arrowdatatech.adt_production_report.invoice.repository.InvoiceLineItemRepository;
import com.arrowdatatech.adt_production_report.invoice.repository.InvoiceRepository;
import com.arrowdatatech.adt_production_report.job.entity.Job;
import com.arrowdatatech.adt_production_report.job.repository.JobRepository;
import com.arrowdatatech.adt_production_report.process.entity.Process;
import com.arrowdatatech.adt_production_report.process.repository.ProcessRepository;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.repository.ProjectRepository;
import com.arrowdatatech.adt_production_report.settings.entity.CompanySettings;
import com.arrowdatatech.adt_production_report.settings.repository.CompanySettingsRepository;
import com.arrowdatatech.adt_production_report.user.entity.User;
import com.arrowdatatech.adt_production_report.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineItemRepository invoiceLineItemRepository;
    private final ClientRepository clientRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ProjectRepository projectRepository;
    private final ProcessRepository processRepository;
    private final JobRepository jobRepository;
    private final CompanySettingsRepository companySettingsRepository;
    private final UserRepository userRepository;

    private static final String[] ONES = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"};
    private static final String[] TENS = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};

    private static String convert(long n) {
        if (n < 20) return ONES[(int) n];
        if (n < 100) return TENS[(int) (n / 10)] + (n % 10 != 0 ? " " + ONES[(int) (n % 10)] : "");
        return ONES[(int) (n / 100)] + " Hundred" + (n % 100 != 0 ? " " + convert(n % 100) : "");
    }

    public static String numberToWords(BigDecimal number) {
        if (number == null || number.compareTo(BigDecimal.ZERO) == 0) {
            return "Zero Rupees Only";
        }
        long x = Math.abs(number.setScale(0, RoundingMode.HALF_UP).longValue());
        StringBuilder r = new StringBuilder();
        long cr = x / 10000000; x %= 10000000;
        long lk = x / 100000; x %= 100000;
        long th = x / 1000; x %= 1000;
        if (cr > 0) r.append(convert(cr)).append(" Crore ");
        if (lk > 0) r.append(convert(lk)).append(" Lakh ");
        if (th > 0) r.append(convert(th)).append(" Thousand ");
        if (x > 0) r.append(convert(x));
        return r.toString().trim() + " Rupees Only";
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getInvoices(UUID clientId, String paymentStatus, Integer year, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return invoiceRepository.filterInvoices(clientId, paymentStatus, year, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceSummaryResponse getInvoiceSummary(UUID clientId) {
        Object[] totals = invoiceRepository.getInvoiceSummaryTotals(clientId);
        BigDecimal totalInvoiced = BigDecimal.ZERO;
        BigDecimal totalReceived = BigDecimal.ZERO;
        BigDecimal outstanding = BigDecimal.ZERO;
        Long count = 0L;

        if (totals != null && totals.length > 0 && totals[0] != null) {
            Object[] row = (Object[]) totals[0];
            totalInvoiced = row[0] != null ? (BigDecimal) row[0] : BigDecimal.ZERO;
            totalReceived = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            outstanding = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            count = row[3] != null ? (Long) row[3] : 0L;
        }

        return InvoiceSummaryResponse.builder()
                .totalInvoiced(totalInvoiced)
                .totalReceived(totalReceived)
                .outstandingAmount(outstanding)
                .invoiceCount(count)
                .build();
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        BankAccount bank = null;
        if (request.getBankAccountId() != null) {
            bank = bankAccountRepository.findById(request.getBankAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("BankAccount", "id", request.getBankAccountId()));
        }

        // Fetch vendor settings snapshot
        CompanySettings settings = companySettingsRepository.findByIsSingletonTrue().orElse(null);
        String vendorName = settings != null ? settings.getCompanyName() : "Arrow Data Tech";
        String vendorAddress = settings != null ? formatAddress(settings) : "";
        String vendorPan = "AWXPM3024B"; // Default pan
        String vendorGstin = "";

        LocalDate invDate = request.getInvoiceDate() != null ? request.getInvoiceDate() : LocalDate.now();
        int year = invDate.getYear();

        // Sequential invoice number ADT-YYYY-XXXX
        Integer maxSeq = invoiceRepository.findMaxInvoiceSequenceForYear(year);
        int nextSeq = maxSeq + 1;
        String invoiceNumber = String.format("ADT-%d-%04d", year, nextSeq);

        User currentUser = getCurrentUserOrNull();

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .client(client)
                .vendorName(vendorName)
                .vendorAddress(vendorAddress)
                .vendorPan(vendorPan)
                .vendorGstin(vendorGstin)
                .invoiceDate(invDate)
                .invoiceTitle(request.getInvoiceTitle())
                .periodMonth(request.getPeriodMonth())
                .periodYear(request.getPeriodYear())
                .gstPercentage(request.getGstPercentage() != null ? request.getGstPercentage() : BigDecimal.ZERO)
                .bankAccount(bank)
                .paymentStatus("Pending")
                .totalReceived(BigDecimal.ZERO)
                .columnConfig(request.getColumnConfig())
                .letterPadEnabled(request.getLetterPadEnabled() != null ? request.getLetterPadEnabled() : false)
                .showSignature(request.getShowSignature() != null ? request.getShowSignature() : true)
                .showQr(request.getShowQr() != null ? request.getShowQr() : true)
                .createdBy(currentUser)
                .updatedAt(OffsetDateTime.now())
                .build();

        Set<InvoiceLineItem> lineItems = new HashSet<>();
        BigDecimal subTotal = BigDecimal.ZERO;

        if (request.getLineItems() == null || request.getLineItems().isEmpty()) {
            throw new BadRequestException("Invoice must have at least one line item.");
        }

        for (CreateInvoiceRequest.LineItemRequest itemReq : request.getLineItems()) {
            Project project = null;
            if (itemReq.getProjectId() != null) {
                project = projectRepository.findById(itemReq.getProjectId()).orElse(null);
            }

            Process process = null;
            if (itemReq.getProcessId() != null) {
                process = processRepository.findById(itemReq.getProcessId()).orElse(null);
            }

            Job job = null;
            if (itemReq.getJobId() != null) {
                job = jobRepository.findById(itemReq.getJobId()).orElse(null);
            }

            int pages = itemReq.getPages() != null ? itemReq.getPages() : 0;
            BigDecimal rate = itemReq.getRatePerPage() != null ? itemReq.getRatePerPage() : BigDecimal.ZERO;
            BigDecimal amount = rate.multiply(BigDecimal.valueOf(pages));
            BigDecimal deduction = itemReq.getDeduction() != null ? itemReq.getDeduction() : BigDecimal.ZERO;
            BigDecimal total = amount.subtract(deduction);

            subTotal = subTotal.add(total);

            InvoiceLineItem item = InvoiceLineItem.builder()
                    .invoice(invoice)
                    .sno(itemReq.getSno())
                    .project(project)
                    .process(process)
                    .job(job)
                    .batchName(itemReq.getBatchName())
                    .pages(pages)
                    .ratePerPage(rate)
                    .amount(amount)
                    .deduction(deduction)
                    .total(total)
                    .uploadedDate(itemReq.getUploadedDate())
                    .startDate(itemReq.getStartDate())
                    .endDate(itemReq.getEndDate())
                    .build();

            lineItems.add(item);

            // Update linked Job status to INVOICED
            if (job != null) {
                job.setBillingStatus("INVOICED");
                jobRepository.save(job);
                log.info("Job {} billing status updated to INVOICED", job.getJobIdCode());
            }
        }

        BigDecimal gstPct = request.getGstPercentage() != null ? request.getGstPercentage() : BigDecimal.ZERO;
        BigDecimal gstAmount = subTotal.multiply(gstPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = subTotal.add(gstAmount);

        invoice.setLineItems(lineItems);
        invoice.setSubTotal(subTotal);
        invoice.setGstAmount(gstAmount);
        invoice.setGrandTotal(grandTotal);
        invoice.setAmountInWords(numberToWords(grandTotal));

        invoice = invoiceRepository.save(invoice);
        log.info("Invoice {} generated successfully", invoice.getInvoiceNumber());
        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse updatePaymentStatus(UUID id, String status, BigDecimal totalReceived) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        List<String> validStatuses = List.of("Pending", "Paid", "Overdue", "Partially Paid");
        if (!validStatuses.contains(status)) {
            throw new BadRequestException("Invalid payment status. Valid options: Pending, Paid, Overdue, Partially Paid");
        }

        invoice.setPaymentStatus(status);
        if (totalReceived != null) {
            invoice.setTotalReceived(totalReceived);
        }
        invoice.setUpdatedAt(OffsetDateTime.now());

        invoice = invoiceRepository.save(invoice);
        log.info("Invoice {} payment status updated to {}", invoice.getInvoiceNumber(), status);
        return toResponse(invoice);
    }

    @Transactional
    public void deleteInvoice(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        // Revert linked jobs status to PENDING
        for (InvoiceLineItem item : invoice.getLineItems()) {
            if (item.getJob() != null) {
                Job job = item.getJob();
                job.setBillingStatus("PENDING");
                jobRepository.save(job);
                log.info("Job {} billing status reverted to PENDING due to invoice deletion", job.getJobIdCode());
            }
        }

        // Soft delete
        invoice.setDeletedAt(OffsetDateTime.now());
        invoice.setUpdatedAt(OffsetDateTime.now());
        invoiceRepository.save(invoice);
        log.info("Invoice {} soft-deleted", invoice.getInvoiceNumber());
    }

    private User getCurrentUserOrNull() {
        try {
            UUID uid = SecurityUtils.getCurrentUserId();
            return userRepository.findById(uid).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private String formatAddress(CompanySettings s) {
        List<String> parts = new ArrayList<>();
        if (s.getStreetAddress() != null) parts.add(s.getStreetAddress());
        if (s.getCity() != null) parts.add(s.getCity());
        if (s.getState() != null) parts.add(s.getState());
        if (s.getCountry() != null) {
            String countryZip = s.getCountry();
            if (s.getZipCode() != null) {
                countryZip += " - " + s.getZipCode();
            }
            parts.add(countryZip);
        }
        return String.join(", ", parts);
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        List<InvoiceResponse.LineItemResponse> items = invoice.getLineItems().stream()
                .map(item -> InvoiceResponse.LineItemResponse.builder()
                        .id(item.getId())
                        .sno(item.getSno())
                        .projectName(item.getProject() != null ? item.getProject().getName() : null)
                        .processName(item.getProcess() != null ? item.getProcess().getName() : null)
                        .batchName(item.getBatchName())
                        .pages(item.getPages())
                        .ratePerPage(item.getRatePerPage())
                        .amount(item.getAmount())
                        .deduction(item.getDeduction())
                        .total(item.getTotal())
                        .uploadedDate(item.getUploadedDate())
                        .startDate(item.getStartDate())
                        .endDate(item.getEndDate())
                        .language(item.getJob() != null ? item.getJob().getLanguage() : null)
                        .build())
                .sorted(Comparator.comparing(InvoiceResponse.LineItemResponse::getSno))
                .collect(Collectors.toList());

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .clientId(invoice.getClient().getId())
                .clientName(invoice.getClient().getCompanyName())
                .clientAddress(formatClientAddress(invoice.getClient()))
                .clientPan(invoice.getClient().getPanNumber())
                .clientGstin(invoice.getClient().getGstin())
                .vendorName(invoice.getVendorName())
                .vendorAddress(invoice.getVendorAddress())
                .vendorPan(invoice.getVendorPan())
                .vendorGstin(invoice.getVendorGstin())
                .invoiceDate(invoice.getInvoiceDate())
                .invoiceTitle(invoice.getInvoiceTitle())
                .periodMonth(invoice.getPeriodMonth())
                .periodYear(invoice.getPeriodYear())
                .subTotal(invoice.getSubTotal())
                .gstPercentage(invoice.getGstPercentage())
                .gstAmount(invoice.getGstAmount())
                .grandTotal(invoice.getGrandTotal())
                .amountInWords(invoice.getAmountInWords())
                .paymentStatus(invoice.getPaymentStatus())
                .totalReceived(invoice.getTotalReceived())
                .bankAccountId(invoice.getBankAccount() != null ? invoice.getBankAccount().getId() : null)
                .columnConfig(invoice.getColumnConfig())
                .letterPadEnabled(invoice.getLetterPadEnabled())
                .showSignature(invoice.getShowSignature())
                .showQr(invoice.getShowQr())
                .createdAt(invoice.getCreatedAt())
                .lineItems(items)
                .build();
    }

    private String formatClientAddress(Client c) {
        List<String> parts = new ArrayList<>();
        if (c.getAddressLine1() != null) parts.add(c.getAddressLine1());
        if (c.getAddressLine2() != null) parts.add(c.getAddressLine2());
        if (c.getCity() != null) parts.add(c.getCity());
        if (c.getState() != null) parts.add(c.getState());
        if (c.getCountry() != null) {
            String countryZip = c.getCountry();
            if (c.getPinCode() != null) {
                countryZip += " - " + c.getPinCode();
            }
            parts.add(countryZip);
        }
        return String.join(", ", parts);
    }
}
