// ============================================================
// Invoice.js — Arrow Data Tech Invoice Generation v5
// Changes from v4:
//  1. Header: replaced Preview + Export PDF with History button
//  2. History section: full invoice history panel with dummy data
//  3. Signature fix: toggling off hides image only; name + designation always show
//  4. Invoice table: fully flexible, dynamic borders matching Image exactly
//  5. Export alignment fixed: all table borders consistent
// ============================================================
import React, { useState, useRef, useEffect } from "react";
import "./Invoice.css";
import sign from "../../assets/images/sign.png";
import letterpad from "../../assets/images/letterpad.png";
import html2canvas from "html2canvas";
import apiCall, { API_BASE } from "../../utils/api";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: 10 }, (_, i) => 2024 + i);

const PROCESS_OPTIONS = ["All Processes", "EPUB - QC Process", "EPUB - Tagging", "FIG - Croping", "INDEX - Process", "MATH - Keying", "OCR - Process", "Proof Reading - Process", "REF - Process", "TABLE - Process", "VALID - Process", "WORD - QC Process", "WORD - Styling", "XML - QC Process", "XML - Tagging"];
const COMPLEXITY_OPTIONS = ["All", "Simple", "Medium", "Complex", "Heavy Complex"];
const FILE_STATUS_OPTIONS = ["All", "Uploaded", "RTU", "Hold", "Query"];

const PROCESS_RATES = {
  "EPUB - QC Process": 4, "EPUB - Tagging": 6, "FIG - Croping": 3,
  "INDEX - Process": 5, "MATH - Keying": 8, "OCR - Process": 4,
  "Proof Reading - Process": 5, "REF - Process": 4, "TABLE - Process": 7,
  "VALID - Process": 3, "WORD - QC Process": 4, "WORD - Styling": 5,
  "XML - QC Process": 5, "XML - Tagging": 7,
};

const getComplexityClass = (v) => {
  if (!v || v === "All") return "";
  const s = v.toLowerCase().replace(/\s+/g, "");
  if (s.includes("heavycomplex")) return "complexity-heavycomplex";
  if (s.includes("complex")) return "complexity-complex";
  if (s.includes("medium")) return "complexity-medium";
  if (s.includes("simple")) return "complexity-simple";
  return "";
};

const OPTIONAL_COLUMNS = [
  { key: "projectName", label: "Project Name" },
  { key: "workflow", label: "Task Name" },
  { key: "process", label: "Process" },
  { key: "bookBatchName", label: "Book/Batch/Article Name" },
  { key: "orderPages", label: "Pages" },
  { key: "ratePage", label: "Rate/Page" },
  { key: "receivedDate", label: "Received Date" },
  { key: "jobId", label: "Job ID" },
  { key: "titleName", label: "Title Name" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "xmlIsbn", label: "XML ISBN" },
  { key: "language", label: "Language" },
  { key: "chapters", label: "No. of Chapters" },
  { key: "pdfInputType", label: "Input Type" },
  { key: "complexity", label: "Complexity" },
  { key: "diffLevel", label: "Diff Level" },
  { key: "lob", label: "LOB" },
  { key: "referenceType", label: "Reference Type" },
  { key: "fileStatus", label: "File Status" },
  { key: "uploadedDate", label: "Uploaded Date" },
  { key: "billingStatus", label: "Billing Status" },
  { key: "articleCount", label: "Article Count" },
];

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function numberToWords(num) {
  if (!num || num === 0) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
  }
  let r = "", x = Math.abs(Math.round(num));
  const cr = Math.floor(x / 10000000); x %= 10000000;
  const lk = Math.floor(x / 100000); x %= 100000;
  const th = Math.floor(x / 1000); x %= 1000;
  if (cr) r += convert(cr) + " Crore ";
  if (lk) r += convert(lk) + " Lakh ";
  if (th) r += convert(th) + " Thousand ";
  if (x) r += convert(x);
  return r.trim() + " Rupees Only";
}

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().split("T")[0];
const genInvNo = () => { const d = new Date(); return `ADT-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`; };
const formatDate = (s) => {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return s;
  }
};

const EMPTY_ROW = (o = {}) => ({
  id: Date.now() + Math.random(),
  projectName: "", workflow: "", workflowId: "", process: "", bookBatchName: "",
  receivedDate: "", jobId: "", titleName: "", pageCount: "",
  startDate: "", endDate: "", xmlIsbn: "", chapters: "",
  pdfInputType: "", complexity: "", referenceType: "",
  diffLevel: "", lob: "Service",
  fileStatus: "", uploadedDate: "", billingStatus: "",
  articleCount: "", language: "",
  orderPages: "", ratePage: "", amount: "", deductionAmount: "", totalAmount: "",
  ...o,
});

// ─────────────────────────────────────────────────────────────
// TOGGLE COMPONENT
// ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <label className="inv-toggle-wrap">
      <div className={`inv-toggle ${checked ? "inv-toggle--on" : ""}`} onClick={() => onChange(!checked)}>
        <div className="inv-toggle-knob" />
      </div>
      {label && <span className="inv-toggle-label">{label}</span>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// HISTORY SECTION COMPONENT
// ─────────────────────────────────────────────────────────────
function HistorySection({ onClose, historyList = [], summary = {}, onDelete, onUpdatePayment, onRehydrate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = (historyList || []).filter(h => {
    const matchSearch = (h.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.periodMonth || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "All" || h.paymentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalInvoiced = summary.totalInvoiced || 0;
  const totalPaid = summary.totalReceived || 0;
  const totalPending = summary.outstandingAmount || 0;

  return (
    <div className="inv-history-panel">
      {/* Header */}
      <div className="inv-history-header">
        <div className="inv-history-title-row">
          <div className="inv-history-title-group">
            <span className="inv-history-icon">📜</span>
            <div>
              <h2 className="inv-history-title">Invoice History</h2>
              <p className="inv-history-sub">{(historyList || []).length} invoices generated</p>
            </div>
          </div>
          <button className="inv-btn inv-btn--outline inv-btn--sm" onClick={onClose}>✕ Close History</button>
        </div>

        {/* Summary Cards */}
        <div className="inv-history-summary">
          <div className="inv-hist-stat inv-hist-stat--total">
            <span className="inv-hist-stat-icon">📊</span>
            <div>
              <div className="inv-hist-stat-label">Total Invoiced</div>
              <div className="inv-hist-stat-value">{fmt(totalInvoiced)}</div>
            </div>
          </div>
          <div className="inv-hist-stat inv-hist-stat--paid">
            <span className="inv-hist-stat-icon">✅</span>
            <div>
              <div className="inv-hist-stat-label">Total Received</div>
              <div className="inv-hist-stat-value">{fmt(totalPaid)}</div>
            </div>
          </div>
          <div className="inv-hist-stat inv-hist-stat--pending">
            <span className="inv-hist-stat-icon">⏳</span>
            <div>
              <div className="inv-hist-stat-label">Outstanding</div>
              <div className="inv-hist-stat-value">{fmt(totalPending)}</div>
            </div>
          </div>
          <div className="inv-hist-stat inv-hist-stat--count">
            <span className="inv-hist-stat-icon">🧾</span>
            <div>
              <div className="inv-hist-stat-label">Invoices</div>
              <div className="inv-hist-stat-value">{(historyList || []).length}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="inv-history-filters">
          <input
            className="inv-input inv-history-search"
            placeholder="🔍  Search by invoice no., client, or month..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="inv-history-status-tabs">
            {["All", "Paid", "Pending", "Overdue", "Partially Paid"].map(s => (
              <button
                key={s}
                className={`inv-hist-tab ${statusFilter === s ? "inv-hist-tab--active" : ""} inv-hist-tab--${s.toLowerCase().replace(/\s+/g, "")}`}
                onClick={() => setStatusFilter(s)}
              >{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="inv-history-list">
        {filtered.length === 0 ? (
          <div className="inv-history-empty">📭 No invoices match your search.</div>
        ) : (
          filtered.map(h => (
            <div key={h.id} className={`inv-hist-item ${expandedId === h.id ? "inv-hist-item--expanded" : ""}`}>
              <div className="inv-hist-item-header" onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}>
                <div className="inv-hist-item-left">
                  <div className="inv-hist-item-no">{h.invoiceNumber}</div>
                  <div className="inv-hist-item-client">{h.clientName}</div>
                  <div className="inv-hist-item-period">📅 {h.periodMonth} {h.periodYear} &nbsp;·&nbsp; {h.lineItems?.length || 0} line{h.lineItems?.length !== 1 ? "s" : ""} &nbsp;·&nbsp; {h.invoiceDate}</div>
                </div>
                <div className="inv-hist-item-right" onClick={e => e.stopPropagation()}>
                  <div className="inv-hist-item-amount">{fmt(h.grandTotal)}</div>
                  <select
                    className={`inv-hist-status-select inv-hist-status--${(h.paymentStatus || "").toLowerCase().replace(/\s+/g, "")}`}
                    value={h.paymentStatus}
                    style={{ marginRight: "10px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", background: "#fff", fontWeight: "600" }}
                    onChange={e => onUpdatePayment(h.id, e.target.value, h.grandTotal)}
                  >
                    {["Pending", "Paid", "Overdue", "Partially Paid"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span className="inv-hist-chevron" style={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}>{expandedId === h.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {expandedId === h.id && (
                <div className="inv-hist-item-detail">
                  <table className="inv-hist-detail-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Project</th>
                        <th>Process</th>
                        <th>Pages</th>
                        <th>Rate/Page</th>
                        <th>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(h.lineItems || []).map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{item.projectName}</td>
                          <td>{item.processName}</td>
                          <td>{item.pages}</td>
                          <td>₹{item.ratePerPage}</td>
                          <td className="inv-hist-detail-total">₹{(item.total || 0).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5} style={{ textAlign: "right", fontWeight: 700 }}>Grand Total</td>
                        <td className="inv-hist-detail-total inv-hist-grand">{fmt(h.grandTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="inv-hist-detail-actions" style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                    <button className="inv-btn inv-btn--outline inv-btn--sm" onClick={() => onRehydrate(h)}>👁 Re-preview</button>
                    <button className="inv-btn inv-btn--secondary inv-btn--sm" style={{ backgroundColor: "#ef4444", color: "#fff" }} onClick={() => onDelete(h.id)}>✕ Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Invoice() {

  // rowId + field identify which cell is open; rect gives the anchor for fixed positioning
  const [activeDropdown, setActiveDropdown] = useState({ rowId: null, field: null, rect: null });


  // Close dropdown on outside click or scroll, but NOT when interacting inside the dropdown itself
  useEffect(() => {
    const onMouseDown = (e) => {
      // Ignore clicks that happen inside a multiselect box or its floating dropdown
      if (e.target.closest(".inv-multiselect-box") || e.target.closest(".inv-multiselect-dropdown")) return;
      setActiveDropdown({ rowId: null, field: null, rect: null });
    };
    const onScroll = (e) => {
      // Ignore scroll that happens inside the dropdown list itself
      if (e.target && e.target.closest && e.target.closest(".inv-multiselect-dropdown")) return;
      setActiveDropdown({ rowId: null, field: null, rect: null });
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const openDropdown = (e, rowId, field) => {
    e.stopPropagation();
    const rect = e.currentTarget.closest(".inv-multiselect-box").getBoundingClientRect();
    setActiveDropdown({ rowId, field, rect });
  };

  const closeDropdown = () => setActiveDropdown({ rowId: null, field: null, rect: null });

  const toggleListItem = (currentVal, itemToToggle) => {
    const items = currentVal ? currentVal.split(",").map(s => s.trim()).filter(Boolean) : [];
    let newItems;
    if (items.includes(itemToToggle)) {
      newItems = items.filter(x => x !== itemToToggle);
    } else {
      newItems = [...items, itemToToggle];
    }
    return newItems.join(", ");
  };

  // ── Invoice Details ─────────────────────────────────────
  const [vendorName, setVendorName] = useState("Arrow Data Tech");
  const [vendorAddress, setVendorAddress] = useState("");
  const [invoiceNo, setInvoiceNo] = useState(genInvNo());
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [panNo, setPanNo] = useState("AWXPM3024B");
  const [gstinNo, setGstinNo] = useState("");

  // ── Client ──────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientModalMode, setClientModalMode] = useState("edit");
  const [clientDraft, setClientDraft] = useState({ id: "", name: "", address: "" });
  const currentClient = clients.find(c => c.id === selectedClientId) || null;
  const [clientName, setClientName] = useState("");

  // ── Client Projects and Unbilled Jobs ───────────────────
  const [clientProjects, setClientProjects] = useState([]);
  const [projectChoices, setProjectChoices] = useState(["All Projects"]);
  const [unbilledJobs, setUnbilledJobs] = useState([]);
  const [projectRates, setProjectRates] = useState({});
  const [processes, setProcesses] = useState([]);
  const [workflows, setWorkflows] = useState([]);

  // ── Invoice Title ────────────────────────────────────────
  const [titleMonth, setTitleMonth] = useState(MONTHS[new Date().getMonth()]);
  const [titleYear, setTitleYear] = useState(new Date().getFullYear());

  // ── Column Config ────────────────────────────────────────
  const [activeCols, setActiveCols] = useState(["projectName", "workflow", "process", "bookBatchName", "orderPages", "ratePage"]);
  const [colHeaders, setColHeaders] = useState(() =>
    OPTIONAL_COLUMNS.reduce((acc, c) => { acc[c.key] = c.label; return acc; }, {})
  );
  const [showQr, setShowQr] = useState(true);
  const [showSignature, setShowSignature] = useState(true);

  // ── Rows ─────────────────────────────────────────────────
  const [rows, setRows] = useState([EMPTY_ROW(), EMPTY_ROW()]);

  // ── Project Filters ──────────────────────────────────────
  const [filterProject, setFilterProject] = useState("All Projects");
  const [filterWorkflow, setFilterWorkflow] = useState("All Task Names");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterComplexity, setFilterComplexity] = useState("All");
  const [filterFileStatus, setFilterFileStatus] = useState("All");
  const [selectedDPIds, setSelectedDPIds] = useState(new Set());

  // ── Tax ──────────────────────────────────────────────────
  const [igstPct, setIgstPct] = useState(0);

  // ── Bank Details ─────────────────────────────────────────
  const [bankData, setBankData] = useState({});
  const [bankKey, setBankKey] = useState("");
  const [editingBank, setEditingBank] = useState(false);
  const [bankDraft, setBankDraft] = useState({});
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBankDraft, setNewBankDraft] = useState({ label: "", acNo: "", bankName: "", branch: "", ifsc: "", type: "Current", nameOnAccount: "ARROW DATA-TECH", gpay: "", qrImage: "" });

  // ── History ──────────────────────────────────────────────
  const [historyList, setHistoryList] = useState([]);
  const [historySummary, setHistorySummary] = useState({});

  // ── QR Code ──────────────────────────────────────────────
  const qrInputRef = useRef(null);

  // ── Signature ────────────────────────────────────────────
  const [sigName, setSigName] = useState("T. Mohamed Usen");
  const [sigDesig, setSigDesig] = useState("Managing Director");
  const [sigImage, setSigImage] = useState(sign);
  const sigInputRef = useRef(null);

  // ── Letter Pad ───────────────────────────────────────────
  const [useLetterPad, setUseLetterPad] = useState(true);
  const [letterPadImage, setLetterPadImage] = useState(letterpad);
  const letterPadInputRef = useRef(null);

  // ── UI Panels ────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showColPanel, setShowColPanel] = useState(true);
  const [showProjPanel, setShowProjPanel] = useState(true);

  // ── Overlay Mode State ───────────────────────────────────
  const [invoiceMode, setInvoiceMode] = useState("standard"); // standard vs overlay
  const [overlayFile, setOverlayFile] = useState(null);
  const [overlayFileUrl, setOverlayFileUrl] = useState(null);
  const [overlayFileType, setOverlayFileType] = useState(null); // image vs pdf
  const [overlayTopSpacing, setOverlayTopSpacing] = useState(130);
  const [overlayBottomSpacing, setOverlayBottomSpacing] = useState(60);
  const [overlayScale, setOverlayScale] = useState(100);
  const [overlayBlend, setOverlayBlend] = useState(true);
  const [pdfPages, setPdfPages] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const overlayInputRef = useRef(null);

  // ── API Helpers ──────────────────────────────────────────
  const fetchClients = async () => {
    try {
      const list = await apiCall("/clients");
      const mapped = list
        .map(c => ({
          id: c.id,
          name: c.companyName,
          companyFullName: c.companyFullName,
          address: [
            c.addressLine1,
            c.addressLine2,
            c.city ? `${c.city}, ${c.state || ""} ${c.pinCode || ""}` : null,
            c.country
          ].filter(Boolean).join("\n"),
          panNumber: c.panNumber,
          gstin: c.gstin
        }));
      setClients(mapped);
      if (mapped.length > 0) {
        if (!selectedClientId) {
          setSelectedClientId(mapped[0].id);
          setClientName(mapped[0].companyFullName || mapped[0].name);
        } else {
          const currentMapped = mapped.find(c => c.id === selectedClientId);
          if (currentMapped) {
            setClientName(currentMapped.companyFullName || currentMapped.name);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const list = await apiCall("/bank-accounts");
      const bankObj = {};
      list.forEach(acc => {
        bankObj[acc.id] = {
          key: acc.id,
          label: acc.label,
          acNo: acc.accountNumber,
          bankName: acc.bankName,
          branch: acc.branch,
          ifsc: acc.ifscCode,
          type: acc.accountType,
          nameOnAccount: acc.accountHolder,
          gpay: acc.gpayNumber,
          qrImage: acc.qrCodeImageUrl ? `${API_BASE}${acc.qrCodeImageUrl}` : ""
        };
      });
      setBankData(bankObj);
      if (list.length > 0) {
        setBankKey(prev => prev && bankObj[prev] ? prev : list[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch bank accounts:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const settings = await apiCall("/settings");
      if (settings.companyName) setVendorName(settings.companyName);
      if (settings.streetAddress || settings.city) {
        setVendorAddress([
          settings.streetAddress,
          settings.city,
          settings.state,
          settings.country ? `${settings.country} - ${settings.zipCode || ""}` : null
        ].filter(Boolean).join(", "));
      }
      if (settings.authorizedPersonName) setSigName(settings.authorizedPersonName);
      if (settings.designation) setSigDesig(settings.designation);
      if (settings.signatureImageUrl) setSigImage(`${API_BASE}${settings.signatureImageUrl}`);
      if (settings.letterPadImageUrl) setLetterPadImage(`${API_BASE}${settings.letterPadImageUrl}`);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const resp = await apiCall("/invoices");
      setHistoryList(resp.content || []);
      const summaryResp = await apiCall("/invoices/summary");
      setHistorySummary(summaryResp);
    } catch (err) {
      console.error("Failed to fetch invoice history:", err);
    }
  };

  const fetchProcesses = async () => {
    try {
      const list = await apiCall("/processes");
      setProcesses(list || []);
    } catch (err) {
      console.error("Failed to fetch processes:", err);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const list = await apiCall("/projects/workflows");
      setWorkflows(list || []);
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    }
  };

  const fetchProjectsAndJobs = async (clientId) => {
    if (!clientId) return;
    try {
      const projs = await apiCall(`/projects/by-client/${clientId}`);
      setClientProjects(projs);
      setProjectChoices(["All Projects", ...projs.map(p => p.name)]);

      const rates = {};
      projs.forEach(p => {
        rates[p.id] = p.ratePerPage || 5;
      });
      setProjectRates(rates);

      const jobsResp = await apiCall(`/jobs/search?clientId=${clientId}&billingStatus=PENDING&size=200`);
      const jobs = jobsResp.content || [];
      const mapped = jobs.map(j => ({
        id: j.id,
        project: j.projectName || "",
        workflow: j.workflowName || "",
        workflowId: j.workflowId || null,
        process: j.processes && j.processes.length > 0 ? j.processes.join(", ") : "",
        bookBatchName: j.jobIdCode || "",
        jobId: j.jobIdCode || "",
        titleName: j.titleName || "",
        pageCount: j.pageCount || 0,
        startDate: j.receiveDate || "",
        endDate: j.uploadDate || "",
        xmlIsbn: j.xmlIsbn || "",
        chapters: j.numberOfChapters || 0,
        complexity: j.complexity || "",
        fileStatus: j.fileStatus || "",
        uploadedDate: j.uploadDate || "",
        billingStatus: j.billingStatus || "PENDING",
        projectId: j.projectId,
        language: j.language || ""
      }));
      setUnbilledJobs(mapped);
    } catch (err) {
      console.error("Failed to fetch projects/jobs for client:", err);
    }
  };

  // ── Media Uploader Helper ────────────────────────────────
  const uploadMediaFile = async (file, entityType) => {
    const token = sessionStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);
    if (entityType) {
      formData.append('entityType', entityType);
    }
    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Upload failed');
    return json.data;
  };

  useEffect(() => {
    fetchClients();
    fetchBankAccounts();
    fetchSettings();
    fetchHistory();
    fetchProcesses();
    fetchWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchProjectsAndJobs(selectedClientId);
      setRows([EMPTY_ROW(), EMPTY_ROW()]);
      setSelectedDPIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);



  const openEditClient = () => { setClientDraft({ id: currentClient?.id || "", name: currentClient?.name || "", companyFullName: currentClient?.companyFullName || "", address: currentClient?.address || "" }); setClientModalMode("edit"); setShowClientModal(true); };
  const openAddClient = () => { setClientDraft({ id: "", name: "", companyFullName: "", address: "" }); setClientModalMode("add"); setShowClientModal(true); };

  const handleDeleteClient = async () => {
    if (!currentClient?.id) return;
    if (!window.confirm(`Are you sure you want to delete client "${currentClient.name}"?`)) return;
    try {
      await apiCall(`/clients/${currentClient.id}`, 'DELETE');
      const filtered = clients.filter(c => c.id !== currentClient.id);
      setClients(filtered);
      if (filtered.length > 0) {
        setSelectedClientId(filtered[0].id);
      } else {
        setSelectedClientId("");
      }
    } catch (err) {
      alert("Error deleting client: " + err.message);
    }
  };

  const saveClientModal = async () => {
    if (!clientDraft.name.trim()) return;
    try {
      if (clientModalMode === "edit") {
        await apiCall(`/clients/${clientDraft.id}`, 'PUT', {
          companyName: clientDraft.name,
          companyFullName: clientDraft.companyFullName,
          addressLine1: clientDraft.address
        });
      } else {
        const created = await apiCall('/clients', 'POST', {
          companyName: clientDraft.name,
          companyFullName: clientDraft.companyFullName,
          addressLine1: clientDraft.address
        });
        setSelectedClientId(created.id);
      }
      setShowClientModal(false);
      fetchClients();
    } catch (err) {
      alert("Error saving client: " + err.message);
    }
  };

  // ── Derived ──────────────────────────────────────────────
  const enabledOptCols = activeCols.map(key => OPTIONAL_COLUMNS.find(c => c.key === key));
  const currentBank = bankData[bankKey] || null;

  const filteredDPs = unbilledJobs.filter(dp => {
    if (filterProject !== "All Projects" && dp.project !== filterProject) return false;
    if (filterWorkflow !== "All Task Names" && (!dp.workflow || !dp.workflow.includes(filterWorkflow))) return false;
    if (filterComplexity !== "All" && dp.complexity !== filterComplexity) return false;
    if (filterFileStatus !== "All" && dp.fileStatus !== filterFileStatus) return false;
    if (filterStartDate && (!dp.startDate || dp.startDate < filterStartDate)) return false;
    if (filterEndDate && (!dp.endDate || dp.endDate > filterEndDate)) return false;
    return true;
  });

  const subTotal = rows.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
  const igstAmt = Math.round(subTotal * igstPct / 100);
  const grandTotal = subTotal + igstAmt;

  // ── Row helpers ───────────────────────────────────────────
  const addEmptyRow = () => setRows(r => [...r, EMPTY_ROW()]);
  const removeRow = (id) => setRows(r => r.filter(row => row.id !== id));
  const updateRow = (id, field, val) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const u = { ...row, [field]: val };
      if (field === "orderPages" || field === "ratePage") {
        const p = Number(field === "orderPages" ? val : row.orderPages) || 0;
        const rt = Number(field === "ratePage" ? val : row.ratePage) || 0;
        u.amount = p * rt;
        u.totalAmount = u.amount - Number(u.deductionAmount || 0);
      }
      if (field === "deductionAmount") {
        u.totalAmount = Number(u.amount || 0) - Number(val || 0);
      }
      return u;
    }));
  };

  const addSelectedToInvoice = () => {
    if (selectedDPIds.size === 0) return;
    const toAdd = unbilledJobs.filter(dp => selectedDPIds.has(dp.id));
    const newRows = toAdd.map(dp => {
      const rate = projectRates[dp.projectId] || PROCESS_RATES[dp.process] || 5;
      const amt = dp.pageCount * rate;
      return EMPTY_ROW({
        projectName: dp.project, process: dp.process, bookBatchName: dp.bookBatchName,
        jobId: dp.jobId, titleName: dp.titleName, pageCount: dp.pageCount,
        startDate: dp.startDate, endDate: dp.endDate, xmlIsbn: dp.xmlIsbn,
        chapters: dp.chapters, complexity: dp.complexity, fileStatus: dp.fileStatus,
        uploadedDate: dp.uploadedDate, billingStatus: dp.billingStatus,
        diffLevel: dp.complexity, lob: "Service",
        orderPages: dp.pageCount, ratePage: rate, amount: amt, deductionAmount: 0, totalAmount: amt,
        projectId: dp.projectId, jobIdRaw: dp.id,
        language: dp.language,
        workflow: dp.workflow,
        workflowId: dp.workflowId
      });
    });
    setRows(prev => {
      const nonEmpty = prev.filter(r => r.projectName || r.workflow || r.process || r.orderPages || r.totalAmount);
      return [...nonEmpty, ...newRows];
    });
    setSelectedDPIds(new Set());
  };

  const toggleSelectDP = (id) => setSelectedDPIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAllDPs = () => setSelectedDPIds(selectedDPIds.size === filteredDPs.length && filteredDPs.length > 0 ? new Set() : new Set(filteredDPs.map(dp => dp.id)));

  // ── Bank helpers ──────────────────────────────────────────
  const handleBankSwitch = (key) => { setBankKey(key); setEditingBank(false); };
  const startEditBank = () => { setBankDraft(currentBank ? { ...currentBank } : {}); setEditingBank(true); };

  const saveBank = async () => {
    try {
      await apiCall(`/bank-accounts/${bankKey}`, 'PUT', {
        label: bankDraft.label,
        bankName: bankDraft.bankName,
        accountHolder: bankDraft.nameOnAccount,
        accountNumber: bankDraft.acNo,
        branch: bankDraft.branch,
        ifscCode: bankDraft.ifsc,
        accountType: bankDraft.type,
        gpayNumber: bankDraft.gpay,
        qrCodeImageId: bankDraft.qrCodeImageId
      });
      setEditingBank(false);
      fetchBankAccounts();
    } catch (err) {
      alert("Error updating bank account: " + err.message);
    }
  };

  const saveNewBank = async () => {
    if (!newBankDraft.label.trim() || !newBankDraft.acNo.trim()) return;
    try {
      await apiCall('/bank-accounts', 'POST', {
        label: newBankDraft.label,
        bankName: newBankDraft.bankName,
        accountHolder: newBankDraft.nameOnAccount,
        accountNumber: newBankDraft.acNo,
        branch: newBankDraft.branch,
        ifscCode: newBankDraft.ifsc,
        accountType: newBankDraft.type,
        gpayNumber: newBankDraft.gpay
      });
      setNewBankDraft({ label: "", acNo: "", bankName: "", branch: "", ifsc: "", type: "Current", nameOnAccount: "ARROW DATA-TECH", gpay: "", qrImage: "" });
      setShowAddBank(false);
      fetchBankAccounts();
    } catch (err) {
      alert("Error creating bank account: " + err.message);
    }
  };

  // ── Upload Handlers ─────────────────────────────────────
  const handleQrUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const media = await uploadMediaFile(f, 'qr_code');
      if (editingBank) {
        setBankDraft(d => ({ ...d, qrImage: `${API_BASE}/media/${media.id}`, qrCodeImageId: media.id }));
      } else if (currentBank) {
        await apiCall(`/bank-accounts/${bankKey}`, 'PUT', {
          label: currentBank.label,
          bankName: currentBank.bankName,
          accountHolder: currentBank.nameOnAccount,
          accountNumber: currentBank.acNo,
          qrCodeImageId: media.id
        });
        fetchBankAccounts();
      }
    } catch (err) {
      alert("Error uploading QR code: " + err.message);
    }
  };

  const handleSigUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const media = await uploadMediaFile(f, 'signature');
      setSigImage(`${API_BASE}/media/${media.id}`);
      await apiCall('/settings', 'PUT', { signatureImageId: media.id });
    } catch (err) {
      alert("Error uploading signature: " + err.message);
    }
  };

  const handleLetterPadUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const media = await uploadMediaFile(f, 'letter_pad');
      setLetterPadImage(`${API_BASE}/media/${media.id}`);
      await apiCall('/settings', 'PUT', { letterPadImageId: media.id });
    } catch (err) {
      alert("Error uploading letter pad: " + err.message);
    }
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script ${src}`));
      document.head.appendChild(script);
    });
  };

  const loadPdfJs = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js");
    const pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
    return pdfjsLib;
  };

  const handleOverlayFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (overlayFileUrl) {
      URL.revokeObjectURL(overlayFileUrl);
    }
    setPdfPages([]);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setOverlayFile(file);
      setOverlayFileUrl(url);
      setOverlayFileType("image");
    } else if (file.type === "application/pdf") {
      setPdfLoading(true);
      try {
        const pdfjsLib = await loadPdfJs();
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const typedarray = new Uint8Array(event.target.result);
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            const urls = [];
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 2.0 }); // high resolution print quality
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d");
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext: context, viewport }).promise;
              urls.push(canvas.toDataURL("image/png"));
            }
            setPdfPages(urls);
            setOverlayFileType("pdf");
            setOverlayFile(file);
            setOverlayFileUrl(null);
          } catch (err) {
            alert("Error parsing PDF pages: " + err.message);
          } finally {
            setPdfLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        alert("Error loading PDF reader library: " + err.message);
        setPdfLoading(false);
      }
    } else {
      setOverlayFile(null);
      setOverlayFileUrl(null);
      setOverlayFileType(null);
      alert("Unsupported file type. Please upload an image or a PDF.");
    }
  };

  const handleClearOverlayFile = () => {
    if (overlayFileUrl) {
      URL.revokeObjectURL(overlayFileUrl);
    }
    setOverlayFile(null);
    setOverlayFileUrl(null);
    setOverlayFileType(null);
    setPdfPages([]);
  };

  const handleSaveInvoice = async () => {
    if (!selectedClientId) {
      alert("Please select a client.");
      return;
    }
    const filteredRows = rows.filter(r => r.projectName || r.workflow || r.process || r.orderPages || r.totalAmount);
    if (filteredRows.length === 0) {
      alert("Invoice must have at least one line item.");
      return;
    }

    try {
      const payload = {
        clientId: selectedClientId,
        clientName: clientName,
        invoiceTitle: `INVOICE OF ${vendorName.toUpperCase()} FOR THE MONTH OF ${titleMonth.toUpperCase()} - ${titleYear}`,
        periodMonth: titleMonth,
        periodYear: titleYear,
        invoiceDate: invoiceDate,
        gstPercentage: igstPct,
        bankAccountId: bankKey || null,
        columnConfig: JSON.stringify(activeCols),
        letterPadEnabled: useLetterPad,
        showSignature: showSignature,
        showQr: showQr,
        lineItems: filteredRows.map((r, idx) => {
          const matchedProj = clientProjects.find(p => p.name === r.projectName);
          const matchedProc = processes.find(p => p.name === r.process);
          const matchedWf = workflows.find(w => w.name === r.workflow);
          return {
            sno: idx + 1,
            projectId: r.projectId || matchedProj?.id || null,
            processId: r.processId || matchedProc?.id || null,
            processNames: r.process || null,
            workflowId: r.workflowId || matchedWf?.id || null,
            workflowName: r.workflow ? r.workflow.split(",")[0]?.trim() : null,
            workflowNames: r.workflow || null,
            jobId: r.jobIdRaw || null,
            batchName: r.bookBatchName,
            pages: Number(r.orderPages) || 0,
            ratePerPage: Number(r.ratePage) || 0,
            deduction: Number(r.deductionAmount) || 0,
            uploadedDate: r.uploadedDate || null,
            startDate: r.startDate || null,
            endDate: r.endDate || null
          };
        })
      };

      const resp = await apiCall('/invoices', 'POST', payload);
      alert(`Invoice ${resp.invoiceNumber} saved successfully!`);
      fetchHistory();
      setRows([EMPTY_ROW(), EMPTY_ROW()]);
      setSelectedDPIds(new Set());
      fetchProjectsAndJobs(selectedClientId);
    } catch (err) {
      alert("Error saving invoice: " + err.message);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This will restore the jobs' billing status to pending.")) return;
    try {
      await apiCall(`/invoices/${id}`, 'DELETE');
      alert("Invoice deleted successfully.");
      fetchHistory();
      if (selectedClientId) {
        fetchProjectsAndJobs(selectedClientId);
      }
    } catch (err) {
      alert("Error deleting invoice: " + err.message);
    }
  };

  const handleUpdatePayment = async (id, status, total) => {
    try {
      await apiCall(`/invoices/${id}/payment`, 'PUT', {
        paymentStatus: status,
        totalReceived: status === "Paid" ? total : 0
      });
      alert("Payment status updated successfully.");
      fetchHistory();
    } catch (err) {
      alert("Error updating payment status: " + err.message);
    }
  };

  const handleRehydrateInvoice = (h) => {
    setInvoiceNo(h.invoiceNumber);
    setInvoiceDate(h.invoiceDate);
    setSelectedClientId(h.clientId);
    setClientName(h.clientName || "");
    setVendorName(h.vendorName);
    setVendorAddress(h.vendorAddress);
    setTitleMonth(h.periodMonth);
    setTitleYear(h.periodYear);
    setIgstPct(h.gstPercentage);
    setBankKey(h.bankAccountId || (Object.keys(bankData).length > 0 ? Object.keys(bankData)[0] : ""));
    setUseLetterPad(h.letterPadEnabled);
    setShowSignature(h.showSignature);
    setShowQr(h.showQr);

    if (h.columnConfig) {
      try {
        setActiveCols(JSON.parse(h.columnConfig));
      } catch (e) { }
    }

    const mappedRows = (h.lineItems || []).map(item => ({
      id: item.id || (Date.now() + Math.random()),
      projectName: item.projectName,
      process: item.processNames || item.processName || "",
      workflow: item.workflowNames || item.workflowName || "",
      workflowId: item.workflowId || "",
      bookBatchName: item.batchName,
      orderPages: item.pages,
      ratePage: item.ratePerPage,
      amount: item.amount,
      deductionAmount: item.deduction,
      totalAmount: item.total,
      uploadedDate: item.uploadedDate,
      startDate: item.startDate,
      endDate: item.endDate,
      language: item.language || ""
    }));
    setRows(mappedRows);
    setShowHistory(false);
  };


  // ── Col helpers ───────────────────────────────────────────
  const toggleCol = (key) => setActiveCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  // ── Exports ───────────────────────────────────────────────
  const getExportFilename = () => {
    const uniqueProjects = Array.from(new Set(rows.map(r => r.projectName).filter(Boolean)));
    const projName = uniqueProjects.length > 0 ? uniqueProjects.join("_") : "";
    const rawName = `${projName ? projName + "_" : ""}INVOICE OF ${vendorName.toUpperCase()} FOR THE MONTH OF ${titleMonth.toUpperCase()} - ${titleYear}`;
    return rawName.replace(/[/\\?%*:|"<>\r\n]/g, "").trim();
  };

  const exportPDF = () => {
    const originalTitle = document.title;
    document.title = getExportFilename();
    setShowPreview(true);
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 600);
  };
  const exportExcel = () => {
    const clientHeader = ["Client Name:", clientName];
    const invoiceNoHeader = ["Invoice No:", invoiceNo];
    const invoiceDateHeader = ["Invoice Date:", invoiceDate];
    const blankRow = [];
    const headers = ["S.No", "Project Name", "Process", "Book/Batch/Article Name", ...enabledOptCols.map(c => colHeaders[c.key] || c.label), "Order Pages", "Rate/Page (₹)", "Amount (₹)", "Penalty (₹)", "Total (₹)"];
    const dataRows = rows.map((r, i) => [i + 1, r.projectName, r.process, r.bookBatchName, ...enabledOptCols.map(c => r[c.key] || ""), r.orderPages, r.ratePage, r.amount || "", r.deductionAmount || "", r.totalAmount || ""]);
    const summary = [[], ["", "", "", "Sub Total", "", fmt(subTotal)], ["", "", `IGST (${igstPct}%)`, "", fmt(igstAmt)], ["", "", "", "Grand Total", "", fmt(grandTotal)]];
    const csv = [[clientHeader, invoiceNoHeader, invoiceDateHeader, blankRow, headers, ...dataRows, ...summary]].flat().map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const filename = `${getExportFilename()}.csv`;
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })), download: filename });
    a.click(); URL.revokeObjectURL(a.href);
  };
  const exportWord = () => {
    const doc = document.getElementById("inv-printable-doc");
    if (!doc) { alert("Open preview first."); return; }
    const filename = `${getExportFilename()}.doc`;
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([`<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body>${doc.outerHTML}</body></html>`], { type: "application/msword" })), download: filename });
    a.click(); URL.revokeObjectURL(a.href);
  };
  const exportImage = async () => {
    setShowPreview(true);
    await new Promise(r => setTimeout(r, 400));
    const doc = document.getElementById("inv-printable-doc");
    if (!doc) return;
    if (html2canvas) {
      const canvas = await html2canvas(doc, { scale: 2, useCORS: true, backgroundColor: null });
      const filename = `${getExportFilename()}.png`;
      const a = Object.assign(document.createElement("a"), { href: canvas.toDataURL("image/png"), download: filename });
      a.click();
    } else { alert("html2canvas library is not loaded properly."); }
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="inv-wrapper">

      {/* ── Page Header ── */}
      <div className="inv-page-header">
        <div className="inv-page-title-group">
          <span className="inv-page-icon">🧾</span>
          <div>
            <h1 className="inv-page-title">Invoice Generation</h1>
            <p className="inv-page-sub">Create, configure and export professional invoices</p>
          </div>
        </div>
        <div className="inv-header-actions">
          {invoiceMode === "standard" && (
            <button className="inv-btn inv-btn--history" onClick={() => setShowHistory(v => !v)}>
              <span>📜</span> {showHistory ? "Close History" : "History"}
            </button>
          )}
          {invoiceMode === "overlay" && overlayFile && (
            <button className="inv-btn inv-btn--primary" onClick={exportPDF}>🖨 Print / Save PDF</button>
          )}
          <button className="inv-btn inv-btn--primary" onClick={() => setShowPreview(true)} disabled={invoiceMode === "overlay" && !overlayFile}>👁 Preview</button>
          {invoiceMode === "standard" && (
            <button className="inv-btn inv-btn--success" onClick={handleSaveInvoice}>💾 Save Invoice</button>
          )}
        </div>
      </div>

      {/* ── Invoice Mode Tabs ── */}
      <div className="inv-mode-tabs">
        <button
          className={`inv-mode-tab ${invoiceMode === "standard" ? "inv-mode-tab--active" : ""}`}
          onClick={() => { setInvoiceMode("standard"); setShowHistory(false); }}
        >
          🧾 Standard Invoice Builder
        </button>
        <button
          className={`inv-mode-tab ${invoiceMode === "overlay" ? "inv-mode-tab--active" : ""}`}
          onClick={() => { setInvoiceMode("overlay"); setShowHistory(false); }}
        >
          🖼️ Letterpad Background Overlay (Client Upload)
        </button>
      </div>

      {/* ── History Section (collapsible, below header) ── */}
      {showHistory && (
        <HistorySection
          onClose={() => setShowHistory(false)}
          historyList={historyList}
          summary={historySummary}
          onDelete={handleDeleteInvoice}
          onUpdatePayment={handleUpdatePayment}
          onRehydrate={handleRehydrateInvoice}
        />
      )}

      {invoiceMode === "standard" && (
        <>
          {/* ── Section 1: Invoice Details ── */}
          <div className="inv-card">
            <div className="inv-card-header">
              <span className="inv-card-icon">📋</span>
              <h2 className="inv-card-title">Invoice Details</h2>
            </div>
            <div className="inv-card-body">
              <div className="inv-details-grid">
                <div className="inv-details-left">
                  <div className="inv-field-block">
                    <label className="inv-label">Vendor Name</label>
                    <input className="inv-input" value={vendorName} onChange={e => setVendorName(e.target.value)} />
                  </div>
                  <div className="inv-field-block">
                    <label className="inv-label">Vendor Address</label>
                    <textarea className="inv-textarea" rows={3} value={vendorAddress} onChange={e => setVendorAddress(e.target.value)} />
                  </div>
                  <div className="inv-field-block">
                    <label className="inv-label">Invoice To</label>
                    <div className="inv-client-selector-row">
                      <select
                        className="inv-select inv-select--client"
                        value={selectedClientId}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedClientId(val);
                          const matched = clients.find(c => c.id === val);
                          if (matched) {
                            setClientName(matched.companyFullName || matched.name);
                          }
                        }}
                      >
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button className="inv-btn inv-btn--outline inv-btn--sm" onClick={openEditClient}>✏ Edit</button>
                      <button className="inv-btn inv-btn--primary inv-btn--sm" onClick={openAddClient}>+ New</button>
                      <button className="inv-btn inv-btn--outline inv-btn--sm" onClick={handleDeleteClient} style={{ color: '#dc3545', borderColor: '#dc3545' }}>🗑 Delete</button>
                    </div>
                  </div>
                  <div className="inv-field-block">
                    <label className="inv-label">Client Name (Editable for Print/Export)</label>
                    <input className="inv-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" />
                  </div>
                  {currentClient && (
                    <div className="inv-field-block">
                      <label className="inv-label">Client Address</label>
                      <div className="inv-client-preview">
                        <div className="inv-client-addr">{currentClient.address}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="inv-details-right">
                  <div className="inv-meta-grid">
                    <div className="inv-field-block">
                      <label className="inv-label">Invoice No.</label>
                      <input className="inv-input" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                    </div>
                    <div className="inv-field-block">
                      <label className="inv-label">Invoice Date</label>
                      <input type="date" className="inv-input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                    </div>
                    <div className="inv-field-block">
                      <label className="inv-label">PAN No.</label>
                      <input className="inv-input" value={panNo} onChange={e => setPanNo(e.target.value)} />
                    </div>
                    <div className="inv-field-block">
                      <label className="inv-label">GSTIN No.</label>
                      <input className="inv-input" value={gstinNo} onChange={e => setGstinNo(e.target.value)} placeholder="GSTIN (if applicable)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Invoice Title ── */}
          <div className="inv-card">
            <div className="inv-card-header"><span className="inv-card-icon">📝</span><h2 className="inv-card-title">Invoice Title</h2></div>
            <div className="inv-card-body">
              <div className="inv-title-builder">
                <div className="inv-title-preview">
                  <b>INVOICE OF {vendorName.toUpperCase()} FOR THE MONTH OF {titleMonth.toUpperCase()} - {titleYear}</b>
                </div>
                <div className="inv-title-selectors">
                  <div className="inv-field-block">
                    <label className="inv-label">Month</label>
                    <select className="inv-select" value={titleMonth} onChange={e => setTitleMonth(e.target.value)}>
                      {MONTHS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="inv-field-block">
                    <label className="inv-label">Year</label>
                    <select className="inv-select" value={titleYear} onChange={e => setTitleYear(Number(e.target.value))}>
                      {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Project Selection ── */}
          <div className="inv-card">
            <div className="inv-card-header" style={{ cursor: "pointer" }} onClick={() => setShowProjPanel(p => !p)}>
              <span className="inv-card-icon">📁</span>
              <h2 className="inv-card-title">Project Selection</h2>
              <span className="inv-card-badge">{selectedDPIds.size} selected</span>
              <span className="inv-chevron">{showProjPanel ? "▲" : "▼"}</span>
            </div>
            {showProjPanel && (
              <div className="inv-card-body">
                <div className="inv-proj-filters">
                  {[["Project", projectChoices, filterProject, setFilterProject], ["Task Name", ["All Task Names", ...workflows.map(w => w.name)], filterWorkflow, setFilterWorkflow], ["Complexity", COMPLEXITY_OPTIONS, filterComplexity, setFilterComplexity], ["File Status", FILE_STATUS_OPTIONS, filterFileStatus, setFilterFileStatus]].map(([lbl, opts, val, set]) => (
                    <div key={lbl} className="inv-field-block">
                      <label className="inv-label">{lbl}</label>
                      <select className="inv-select" value={val} onChange={e => set(e.target.value)}>
                        {opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="inv-field-block"><label className="inv-label">Start From</label><input type="date" className="inv-input" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} /></div>
                  <div className="inv-field-block"><label className="inv-label">End To</label><input type="date" className="inv-input" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} /></div>
                  <div className="inv-field-block inv-field-block--btn">
                    <label className="inv-label">&nbsp;</label>
                    <button className="inv-btn inv-btn--outline inv-btn--sm" onClick={() => { setFilterProject("All Projects"); setFilterWorkflow("All Task Names"); setFilterStartDate(""); setFilterEndDate(""); setFilterComplexity("All"); setFilterFileStatus("All"); }}>✕ Clear</button>
                  </div>
                </div>
                <div className="inv-proj-table-wrap">
                  {filteredDPs.length === 0 ? (
                    <div className="inv-proj-empty">📭 No projects match the current filters.</div>
                  ) : (
                    <table className="inv-proj-table">
                      <thead><tr>
                        <th style={{ textAlign: "center" }}><input type="checkbox" checked={selectedDPIds.size === filteredDPs.length && filteredDPs.length > 0} onChange={selectAllDPs} /></th>
                        <th>PROJECT</th><th>TASK NAME</th><th>PROCESS</th><th>JOB ID</th><th>TITLE</th>
                        <th>PAGES</th><th>RATE/PG</th><th>AMOUNT</th><th>START DATE</th><th>END DATE</th><th>COMPLEXITY</th><th>FILE STATUS</th>
                      </tr></thead>
                      <tbody>
                        {filteredDPs.map(dp => {
                          const rate = (dp.process ? PROCESS_RATES[dp.process] : null) || projectRates[dp.projectId] || 5;
                          const amt = dp.pageCount * rate;
                          const sel = selectedDPIds.has(dp.id);
                          const complexityCls = dp.complexity ? dp.complexity.toLowerCase().replace(/\s+/g, "") : "";
                          const fileStatusCls = dp.fileStatus ? dp.fileStatus.toLowerCase() : "";
                          return (
                            <tr key={dp.id} className={`inv-proj-row ${sel ? "inv-proj-row--sel" : ""}`} onClick={() => toggleSelectDP(dp.id)}>
                              <td style={{ textAlign: "center" }}><input type="checkbox" checked={sel} onChange={() => toggleSelectDP(dp.id)} onClick={e => e.stopPropagation()} /></td>
                              <td><span className="inv-proj-tag">{dp.project || "—"}</span></td>
                              <td><span className="badge badge--workflow" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>{dp.workflow || "—"}</span></td>
                              <td><span className="inv-proc-tag">{dp.process || "—"}</span></td>
                              <td className="inv-td-mono">{dp.jobId}</td>
                              <td className="inv-td-title" title={dp.titleName}>{dp.titleName}</td>
                              <td className="inv-td-num">{dp.pageCount}</td>
                              <td className="inv-td-num">₹{rate}</td>
                              <td className="inv-td-amt">₹{amt.toLocaleString("en-IN")}</td>
                              <td className="inv-td-mono">{formatDate(dp.startDate)}</td>
                              <td className="inv-td-mono">{formatDate(dp.endDate)}</td>
                              <td>{complexityCls ? <span className={`inv-complexity inv-complexity--${complexityCls}`}>{dp.complexity}</span> : <span className="inv-complexity">—</span>}</td>
                              <td>{fileStatusCls ? <span className={`inv-fstatus inv-fstatus--${fileStatusCls}`}>{dp.fileStatus}</span> : <span className="inv-fstatus">—</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="inv-proj-add-row">
                  <span className="inv-proj-sel-info">{selectedDPIds.size > 0 ? `${selectedDPIds.size} project${selectedDPIds.size > 1 ? "s" : ""} selected` : "Select projects above"}</span>
                  <button className={`inv-btn inv-btn--primary ${selectedDPIds.size === 0 ? "inv-btn--disabled" : ""}`} disabled={selectedDPIds.size === 0} onClick={addSelectedToInvoice}>
                    ➕ Add {selectedDPIds.size > 0 ? selectedDPIds.size : ""} to Invoice Table
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 4: Column Config ── */}
          <div className="inv-card">
            <div className="inv-card-header" onClick={() => setShowColPanel(p => !p)} style={{ cursor: "pointer" }}>
              <span className="inv-card-icon">⚙</span>
              <h2 className="inv-card-title">Table Column Configuration</h2>
              <span className="inv-col-count">{enabledOptCols.length} optional columns enabled</span>
              <span className="inv-chevron">{showColPanel ? "▲" : "▼"}</span>
            </div>
            {showColPanel && (
              <div className="inv-card-body">
                <p className="inv-col-hint">Toggle columns on/off. Order of selection = column order in invoice.</p>
                <div className="inv-col-grid">
                  {OPTIONAL_COLUMNS.map(col => {
                    const isActive = activeCols.includes(col.key);
                    const priority = isActive ? activeCols.indexOf(col.key) + 1 : null;
                    return (
                      <div key={col.key} className={`inv-col-item ${isActive ? "inv-col-item--on" : ""}`}>
                        <Toggle checked={isActive} onChange={() => toggleCol(col.key)} />
                        <span className="inv-col-name">{col.label}</span>
                        {isActive && <span className="inv-col-priority">{priority}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="inv-fixed-cols">
                  <span className="inv-fixed-cols-label">Always shown:</span>
                  {["S.No", "Amount", "Penalty", "Total"].map(c => <span key={c} className="inv-fixed-col-chip">{c}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* ── Section 5: Invoice Table ── */}
          <div className="inv-card">
            <div className="inv-card-header">
              <span className="inv-card-icon">📊</span>
              <h2 className="inv-card-title">Invoice Table</h2>
              <button className="inv-btn inv-btn--sm inv-btn--primary inv-btn--ml" onClick={addEmptyRow}>+ Add Row</button>
            </div>
            <div className="inv-card-body inv-card-body--noPad">
              <div className="inv-table-scroll">
                <table className="inv-table">
                  <thead>
                    <tr className="inv-thead-top">
                      <th className="inv-th inv-th--sno" rowSpan={2}>S.No</th>
                      {enabledOptCols.map(c => (
                        <th key={c.key} className={`inv-th inv-th--opt ${c.key === 'orderPages' ? 'inv-th--page' : c.key === 'ratePage' ? 'inv-th--rate' : ''}`} rowSpan={2}>
                          <input className="inv-th-edit" value={colHeaders[c.key] || c.label} onChange={e => setColHeaders(h => ({ ...h, [c.key]: e.target.value }))} />
                        </th>
                      ))}
                      <th className="inv-th inv-th--fixed" rowSpan={2}>Amount (₹)</th>
                      <th className="inv-th inv-th--fixed inv-th--penalty" rowSpan={2}>Penalty (₹)</th>
                      <th className="inv-th inv-th--total" rowSpan={2}>Total (₹)</th>
                      <th className="inv-th inv-th--action" rowSpan={2}>Del</th>
                    </tr>
                    <tr />
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="inv-tr">
                        <td className="inv-td inv-td--center">{idx + 1}</td>
                        {enabledOptCols.map(c => {
                          const isDate = ["startDate", "endDate", "receivedDate", "uploadedDate"].includes(c.key);
                          const isComp = c.key === "complexity";

                          if (c.key === "projectName") {
                            const projListId = `proj-list-${row.id}`;
                            return (
                              <td key={c.key} className="inv-td col-left">
                                <input
                                  list={projListId}
                                  className="inv-cell-input inv-cell-input--combo"
                                  value={row.projectName}
                                  placeholder="Type project name…"
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateRow(row.id, "projectName", val);
                                    const matchedProj = clientProjects.find(p => p.name === val);
                                    if (matchedProj) {
                                      updateRow(row.id, "projectId", matchedProj.id);
                                      if (projectRates[matchedProj.id]) {
                                        updateRow(row.id, "ratePage", projectRates[matchedProj.id]);
                                      }
                                      if (matchedProj.workflowId) {
                                        updateRow(row.id, "workflowId", matchedProj.workflowId);
                                        updateRow(row.id, "workflowName", matchedProj.workflowName || "");
                                        updateRow(row.id, "workflow", matchedProj.workflowName || "");
                                      } else {
                                        updateRow(row.id, "workflowId", "");
                                        updateRow(row.id, "workflowName", "");
                                        updateRow(row.id, "workflow", "");
                                      }
                                    }
                                  }}
                                />
                                <datalist id={projListId}>
                                  {clientProjects.map(p => <option key={p.id} value={p.name} />)}
                                </datalist>
                              </td>
                            );
                          }
                          if (c.key === "workflow") {
                            const isDropdownOpen = activeDropdown.rowId === row.id && activeDropdown.field === "workflow";
                            const selectedWfs = row.workflow ? row.workflow.split(",").map(s => s.trim()).filter(Boolean) : [];

                            return (
                              <td key={c.key} className="inv-td" style={{ minWidth: "220px" }}>
                                <div className="inv-multiselect-box" onMouseDown={e => e.stopPropagation()}>
                                  {/* Selected Chips */}
                                  {selectedWfs.length > 0 && (
                                    <div className="inv-chips-wrap">
                                      {selectedWfs.map(wf => (
                                        <span key={wf} className="inv-multiselect-chip">
                                          {wf}
                                          <button
                                            type="button"
                                            className="inv-chip-remove"
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const newVal = toggleListItem(row.workflow, wf);
                                              updateRow(row.id, "workflow", newVal);
                                            }}
                                          >
                                            &times;
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Input + toggle arrow */}
                                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                    <input
                                      className="inv-multiselect-input"
                                      value={row.workflow || ""}
                                      placeholder={selectedWfs.length > 0 ? "" : "Select/type workflow…"}
                                      onFocus={e => openDropdown(e, row.id, "workflow")}
                                      onChange={e => {
                                        const val = e.target.value;
                                        updateRow(row.id, "workflow", val);
                                        const firstSelected = val.split(",")[0]?.trim();
                                        const firstWf = workflows.find(wf => wf.name === firstSelected);
                                        updateRow(row.id, "workflowId", firstWf ? firstWf.id : "");
                                      }}
                                      style={{ border: "none", outline: "none", flex: 1, background: "transparent", minWidth: 0 }}
                                    />
                                    <span
                                      className="inv-multiselect-arrow"
                                      onMouseDown={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (isDropdownOpen) {
                                          closeDropdown();
                                        } else {
                                          openDropdown(e, row.id, "workflow");
                                        }
                                      }}
                                      style={{ cursor: "pointer", opacity: 0.55, fontSize: "0.75rem", padding: "0 4px", userSelect: "none" }}
                                    >
                                      {isDropdownOpen ? "▲" : "▼"}
                                    </span>
                                  </div>

                                  {/* Fixed-position dropdown — escapes overflow clipping */}
                                  {isDropdownOpen && activeDropdown.rect && (
                                    <div
                                      className="inv-multiselect-dropdown"
                                      onMouseDown={e => e.stopPropagation()}
                                      style={{
                                        position: "fixed",
                                        top: activeDropdown.rect.bottom + 4,
                                        left: activeDropdown.rect.left,
                                        width: Math.max(activeDropdown.rect.width, 200),
                                        zIndex: 99999
                                      }}
                                    >
                                      {workflows.map(w => {
                                        const isChecked = selectedWfs.includes(w.name);
                                        return (
                                          <div
                                            key={w.id}
                                            className={`inv-multiselect-option ${isChecked ? "inv-multiselect-option--active" : ""}`}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              const newVal = toggleListItem(row.workflow, w.name);
                                              updateRow(row.id, "workflow", newVal);

                                              // Resolve first selected option ID
                                              const firstSelected = newVal.split(",")[0]?.trim();
                                              const firstWf = workflows.find(wf => wf.name === firstSelected);
                                              updateRow(row.id, "workflowId", firstWf ? firstWf.id : "");
                                            }}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              readOnly
                                              style={{ marginRight: "8px", pointerEvents: "none" }}
                                            />
                                            <span>{w.name}</span>
                                          </div>
                                        );
                                      })}

                                      <div
                                        className="inv-multiselect-option inv-multiselect-option--add"
                                        onMouseDown={async (e) => {
                                          e.preventDefault();
                                          const name = window.prompt("Enter new Task Name:");
                                          if (name && name.trim()) {
                                            try {
                                              const created = await apiCall("/projects/workflows", "POST", { name: name.trim() });
                                              await fetchWorkflows();
                                              const newVal = toggleListItem(row.workflow, created.name);
                                              updateRow(row.id, "workflow", newVal);
                                            } catch (err) {
                                              alert("Error: " + err.message);
                                            }
                                          }
                                        }}
                                      >
                                        ➕ + Add New Custom Task Name...
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          }
                          if (c.key === "process") {
                            const isDropdownOpen = activeDropdown.rowId === row.id && activeDropdown.field === "process";
                            const selectedProcs = row.process ? row.process.split(",").map(s => s.trim()).filter(Boolean) : [];

                            const allProcessOptions = Array.from(new Set([
                              ...processes.map(p => p.name),
                              ...PROCESS_OPTIONS.filter(o => o !== "All Processes")
                            ])).sort();

                            return (
                              <td key={c.key} className="inv-td" style={{ minWidth: "220px" }}>
                                <div className="inv-multiselect-box" onMouseDown={e => e.stopPropagation()}>
                                  {/* Selected Chips */}
                                  {selectedProcs.length > 0 && (
                                    <div className="inv-chips-wrap">
                                      {selectedProcs.map(proc => (
                                        <span key={proc} className="inv-multiselect-chip">
                                          {proc}
                                          <button
                                            type="button"
                                            className="inv-chip-remove"
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const newVal = toggleListItem(row.process, proc);
                                              updateRow(row.id, "process", newVal);
                                            }}
                                          >
                                            &times;
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Input + toggle arrow */}
                                  <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                    <input
                                      className="inv-multiselect-input"
                                      value={row.process || ""}
                                      placeholder={selectedProcs.length > 0 ? "" : "Select/type process…"}
                                      onFocus={e => openDropdown(e, row.id, "process")}
                                      onChange={e => {
                                        const val = e.target.value;
                                        updateRow(row.id, "process", val);
                                        const firstSelected = val.split(",")[0]?.trim();
                                        const firstProcObj = processes.find(p => p.name === firstSelected);
                                        updateRow(row.id, "processId", firstProcObj ? firstProcObj.id : "");
                                      }}
                                      style={{ border: "none", outline: "none", flex: 1, background: "transparent", minWidth: 0 }}
                                    />
                                    <span
                                      className="inv-multiselect-arrow"
                                      onMouseDown={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (isDropdownOpen) {
                                          closeDropdown();
                                        } else {
                                          openDropdown(e, row.id, "process");
                                        }
                                      }}
                                      style={{ cursor: "pointer", opacity: 0.55, fontSize: "0.75rem", padding: "0 4px", userSelect: "none" }}
                                    >
                                      {isDropdownOpen ? "▲" : "▼"}
                                    </span>
                                  </div>

                                  {/* Fixed-position dropdown — escapes overflow clipping */}
                                  {isDropdownOpen && activeDropdown.rect && (
                                    <div
                                      className="inv-multiselect-dropdown"
                                      onMouseDown={e => e.stopPropagation()}
                                      style={{
                                        position: "fixed",
                                        top: activeDropdown.rect.bottom + 4,
                                        left: activeDropdown.rect.left,
                                        width: Math.max(activeDropdown.rect.width, 200),
                                        zIndex: 99999
                                      }}
                                    >
                                      {allProcessOptions.map(o => {
                                        const isChecked = selectedProcs.includes(o);
                                        return (
                                          <div
                                            key={o}
                                            className={`inv-multiselect-option ${isChecked ? "inv-multiselect-option--active" : ""}`}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const newVal = toggleListItem(row.process, o);
                                              updateRow(row.id, "process", newVal);
                                              const firstSelected = newVal.split(",")[0]?.trim();
                                              const firstProcObj = processes.find(p => p.name === firstSelected);
                                              updateRow(row.id, "processId", firstProcObj ? firstProcObj.id : "");
                                              if (PROCESS_RATES[firstSelected]) {
                                                updateRow(row.id, "ratePage", PROCESS_RATES[firstSelected]);
                                              }
                                            }}
                                          >
                                            <input type="checkbox" checked={isChecked} readOnly style={{ marginRight: "8px", pointerEvents: "none", accentColor: "#0284c7" }} />
                                            <span>{o}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          }
                          if (c.key === "bookBatchName") {
                            return <td key={c.key} className="inv-td"><input className="inv-cell-input" value={row.bookBatchName} onChange={e => updateRow(row.id, "bookBatchName", e.target.value)} placeholder="Batch Name" /></td>;
                          }
                          if (c.key === "orderPages") {
                            return <td key={c.key} className="inv-td"><input type="number" className="inv-cell-input inv-cell-input--num" value={row.orderPages} onChange={e => updateRow(row.id, "orderPages", e.target.value)} /></td>;
                          }
                          if (c.key === "ratePage") {
                            return <td key={c.key} className="inv-td"><input type="number" className="inv-cell-input inv-cell-input--num" value={row.ratePage} onChange={e => updateRow(row.id, "ratePage", e.target.value)} /></td>;
                          }

                          return (
                            <td key={c.key} className={`inv-td ${c.key === "titleName" ? "col-left" : ""}`}>
                              {isComp ? (
                                <select className={`inv-cell-input ${getComplexityClass(row[c.key])}`} value={row[c.key] || ""} onChange={e => updateRow(row.id, c.key, e.target.value)}>
                                  <option value="">Select...</option>
                                  {["Simple", "Medium", "Complex", "Heavy Complex"].map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : isDate ? (
                                <input type="date" className="inv-cell-input" value={row[c.key] || ""} onChange={e => updateRow(row.id, c.key, e.target.value)} />
                              ) : (
                                <input className="inv-cell-input" value={row[c.key] || ""} onChange={e => updateRow(row.id, c.key, e.target.value)} />
                              )}
                            </td>
                          );
                        })}
                        <td className="inv-td inv-td--calc">{row.amount ? fmt(row.amount) : ""}</td>
                        <td className="inv-td"><input type="number" className="inv-cell-input inv-cell-input--num" value={row.deductionAmount} onChange={e => updateRow(row.id, "deductionAmount", e.target.value)} /></td>
                        <td className="inv-td inv-td--total">{row.totalAmount ? fmt(row.totalAmount) : ""}</td>
                        <td className="inv-td inv-td--center"><button className="inv-row-del" onClick={() => removeRow(row.id)} title="Remove">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="inv-totals-panel">
              <div className="inv-totals-left">
                <div className="inv-amount-words-inline">
                  <span className="inv-amount-words-label">Amount in Words:</span>
                  <span className="inv-amount-words-value">{grandTotal > 0 ? numberToWords(grandTotal) : "—"} /-</span>
                </div>
              </div>
              <div className="inv-totals-right">
                <div className="inv-total-row"><span className="inv-total-label">Sub Total</span><span className="inv-total-value">{fmt(subTotal)}</span></div>
                <div className="inv-total-row">
                  <span className="inv-total-label">IGST <input type="number" min={0} max={100} className="inv-igst-input" value={igstPct} onChange={e => setIgstPct(Number(e.target.value))} />%</span>
                  <span className="inv-total-value">{fmt(igstAmt)}</span>
                </div>
                <div className="inv-total-row inv-total-row--grand"><span className="inv-total-label">Grand Total</span><span className="inv-total-value inv-total-value--grand">{fmt(grandTotal)}</span></div>
              </div>
            </div>
          </div>

          {/* ── Section 6: Bank Details ── */}
          <div className="inv-card">
            <div className="inv-card-header">
              <span className="inv-card-icon">🏦</span>
              <h2 className="inv-card-title">Bank Details</h2>
            </div>
            <div className="inv-card-body">
              <div className="inv-bank-selector-row">
                <div className="inv-field-block inv-field-block--grow">
                  <label className="inv-label">Select Bank Account</label>
                  <select className="inv-select" value={bankKey} onChange={(e) => handleBankSwitch(e.target.value)}>
                    {Object.entries(bankData).map(([k, b]) => (
                      <option key={k} value={k}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "8px", alignSelf: "flex-end", flexWrap: "wrap" }}>
                  {!editingBank && currentBank && <button className="inv-btn inv-btn--outline inv-btn--sm" onClick={startEditBank}>✏ Edit Bank</button>}
                  <button className="inv-btn inv-btn--success inv-btn--sm" onClick={() => setShowAddBank(true)}>+ Add Bank</button>
                </div>
              </div>

              <div style={{ marginBottom: "16px", padding: "10px 14px", background: "#f8fafc", border: "1px solid var(--inv-border)", borderRadius: "var(--inv-radius-sm)" }}>
                <Toggle checked={showQr} onChange={setShowQr} label="Show QR in Invoice" />
              </div>

              {editingBank ? (
                <div className="inv-bank-edit-grid">
                  {[["label", "Account Label", "text"], ["bankName", "Bank Name", "text"], ["acNo", "Account Number", "text"], ["branch", "Branch", "text"], ["ifsc", "IFSC Code", "text"], ["type", "Account Type", "text"]].map(([key, lbl, type]) => (
                    <div key={key} className="inv-field-block">
                      <label className="inv-label">{lbl}</label>
                      <input className="inv-input" type={type} value={bankDraft[key] || ""} onChange={e => setBankDraft(d => ({ ...d, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="inv-field-block"><label className="inv-label">Name on Account</label><input className="inv-input" value={bankDraft.nameOnAccount || ""} onChange={e => setBankDraft(d => ({ ...d, nameOnAccount: e.target.value }))} /></div>
                  <div className="inv-field-block"><label className="inv-label">GPay Number</label><input className="inv-input" value={bankDraft.gpay || ""} onChange={e => setBankDraft(d => ({ ...d, gpay: e.target.value }))} /></div>
                  <div className="inv-field-block inv-qr-edit-block">
                    <label className="inv-label">Payment QR Code</label>
                    <div className="inv-qr-upload-box" onClick={() => qrInputRef.current?.click()}>
                      {bankDraft.qrImage
                        ? <><img src={bankDraft.qrImage} alt="QR Code" className="inv-qr-img" /><span className="inv-qr-change">✏ Change QR</span></>
                        : <><span className="inv-qr-icon">📱</span><span className="inv-qr-placeholder-text">Click to upload QR Code</span></>
                      }
                    </div>
                    <input ref={qrInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                      const f = e.target.files[0]; if (!f) return;
                      const r = new FileReader(); r.onload = ev => setBankDraft(d => ({ ...d, qrImage: ev.target.result })); r.readAsDataURL(f);
                    }} />
                  </div>
                  <div className="inv-bank-edit-actions">
                    <button className="inv-btn inv-btn--outline inv-btn--sm" onClick={() => setEditingBank(false)}>Cancel</button>
                    <button className="inv-btn inv-btn--primary inv-btn--sm" onClick={saveBank}>💾 Save</button>
                  </div>
                </div>
              ) : currentBank ? (
                <div className="inv-bank-display-with-qr">
                  <div className="inv-bank-display">
                    <div className="inv-bank-display-grid">
                      <div className="inv-bank-field"><span className="inv-bank-lbl">Name in Bank A/c</span><span className="inv-bank-val">{currentBank.nameOnAccount || ""}</span></div>
                      <div className="inv-bank-field"><span className="inv-bank-lbl">Bank Name</span><span className="inv-bank-val">{currentBank.bankName}</span></div>
                      <div className="inv-bank-field"><span className="inv-bank-lbl">Account No.</span><span className="inv-bank-val inv-bank-val--mono">{currentBank.acNo}</span></div>
                      <div className="inv-bank-field"><span className="inv-bank-lbl">Branch</span><span className="inv-bank-val">{currentBank.branch}</span></div>
                      <div className="inv-bank-field"><span className="inv-bank-lbl">IFSC Code</span><span className="inv-bank-val inv-bank-val--mono">{currentBank.ifsc}</span></div>
                      <div className="inv-bank-field"><span className="inv-bank-lbl">Account Type</span><span className="inv-bank-val">{currentBank.type}</span></div>
                      <div className="inv-bank-field"><span className="inv-bank-lbl">GPay</span><span className="inv-bank-val">{currentBank.gpay || ""}</span></div>
                    </div>
                  </div>
                  <div className="inv-qr-section">
                    <label className="inv-label">Payment QR Code</label>
                    <div className="inv-qr-upload-box" onClick={() => qrInputRef.current?.click()}>
                      {currentBank.qrImage
                        ? <><img src={currentBank.qrImage} alt="QR Code" className="inv-qr-img" /><span className="inv-qr-change">✏ Change QR</span></>
                        : <><span className="inv-qr-icon">📱</span><span className="inv-qr-placeholder-text">Click to upload QR Code</span><span className="inv-qr-hint">PNG / JPG (square preferred)</span></>
                      }
                    </div>
                    <input ref={qrInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleQrUpload} />
                    <p className="inv-qr-note">QR appears on invoice between bank details and signature.</p>
                  </div>
                </div>
              ) : (
                <div className="inv-bank-empty" style={{ padding: "16px", color: "var(--inv-text-muted)", fontSize: "0.85rem", background: "#f8fafc", border: "1px dashed var(--inv-border)", borderRadius: "var(--inv-radius-sm)", textAlign: "center" }}>
                  No bank account selected. Please select or add a bank account.
                </div>
              )}
            </div>
          </div>

          {/* ── Section 7: Signature ── */}
          <div className="inv-card">
            <div className="inv-card-header"><span className="inv-card-icon">✍</span><h2 className="inv-card-title">Authorized Signature</h2></div>
            <div className="inv-card-body">
              <div style={{ marginBottom: "16px", padding: "10px 14px", background: "#f8fafc", border: "1px solid var(--inv-border)", borderRadius: "var(--inv-radius-sm)" }}>
                <Toggle checked={showSignature} onChange={setShowSignature} label="Show Signature Image in Invoice" />
              </div>
              <div className="inv-sig-layout">
                <div className="inv-sig-fields">
                  <div className="inv-field-block"><label className="inv-label">Authorized Person Name</label><input className="inv-input" value={sigName} onChange={e => setSigName(e.target.value)} /></div>
                  <div className="inv-field-block"><label className="inv-label">Designation</label><input className="inv-input" value={sigDesig} onChange={e => setSigDesig(e.target.value)} /></div>
                </div>
                <div className="inv-sig-upload">
                  <label className="inv-label">Signature Image</label>
                  <div className="inv-sig-preview-box" onClick={() => sigInputRef.current?.click()}>
                    {sigImage ? <img src={sigImage} alt="Signature" className="inv-sig-img" /> : <div className="inv-sig-placeholder"><span>📤</span><span>Click to upload signature</span></div>}
                    <div className="inv-sig-edit-overlay"><span>✏ Change</span></div>
                  </div>
                  <input ref={sigInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSigUpload} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 8: Letter Pad ── */}
          <div className="inv-card">
            <div className="inv-card-header"><span className="inv-card-icon">🗒</span><h2 className="inv-card-title">Letter Pad Settings</h2></div>
            <div className="inv-card-body">
              <div className="inv-letterpad-row">
                <Toggle checked={useLetterPad} onChange={setUseLetterPad} label="Use Letter Pad Background for Invoice" />
              </div>
              {useLetterPad && (
                <div className="inv-letterpad-upload-row">
                  <div className="inv-letterpad-upload-box" onClick={() => letterPadInputRef.current?.click()}>
                    {letterPadImage
                      ? <><img src={letterPadImage} alt="Letterpad" className="inv-letterpad-thumb" /><span className="inv-letterpad-change">✏ Change</span></>
                      : <><span className="inv-letterpad-icon">🖼</span><span>Click to upload your letter pad image</span><span className="inv-letterpad-hint">(PNG or JPG)</span></>
                    }
                  </div>
                  <input ref={letterPadInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLetterPadUpload} />
                  {letterPadImage
                    ? <div className="inv-letterpad-info">✅ Letter pad loaded. Invoice content will be overlaid on this background.</div>
                    : <div className="inv-letterpad-info inv-letterpad-info--warn">⚠ Please upload a letter pad image.</div>
                  }
                </div>
              )}
            </div>
          </div>

          {/* ── Section 9: Export ── */}
          <div className="inv-card inv-card--export">
            <div className="inv-card-header"><span className="inv-card-icon">🚀</span><h2 className="inv-card-title">Preview & Export Invoice</h2></div>
            <div className="inv-card-body">
              <div className="inv-export-grid">
                <button className="inv-export-btn inv-export-btn--preview" onClick={() => setShowPreview(true)}><span className="inv-export-icon">👁</span><span className="inv-export-label">Preview</span><span className="inv-export-sub">View before export</span></button>
                <button className="inv-export-btn inv-export-btn--pdf" onClick={exportPDF}><span className="inv-export-icon">📄</span><span className="inv-export-label">Export PDF</span><span className="inv-export-sub">Print / Save as PDF</span></button>
                <button className="inv-export-btn inv-export-btn--image" onClick={exportImage}><span className="inv-export-icon">🖼</span><span className="inv-export-label">Export Image</span><span className="inv-export-sub">Save as PNG file</span></button>
                <button className="inv-export-btn inv-export-btn--excel" onClick={exportExcel}><span className="inv-export-icon">📊</span><span className="inv-export-label">Export Excel</span><span className="inv-export-sub">Download as CSV</span></button>
              </div>
            </div>
          </div>
        </>)}

      {/* ── Overlay Mode Panels ── */}
      {invoiceMode === "overlay" && (
        <>
          {/* Card 1: Upload */}
          <div className="inv-card">
            <div className="inv-card-header">
              <span className="inv-card-icon">📤</span>
              <h2 className="inv-card-title">Upload Client Invoice Details</h2>
            </div>
            <div className="inv-card-body">
              {pdfLoading ? (
                <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", textAlign: "center" }}>
                  <div className="inv-spinner" />
                  <span style={{ fontWeight: 600, color: "#334155" }}>Converting PDF pages to high-resolution overlay images...</span>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Please wait, this might take a moment depending on the PDF size.</span>
                </div>
              ) : !overlayFile ? (
                <div className="inv-overlay-upload-zone" onClick={() => overlayInputRef.current?.click()}>
                  <span className="inv-overlay-upload-icon">📄</span>
                  <span className="inv-overlay-upload-text">Click to select or drag & drop client invoice file</span>
                  <span className="inv-overlay-upload-sub">Supports JPG, PNG images and PDFs</span>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", border: "1px solid var(--inv-border)", borderRadius: "var(--inv-radius-sm)", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "#334155" }}>📎 {overlayFile.name}</span>
                    <span style={{ marginLeft: "8px", fontSize: "0.8rem", color: "#64748b" }}>({(overlayFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button className="inv-btn inv-btn--secondary inv-btn--sm" style={{ backgroundColor: "#ef4444", color: "#fff" }} onClick={handleClearOverlayFile}>✕ Remove</button>
                </div>
              )}
              <input ref={overlayInputRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleOverlayFileChange} />
            </div>
          </div>

          {/* Card 2: Layout Controls (visible only if file is loaded) */}
          {overlayFile && (
            <div className="inv-card">
              <div className="inv-card-header">
                <span className="inv-card-icon">⚙️</span>
                <h2 className="inv-card-title">Overlay Layout Controls</h2>
              </div>
              <div className="inv-card-body">
                <div className="inv-overlay-controls">
                  <div className="inv-overlay-control-group">
                    <label className="inv-overlay-control-label">
                      <span>Top Spacer (Header Gap)</span>
                      <span className="inv-overlay-control-val">{overlayTopSpacing}px</span>
                    </label>
                    <input type="range" min={0} max={300} className="inv-overlay-slider" value={overlayTopSpacing} onChange={e => setOverlayTopSpacing(Number(e.target.value))} />
                  </div>

                  <div className="inv-overlay-control-group">
                    <label className="inv-overlay-control-label">
                      <span>Bottom Spacer (Footer Gap)</span>
                      <span className="inv-overlay-control-val">{overlayBottomSpacing}px</span>
                    </label>
                    <input type="range" min={0} max={200} className="inv-overlay-slider" value={overlayBottomSpacing} onChange={e => setOverlayBottomSpacing(Number(e.target.value))} />
                  </div>

                  {(overlayFileType === "image" || overlayFileType === "pdf") && (
                    <>
                      <div className="inv-overlay-control-group">
                        <label className="inv-overlay-control-label">
                          <span>Scale / Width</span>
                          <span className="inv-overlay-control-val">{overlayScale}%</span>
                        </label>
                        <input type="range" min={50} max={100} className="inv-overlay-slider" value={overlayScale} onChange={e => setOverlayScale(Number(e.target.value))} />
                      </div>

                      <div className="inv-overlay-control-group" style={{ justifyContent: "center" }}>
                        <label className="inv-overlay-toggle-row">
                          <input type="checkbox" checked={overlayBlend} onChange={e => setOverlayBlend(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                          Strip White Background (Multiply Blend)
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Preview and Export */}
          {overlayFile && (
            <div className="inv-card">
              <div className="inv-card-header">
                <span className="inv-card-icon">👁</span>
                <h2 className="inv-card-title">Preview & Export</h2>
              </div>
              <div className="inv-card-body">
                <div className="inv-overlay-preview-container">
                  <span className="inv-overlay-preview-title">📝 Client Invoice Overlay Preview</span>
                  <div className="inv-document-outer" style={{ width: "100%", maxWidth: "800px" }}>
                    {overlayFileType === "image" ? (
                      <div className={`inv-document ${useLetterPad ? "inv-document--letterpad" : "inv-document--plain"}`} style={{ minHeight: "1050px" }}>
                        {useLetterPad && letterPadImage && (
                          <img src={letterPadImage} alt="Letterpad" className="inv-letterpad-bg-img" />
                        )}

                        <div style={{ height: `${overlayTopSpacing}px` }} />

                        <div className="inv-document-overlay-content">
                          <img
                            src={overlayFileUrl}
                            alt="Client Invoice Details"
                            className="inv-overlay-img"
                            style={{
                              width: `${overlayScale}%`,
                              mixBlendMode: overlayBlend ? "multiply" : "normal"
                            }}
                          />
                        </div>

                        <div style={{ height: `${overlayBottomSpacing}px` }} />
                      </div>
                    ) : (
                      pdfPages.map((pageUrl, idx) => (
                        <div key={idx} className={`inv-document ${useLetterPad ? "inv-document--letterpad" : "inv-document--plain"}`} style={{ minHeight: "1050px", marginBottom: "20px" }}>
                          {useLetterPad && letterPadImage && (
                            <img src={letterPadImage} alt="Letterpad" className="inv-letterpad-bg-img" />
                          )}

                          <div style={{ height: `${overlayTopSpacing}px` }} />

                          <div className="inv-document-overlay-content">
                            <img
                              src={pageUrl}
                              alt={`Client Invoice Page ${idx + 1}`}
                              className="inv-overlay-img"
                              style={{
                                width: `${overlayScale}%`,
                                mixBlendMode: overlayBlend ? "multiply" : "normal"
                              }}
                            />
                          </div>

                          <div style={{ height: `${overlayBottomSpacing}px` }} />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="inv-export-grid" style={{ marginTop: "20px" }}>
                  <button className="inv-export-btn inv-export-btn--preview" onClick={() => setShowPreview(true)}><span className="inv-export-icon">👁</span><span className="inv-export-label">Preview Modal</span><span className="inv-export-sub">Full screen preview</span></button>
                  <button className="inv-export-btn inv-export-btn--pdf" onClick={exportPDF}><span className="inv-export-icon">📄</span><span className="inv-export-label">Export PDF</span><span className="inv-export-sub">Print / Save as PDF</span></button>
                  {overlayFileType === "image" && (
                    <button className="inv-export-btn inv-export-btn--image" onClick={exportImage}><span className="inv-export-icon">🖼</span><span className="inv-export-label">Export Image</span><span className="inv-export-sub">Save as PNG file</span></button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Client Modal ── */}
      {showClientModal && (
        <div className="inv-modal-overlay" onClick={() => setShowClientModal(false)}>
          <div className="inv-modal" onClick={e => e.stopPropagation()}>
            <div className="inv-modal-header"><h3>{clientModalMode === "add" ? "Add New Client" : "Edit Client"}</h3><button className="inv-modal-close" onClick={() => setShowClientModal(false)}>✕</button></div>
            <div className="inv-modal-body">
              <div className="inv-field-block"><label className="inv-label">Company Name (Short Form)</label><input className="inv-input" value={clientDraft.name} onChange={e => setClientDraft(d => ({ ...d, name: e.target.value }))} placeholder="Company short name" /></div>
              <div className="inv-field-block"><label className="inv-label">Company Full Name (for Invoice display)</label><input className="inv-input" value={clientDraft.companyFullName || ""} onChange={e => setClientDraft(d => ({ ...d, companyFullName: e.target.value }))} placeholder="Company full name" /></div>
              <div className="inv-field-block"><label className="inv-label">Company Address</label><textarea className="inv-textarea" rows={4} value={clientDraft.address} onChange={e => setClientDraft(d => ({ ...d, address: e.target.value }))} placeholder="Full address" /></div>
            </div>
            <div className="inv-modal-footer">
              <button className="inv-btn inv-btn--outline" onClick={() => setShowClientModal(false)}>Cancel</button>
              <button className="inv-btn inv-btn--primary" onClick={saveClientModal}>{clientModalMode === "add" ? "Add Client" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Bank Modal ── */}
      {showAddBank && (
        <div className="inv-modal-overlay" onClick={() => setShowAddBank(false)}>
          <div className="inv-modal inv-modal--bank" onClick={e => e.stopPropagation()}>
            <div className="inv-modal-header"><h3>Add New Bank Account</h3><button className="inv-modal-close" onClick={() => setShowAddBank(false)}>✕</button></div>
            <div className="inv-modal-body">
              <div className="inv-modal-grid">
                {[["label", "Account Label (shown in selector)"], ["bankName", "Bank Name"], ["acNo", "Account Number"], ["branch", "Branch"], ["ifsc", "IFSC Code"], ["type", "Account Type (Current/Savings)"], ["nameOnAccount", "Name in Bank A/c"], ["gpay", "GPay Number"]].map(([key, lbl]) => (
                  <div key={key} className="inv-field-block" style={{ marginBottom: 0 }}>
                    <label className="inv-label">{lbl}</label>
                    <input className="inv-input" value={newBankDraft[key] || ""} onChange={e => setNewBankDraft(d => ({ ...d, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="inv-modal-footer">
              <button className="inv-btn inv-btn--outline" onClick={() => setShowAddBank(false)}>Cancel</button>
              <button className="inv-btn inv-btn--primary" onClick={saveNewBank}>Add Bank Account</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          INVOICE PREVIEW MODAL
      ══════════════════════════════════════════════════ */}
      {showPreview && (
        <div className="inv-modal-overlay inv-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="inv-preview-wrapper" onClick={e => e.stopPropagation()}>
            <div className="inv-preview-bar">
              <span className="inv-preview-bar-title">Invoice Preview</span>
              <div className="inv-preview-bar-actions">
                <button className="inv-btn inv-btn--primary inv-btn--sm" onClick={exportPDF}>🖨 Print / Save PDF</button>
                {!(invoiceMode === "overlay" && overlayFileType === "pdf") && (
                  <button className="inv-btn inv-btn--secondary inv-btn--sm" onClick={exportImage}>🖼 Export Image</button>
                )}
                {invoiceMode === "standard" && (
                  <>
                    <button className="inv-btn inv-btn--secondary inv-btn--sm" onClick={exportExcel}>📊 Export Excel</button>
                    <button className="inv-btn inv-btn--secondary inv-btn--sm" onClick={exportWord}>📝 Export Word</button>
                  </>
                )}
                <button className="inv-btn inv-btn--outline inv-btn--sm" onClick={() => setShowPreview(false)}>✕ Close</button>
              </div>
            </div>

            <div className={`inv-document-outer ${invoiceMode === "overlay" ? "inv-preview-overlay-active" : ""}`}>
              {invoiceMode === "standard" ? (
                <div className={`inv-document ${useLetterPad ? "inv-document--letterpad" : "inv-document--plain"}`} id="inv-printable-doc">
                  {useLetterPad && letterPadImage && (
                    <img src={letterPadImage} alt="Letterpad" className="inv-letterpad-bg-img" />
                  )}
                  {useLetterPad && <div className="inv-doc-letterpad-spacer" />}

                  {/* ── META TABLE ── */}
                  <table className="inv-doc-meta-table">
                    <tbody>
                      <tr>
                        <td className="inv-doc-meta-lbl" rowSpan={2}><strong>VENDOR NAME:</strong></td>
                        <td className="inv-doc-meta-val" rowSpan={2}>
                          <strong>{vendorName.toUpperCase()}</strong>
                          <small>{vendorAddress}</small>
                        </td>
                        <td className="inv-doc-meta-lbl-r"><strong>INVOICE No:</strong></td>
                        <td className="inv-doc-meta-val-r">{invoiceNo}</td>
                      </tr>
                      <tr>
                        <td className="inv-doc-meta-lbl-r"><strong>INVOICE DATE:</strong></td>
                        <td className="inv-doc-meta-val-r">{invoiceDate ? new Date(invoiceDate).toLocaleDateString("en-GB").replace(/\//g, "-") : ""}</td>
                      </tr>
                      <tr>
                        <td className="inv-doc-meta-lbl" rowSpan={2}><strong>INVOICE TO:</strong></td>
                        <td className="inv-doc-meta-val" rowSpan={2}>
                          <strong>{clientName}</strong>
                          <small>{currentClient?.address}</small>
                        </td>
                        <td className="inv-doc-meta-lbl-r"><strong>PAN No:</strong></td>
                        <td className="inv-doc-meta-val-r">{panNo}</td>
                      </tr>
                      <tr>
                        <td className="inv-doc-meta-lbl-r"><strong>GSTIN No:</strong></td>
                        <td className="inv-doc-meta-val-r">{gstinNo || " "}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Title row */}
                  <div className="inv-doc-title">
                    <b>INVOICE OF {vendorName.toUpperCase()} FOR THE MONTH OF {titleMonth.toUpperCase()} - {titleYear}</b>
                  </div>

                  {/* ── Invoice Table — fully flexible with consistent borders ── */}
                  <div className="inv-doc-table-wrap">
                    <table className="inv-doc-table" style={{ '--inv-doc-font-size': (4 + enabledOptCols.length) >= 10 ? '7.5px' : (4 + enabledOptCols.length) >= 8 ? '8.5px' : (4 + enabledOptCols.length) >= 6 ? '9.2px' : '10px' }}>
                      <thead>
                        <tr>
                          <th className="inv-doc-th--sno">S.No</th>
                          {enabledOptCols.map(c => (
                            <th key={c.key} className={c.key === "orderPages" ? "inv-doc-th--page" : c.key === "ratePage" ? "inv-doc-th--rate" : ""}>
                              {colHeaders[c.key] || c.label}
                            </th>
                          ))}
                          <th>Amount(₹)</th>
                          <th className="inv-doc-th--penalty">Penalty(₹)</th>
                          <th>Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr key={row.id}>
                            <td className="inv-doc-td--center">{idx + 1}</td>
                            {enabledOptCols.map(c => (
                              <td key={c.key} className={`${["orderPages", "ratePage"].includes(c.key) ? "inv-doc-td--num" : ""} ${c.key === "orderPages" ? "inv-doc-td--page" : c.key === "ratePage" ? "inv-doc-td--rate" : ""}`}>
                                {["startDate", "endDate", "receivedDate", "uploadedDate"].includes(c.key) ? formatDate(row[c.key]) : row[c.key]}
                              </td>
                            ))}
                            <td className="inv-doc-td--num">{row.amount ? Number(row.amount).toLocaleString("en-IN") : ""}</td>
                            <td className="inv-doc-td--num inv-doc-td--penalty">{row.deductionAmount ? Number(row.deductionAmount).toLocaleString("en-IN") : "-"}</td>
                            <td className="inv-doc-td--num inv-doc-td--total">{row.totalAmount ? Number(row.totalAmount).toLocaleString("en-IN") : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <table className="inv-doc-totals-table">
                    <tbody>
                      <tr>
                        <td className="inv-doc-words-cell" rowSpan={3}>
                          <strong>Amount in Words: </strong>
                          <span>{grandTotal > 0 ? numberToWords(grandTotal) : "—"} /-</span>
                        </td>
                        <td className="inv-doc-total-label-cell"><strong>TOTAL:</strong></td>
                        <td className="inv-doc-total-val-cell">{fmt(subTotal)}</td>
                      </tr>
                      <tr>
                        <td className="inv-doc-total-label-cell"><strong>IGST ({igstPct}%):</strong></td>
                        <td className="inv-doc-total-val-cell">{fmt(igstAmt)}</td>
                      </tr>
                      <tr>
                        <td className="inv-doc-total-label-cell inv-doc-grand-label"><strong>GRAND TOTAL:</strong></td>
                        <td className="inv-doc-total-val-cell inv-doc-grand-val"><strong>{fmt(grandTotal)}</strong></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Bottom: Bank | Signature */}
                  <div className="inv-doc-bottom">
                    <div className="inv-doc-bank">
                      <div className="inv-doc-bank-title">BANK DETAILS:</div>
                      {currentBank ? (
                        <table className="inv-doc-bank-table">
                          <tbody>
                            <tr><td><strong>NAME IN BANK A/C</strong></td><td><strong>:</strong></td><td>{(currentBank.nameOnAccount || "").toUpperCase()}</td></tr>
                            <tr><td><strong>BANK NAME</strong></td>        <td><strong>:</strong></td><td>{currentBank.bankName}</td></tr>
                            <tr><td><strong>BANK A/C NO</strong></td>      <td><strong>:</strong></td><td>{currentBank.acNo}</td></tr>
                            <tr><td><strong>BRANCH</strong></td>           <td><strong>:</strong></td><td>{currentBank.branch}</td></tr>
                            <tr><td><strong>IFSC CODE</strong></td>        <td><strong>:</strong></td><td>{currentBank.ifsc}</td></tr>
                            <tr><td><strong>GPAY</strong></td>             <td><strong>:</strong></td><td>{currentBank.gpay || ""}</td></tr>
                            {showQr && (
                              <tr>
                                <td><strong>E-Pay QR</strong></td>
                                <td><strong>:</strong></td>
                                <td>
                                  <div className="inv-doc-qr">
                                    {currentBank.qrImage ? (
                                      <img src={currentBank.qrImage} alt="Payment QR" className="inv-doc-qr-img" />
                                    ) : (
                                      <div className="inv-doc-qr-placeholder">
                                        <span className="inv-doc-qr-placeholder-icon">📱</span>
                                        <span className="inv-doc-qr-placeholder-text">E-Pay QR</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ color: "#ef4444", fontWeight: "bold", padding: "8px 0" }}>
                          ⚠️ No bank details selected. Please select a bank account.
                        </div>
                      )}
                    </div>

                    {/* ── SIGNATURE FIX:
                      - showSignature=true  → show image + label + name + designation
                      - showSignature=false → show label + name + designation ONLY (no image)
                  ── */}
                    <div className="inv-doc-sig">
                      {showSignature && sigImage && (
                        <div className="inv-doc-sig-img-wrap">
                          <img src={sigImage} alt="Signature" className="inv-doc-sig-img" />
                        </div>
                      )}
                      <div className="inv-doc-sig-label"><strong>AUTHORISED SIGNATORY</strong></div>
                      <div className="inv-doc-sig-name"><strong>Name:</strong> {sigName}</div>
                      <div className="inv-doc-sig-desig"><strong>Designation:</strong> {sigDesig}</div>
                    </div>
                  </div>

                  {useLetterPad && <div className="inv-doc-letterpad-footer-spacer" />}
                </div>
              ) : overlayFileType === "image" ? (
                <div className={`inv-document ${useLetterPad ? "inv-document--letterpad" : "inv-document--plain"} inv-document-overlay-page`} id="inv-printable-doc" style={{ minHeight: "1050px" }}>
                  {useLetterPad && letterPadImage && (
                    <img src={letterPadImage} alt="Letterpad" className="inv-letterpad-bg-img" />
                  )}
                  <div style={{ height: `${overlayTopSpacing}px` }} />
                  <div className="inv-document-overlay-content">
                    <img
                      src={overlayFileUrl}
                      alt="Client Invoice Details"
                      className="inv-overlay-img"
                      style={{
                        width: `${overlayScale}%`,
                        mixBlendMode: overlayBlend ? "multiply" : "normal"
                      }}
                    />
                  </div>
                  <div style={{ height: `${overlayBottomSpacing}px` }} />
                </div>
              ) : (
                <div id="inv-printable-doc" style={{ width: "100%" }}>
                  {pdfPages.map((pageUrl, idx) => (
                    <div key={idx} className={`inv-document ${useLetterPad ? "inv-document--letterpad" : "inv-document--plain"} inv-document-overlay-page`} style={{ minHeight: "1050px", marginBottom: "20px" }}>
                      {useLetterPad && letterPadImage && (
                        <img src={letterPadImage} alt="Letterpad" className="inv-letterpad-bg-img" />
                      )}
                      <div style={{ height: `${overlayTopSpacing}px` }} />
                      <div className="inv-document-overlay-content">
                        <img
                          src={pageUrl}
                          alt={`Client Invoice Page ${idx + 1}`}
                          className="inv-overlay-img"
                          style={{
                            width: `${overlayScale}%`,
                            mixBlendMode: overlayBlend ? "multiply" : "normal"
                          }}
                        />
                      </div>
                      <div style={{ height: `${overlayBottomSpacing}px` }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>{/* end inv-preview-wrapper */}
        </div>
      )}

    </div>
  );
}



