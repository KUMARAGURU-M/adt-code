import React, {
  useState, useMemo, useEffect, useRef, useCallback
} from 'react';
import './Attendance.css';

import { apiCall } from '../../utils/api';

// ── Constants ─────────────────────────────────────────────────────
const STATUS = {
  P: { code: 'P', label: 'Present', short: 'P', color: '#16a34a' },
  A: { code: 'A', label: 'Absent', short: 'A', color: '#dc2626' },
  H: { code: 'H', label: 'Half Day', short: 'H', color: '#d97706' },
  PH: { code: 'PH', label: 'Paid Holiday', short: 'PH', color: '#7c3aed' },
  WO: { code: 'WO', label: 'Week Off (Sun)', short: 'WO', color: '#64748b' },
  '-': { code: '-', label: 'Not Applicable', short: '-', color: '#cbd5e0' },
};

const CATEGORIES = [
  'Management', 'Admin', 'Vendor Management',
  'Senior Operator', 'Operator', 'Coordinator',
  'Employee', 'Team Leader', 'Manager',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth();
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Local helpers (no API) ────────────────────────────────────────
const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getDayOfWeek = (y, m, d) => new Date(y, m, d).getDay();

function buildDays(year, month) {
  const total = getDaysInMonth(year, month);
  return Array.from({ length: total }, (_, i) => {
    const d = i + 1;
    const dow = getDayOfWeek(year, month, d);
    return { day: d, dow, isSunday: dow === 0 };
  });
}

function countWorkingDays(year, month) {
  return buildDays(year, month).filter(d => !d.isSunday).length;
}

// Initialize local attendance map with PH on Sundays
function initLocalRecord(year, month, employees) {
  const days = buildDays(year, month);
  const rec = {};
  employees.forEach(emp => {
    rec[emp.id] = {};
    days.forEach(({ day, isSunday }) => {
      rec[emp.id][day] = isSunday ? 'PH' : '';
    });
  });
  return rec;
}

function computeSummary(empRecord, year, month) {
  const days = buildDays(year, month);
  let present = 0, absent = 0, half = 0, ph = 0, wo = 0;
  days.forEach(({ day, isSunday }) => {
    const s = empRecord[day] || (isSunday ? 'PH' : '');
    if (s === 'P') present++;
    else if (s === 'A') absent++;
    else if (s === 'H') { present += 0.5; half++; }
    else if (s === 'PH') ph++;
    else if (s === 'WO') wo++;
  });
  const workingDays = countWorkingDays(year, month);
  const totalForWages = present + ph + wo;
  return { present, absent, half, ph, wo, workingDays, totalForWages };
}

// ── Modal wrapper ─────────────────────────────────────────────────
const Modal = ({ onClose, children, wide }) => (
  <div className="att-modal-overlay" onClick={onClose}>
    <div
      className={`att-modal-box${wide ? ' att-modal-wide' : ''}`}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

// ── Status Cell ───────────────────────────────────────────────────
const CYCLE_WEEKDAY = {
  '': 'P', P: 'A', A: 'H', H: 'PH', PH: '',
};
const CYCLE_SUNDAY = {
  '': 'PH', PH: 'WO', WO: 'P', P: 'A', A: 'H', H: 'PH',
};

const StatusCell = ({ value, onChange, isSunday }) => {
  const cycle = isSunday ? CYCLE_SUNDAY : CYCLE_WEEKDAY;
  const s = STATUS[value] || STATUS['-'];
  return (
    <button
      className={`att-cell att-cell-${(value || 'empty').toLowerCase()}`}
      style={{ color: s.color, borderColor: s.color + '40' }}
      onClick={() => onChange(cycle[value] ?? (isSunday ? 'PH' : ''))}
      title={s.label}
    >
      {value || '·'}
    </button>
  );
};

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [salaryDetails, setSalaryDetails] = useState({});
  const [hiddenEmpIds, setHiddenEmpIds] = useState(new Set());

  const [selYear, setSelYear] = useState(CURRENT_YEAR);
  const [selMonth, setSelMonth] = useState(CURRENT_MONTH);

  const [filterCat, setFilterCat] = useState('');
  const [filterName, setFilterName] = useState('');
  const [activeView, setActiveView] = useState('monthly');
  const [modal, setModal] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Scroll sync refs
  const monthlyTopRef = useRef(null);
  const monthlyTableRef = useRef(null);
  const summaryTopRef = useRef(null);
  const summaryTableRef = useRef(null);
  const [monthlyW, setMonthlyW] = useState(0);
  const [summaryW, setSummaryW] = useState(0);

  const syncScroll = (src, tgt) => {
    if (src.current && tgt.current) {
      tgt.current.scrollLeft = src.current.scrollLeft;
    }
  };

  // ── Load monthly data from backend ───────────────────────────
  const loadMonth = useCallback(async (year, month) => {
    try {
      setLoading(true);
      const data = await apiCall(
        `/attendance/monthly?year=${year}&month=${month}`);

      setEmployees(data.employees || []);

      // Merge backend records with Sunday defaults
      const days = buildDays(year, month);
      const att = {};
      (data.employees || []).forEach(emp => {
        att[emp.id] = {};
        days.forEach(({ day, isSunday }) => {
          const backendVal = data.attendance?.[emp.id]?.[day];
          att[emp.id][day] = backendVal !== undefined
            ? backendVal
            : (isSunday ? 'PH' : '');
        });
      });
      setAttendance(att);

      // Salary details: keyed by employeeId
      const sal = {};
      if (data.salaryDetails) {
        Object.entries(data.salaryDetails).forEach(([empId, detail]) => {
          sal[empId] = detail;
        });
      }
      setSalaryDetails(sal);

    } catch (err) {
      console.error('Failed to load attendance:', err.message);
      // Fallback to empty local state
      setAttendance({});
      setSalaryDetails({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonth(selYear, selMonth);
  }, [selYear, selMonth, loadMonth]);

  // ── Scroll width observers ────────────────────────────────────
  useEffect(() => {
    if (activeView !== 'monthly' || !monthlyTableRef.current) return;
    const el = monthlyTableRef.current;
    setMonthlyW(el.scrollWidth);
    const ro = new ResizeObserver(() => setMonthlyW(el.scrollWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeView, employees]);

  useEffect(() => {
    if (activeView !== 'summary' || !summaryTableRef.current) return;
    const el = summaryTableRef.current;
    setSummaryW(el.scrollWidth);
    const ro = new ResizeObserver(() => setSummaryW(el.scrollWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeView, employees]);

  // ── Filtered employees ────────────────────────────────────────
  const filtered = useMemo(() =>
    employees.filter(e =>
      (!filterCat || e.category === filterCat) &&
      (!filterName || e.name.toLowerCase()
        .includes(filterName.toLowerCase()))
    ), [employees, filterCat, filterName]);

  const days = useMemo(
    () => buildDays(selYear, selMonth),
    [selYear, selMonth]
  );

  // ── Update single cell (local state only) ──────────────────────
  const updateCell = useCallback((empId, day, val) => {
    setAttendance(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [day]: val },
    }));
  }, []);

  // ── Quick mark all employees for a day (local state only) ──────
  const quickMarkDay = useCallback((day, status) => {
    const isSunday = days.find(d => d.day === day)?.isSunday;
    const finalStatus = status === 'CLEAR' ? (isSunday ? 'PH' : '') : status;

    setAttendance(prev => {
      const next = { ...prev };
      employees.forEach(emp => {
        next[emp.id] = { ...next[emp.id], [day]: finalStatus };
      });
      return next;
    });
  }, [employees, days]);

  const handleSaveAttendance = useCallback(async () => {
    setSavingAttendance(true);
    try {
      await apiCall('/attendance/monthly/save', 'POST', {
        year: selYear,
        month: selMonth,
        attendance: attendance,
      });
      alert('Attendance updated successfully!');
    } catch (err) {
      console.error('Save failed:', err.message);
      alert('Failed to save attendance: ' + err.message);
    } finally {
      setSavingAttendance(false);
    }
  }, [selYear, selMonth, attendance]);

  const handleClearMonthData = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to permanently clear all attendance records and salary details for ${MONTHS[selMonth]} ${selYear}? This will delete everything for this month in the database and cannot be undone.`)) {
      return;
    }

    try {
      await apiCall(`/attendance/monthly?year=${selYear}&month=${selMonth}`, 'DELETE');
      alert('Attendance month data cleared successfully!');
      loadMonth(selYear, selMonth);
    } catch (err) {
      alert('Failed to clear month data: ' + err.message);
    }
  }, [selYear, selMonth, loadMonth]);

  // ── Salary detail helpers ─────────────────────────────────────
  const getSalaryDetail = (empId, field, fallback = '') => {
    const detail = salaryDetails[empId];
    const val = detail?.[field];
    if (val === undefined || val === null || val === '') return fallback;
    return val;
  };

  const updateSalaryDetail = useCallback(async (empId, field, val) => {
    // Optimistic
    setSalaryDetails(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: val },
    }));

    // Persist to backend
    try {
      const emp = employees.find(e => e.id === empId);
      const payload = {
        employeeId: empId,
        year: selYear,
        month: selMonth,
        baseSalary: field === 'baseSalary'
          ? Number(val)
          : (salaryDetails[empId]?.baseSalary ?? emp?.baseSalary),
        incentive: field === 'incentive'
          ? Number(val)
          : Number(salaryDetails[empId]?.incentive ?? 0),
        advance: field === 'advance'
          ? Number(val)
          : Number(salaryDetails[empId]?.advance ?? 0),
        salaryStatus: field === 'salaryStatus'
          ? val
          : (salaryDetails[empId]?.salaryStatus ?? 'pending'),
        isHidden: field === 'isHidden'
          ? val
          : (salaryDetails[empId]?.isHidden ?? false),
      };
      await apiCall('/attendance/salary-detail', 'POST', payload);
    } catch (err) {
      console.error('Salary detail save failed:', err.message);
    }
  }, [employees, salaryDetails, selYear, selMonth]);

  const toggleHide = useCallback(async (empId) => {
    const current = salaryDetails[empId]?.isHidden ?? false;
    await updateSalaryDetail(empId, 'isHidden', !current);
    setHiddenEmpIds(prev => {
      const next = new Set(prev);
      if (!current) next.add(empId); else next.delete(empId);
      return next;
    });
  }, [salaryDetails, updateSalaryDetail]);

  // ── Summaries ─────────────────────────────────────────────────
  const summaries = useMemo(() =>
    employees.map(emp => ({
      emp,
      ...computeSummary(attendance[emp.id] || {}, selYear, selMonth),
    })), [employees, attendance, selYear, selMonth]);

  const totalMonthlySalary = useMemo(() =>
    summaries.reduce((sum, s) => {
      const detail = salaryDetails[s.emp.id];
      const basic = Number(detail?.baseSalary ?? s.emp.baseSalary ?? 5000);
      const perDay = basic / 31;
      const net = perDay * s.totalForWages;
      const incentive = Number(detail?.incentive ?? 0);
      const advance = Number(detail?.advance ?? 0);
      return sum + net + incentive - advance;
    }, 0),
    [summaries, salaryDetails]);

  // ── Yearly summary ────────────────────────────────────────────
  const yearlySummary = useMemo(() =>
    employees.map(emp => {
      let totalPresent = 0, totalAbsent = 0, totalWorking = 0;
      for (let m = 0; m < 12; m++) {
        const s = computeSummary(
          attendance[emp.id] || {}, selYear, m);
        totalPresent += s.present;
        totalAbsent += s.absent;
        totalWorking += s.workingDays;
      }
      return { emp, totalPresent, totalAbsent, totalWorking };
    }), [employees, attendance, selYear]);

  const workingDaysCount = useMemo(
    () => countWorkingDays(selYear, selMonth),
    [selYear, selMonth]
  );

  // ── Add Employee Modal ────────────────────────────────────────
  const AddEmpModal = () => {
    const [form, setForm] = useState({
      name: '', category: CATEGORIES[0], salary: '5000', gpay: ''
    });
    const [saving, setSaving] = useState(false);

    const submit = async () => {
      if (!form.name.trim()) { alert('Name is required'); return; }
      setSaving(true);
      try {
        const emp = await apiCall('/attendance/employees', 'POST', {
          name: form.name.trim(),
          category: form.category,
          gpayNumber: form.gpay.trim() || null,
          baseSalary: Number(form.salary) || 5000,
        });
        setEmployees(prev => [...prev, emp]);
        setAttendance(prev => {
          const rec = initLocalRecord(selYear, selMonth, [emp]);
          return { ...prev, [emp.id]: rec[emp.id] };
        });
        setModal(null);
      } catch (e) { alert('Error: ' + e.message); }
      finally { setSaving(false); }
    };

    return (
      <Modal onClose={() => setModal(null)}>
        <h2 className="att-modal-title">Add Employee</h2>
        <div className="att-form-group">
          <label>Name <span className="att-req">*</span></label>
          <input className="att-input" placeholder="Full name"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="att-form-group">
          <label>Category</label>
          <select className="att-select" value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="att-form-group">
          <label>GPay Number</label>
          <input className="att-input" placeholder="GPay Number"
            value={form.gpay}
            onChange={e => setForm(p => ({ ...p, gpay: e.target.value }))} />
        </div>
        <div className="att-form-group">
          <label>Salary <span className="att-req">*</span></label>
          <div className="att-input-with-icon">
            <span className="att-input-icon">₹</span>
            <input type="number"
              className="att-input att-input-icon-padded"
              placeholder="Monthly Salary"
              value={form.salary}
              onChange={e => setForm(p =>
                ({ ...p, salary: e.target.value }))} />
          </div>
        </div>
        <div className="att-modal-actions">
          <button className="att-btn-cancel"
            onClick={() => setModal(null)}>Cancel</button>
          <button className="att-btn-primary"
            onClick={submit} disabled={saving}>
            {saving ? 'Adding...' : 'Add Employee'}
          </button>
        </div>
      </Modal>
    );
  };

  // ── Employee Detail Modal ─────────────────────────────────────
  const EmpDetailModal = ({ emp }) => {
    const s = computeSummary(
      attendance[emp.id] || {}, selYear, selMonth);
    const pct = s.workingDays > 0
      ? Math.round((s.present / s.workingDays) * 100) : 0;
    return (
      <Modal onClose={() => setModal(null)}>
        <h2 className="att-modal-title">📋 {emp.name}</h2>
        <p className="att-modal-sub">
          {emp.category} · {MONTHS[selMonth]} {selYear}
        </p>
        <div className="att-detail-grid">
          {[
            ['green', s.present, 'Present'],
            ['red', s.absent, 'Absent'],
            ['amber', s.half, 'Half Days'],
            ['purple', s.ph, 'Paid Holidays'],
            ['blue', s.workingDays, 'Working Days'],
            ['teal', s.totalForWages, 'Days for Wages'],
          ].map(([color, val, lbl]) => (
            <div key={lbl} className={`att-detail-card ${color}`}>
              <span className="att-detail-val">{val}</span>
              <span className="att-detail-lbl">{lbl}</span>
            </div>
          ))}
        </div>
        <div className="att-pct-bar-wrap">
          <div className="att-pct-label">Attendance: {pct}%</div>
          <div className="att-pct-track">
            <div className="att-pct-fill" style={{
              width: `${pct}%`,
              background: pct >= 75 ? '#16a34a'
                : pct >= 50 ? '#d97706' : '#dc2626'
            }} />
          </div>
        </div>
        <div className="att-modal-actions">
          <button className="att-btn-cancel"
            onClick={() => setModal(null)}>Close</button>
        </div>
      </Modal>
    );
  };

  // ── Edit Employee Modal ───────────────────────────────────────
  const EditEmpModal = ({ emp }) => {
    const [salary, setSalary] = useState(
      String(getSalaryDetail(emp.id, 'baseSalary', emp.baseSalary ?? 5000)));
    const [gpay, setGpay] = useState(emp.gpayNumber || '');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
      setSaving(true);
      try {
        const updated = await apiCall(
          `/attendance/employees/${emp.id}`, 'PUT', {
          name: emp.name,
          category: emp.category,
          gpayNumber: gpay.trim() || null,
          baseSalary: Number(salary) || 5000,
        });
        setEmployees(prev =>
          prev.map(e => e.id === emp.id ? updated : e));
        // Also update salary detail override
        await updateSalaryDetail(emp.id, 'baseSalary', Number(salary));
        setModal(null);
      } catch (e) { alert('Error: ' + e.message); }
      finally { setSaving(false); }
    };

    return (
      <Modal onClose={() => setModal(null)}>
        <h2 className="att-modal-title">Edit Employee Details</h2>
        <div className="att-form-group">
          <label>Name</label>
          <div className="att-read-only-text" style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', color: '#374151', fontWeight: 500 }}>
            {emp.name}
          </div>
        </div>
        <div className="att-form-group">
          <label>Role</label>
          <div className="att-read-only-text" style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', color: '#374151', fontWeight: 500 }}>
            {emp.category}
          </div>
        </div>
        <div className="att-form-group">
          <label>GPay Number</label>
          <input className="att-input" placeholder="GPay Number"
            value={gpay}
            onChange={e => setGpay(e.target.value)} />
        </div>
        <div className="att-form-group">
          <label>Base Salary <span className="att-req">*</span></label>
          <div className="att-input-with-icon">
            <span className="att-input-icon">₹</span>
            <input type="number"
              className="att-input att-input-icon-padded"
              value={salary}
              onChange={e => setSalary(e.target.value)} />
          </div>
        </div>
        <div className="att-modal-actions">
          <button className="att-btn-cancel"
            onClick={() => setModal(null)}>Cancel</button>
          <button className="att-btn-primary"
            onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    );
  };

  // ── Delete Confirm Modal ──────────────────────────────────────
  const DeleteConfirmModal = ({ emp }) => {
    const [deleting, setDeleting] = useState(false);
    const confirm = async () => {
      setDeleting(true);
      try {
        await apiCall(`/attendance/employees/${emp.id}`, 'DELETE');
        setEmployees(prev => prev.filter(e => e.id !== emp.id));
        setModal(null);
      } catch (e) { alert('Error: ' + e.message); }
      finally { setDeleting(false); }
    };
    return (
      <Modal onClose={() => setModal(null)}>
        <h2 className="att-modal-title">Delete Employee</h2>
        <p className="att-modal-sub" style={{
          margin: '12px 0 20px', fontSize: '0.88rem', color: '#4b5563'
        }}>
          Are you sure you want to delete <strong>{emp.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="att-modal-actions" style={{ marginTop: 0 }}>
          <button className="att-btn-cancel"
            onClick={() => setModal(null)}>Cancel</button>
          <button className="att-btn-primary"
            style={{ backgroundColor: '#dc2626' }}
            onClick={confirm} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    );
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="att-container">

      {/* ── Header ── */}
      <div className="att-page-header">
        <div className="att-page-title">
          <span className="att-page-icon">🗓️</span>
          <h2>Attendance Management</h2>
        </div>
        <div className="att-header-actions" style={{ display: 'flex', gap: '10px' }}>
          {activeView === 'monthly' && (
            <>
              <button
                className="att-btn-mark"
                style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c' }}
                onClick={handleClearMonthData}
              >
                🗑️ Clear Month Data
              </button>
              <button
                className="att-btn-mark"
                onClick={handleSaveAttendance}
                disabled={savingAttendance}
              >
                {savingAttendance ? 'Saving...' : '💾 Update Attendance'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="att-controls">
        <div className="att-date-selectors">
          <select className="att-select-ctrl" value={selMonth}
            onChange={e => setSelMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select className="att-select-ctrl" value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="att-filters">
          <input className="att-filter-input"
            placeholder="Search employee..."
            value={filterName}
            onChange={e => setFilterName(e.target.value)} />
          <select className="att-select-ctrl" value={filterCat}
            onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Roles</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="att-view-tabs">
          {[
            ['monthly', '📅 Monthly'],
            ['summary', '📊 Summary'],
            ['yearly', '📈 Yearly'],
          ].map(([v, l]) => (
            <button key={v}
              className={`att-view-tab${activeView === v ? ' active' : ''}`}
              onClick={() => setActiveView(v)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Info bar ── */}
      <div className="att-info-bar">
        <span>📅 <strong>{MONTHS[selMonth]} {selYear}</strong></span>
        <span>⚙️ Working Days: <strong>{workingDaysCount}</strong></span>
        <span>👥 Employees: <strong>{filtered.length}</strong></span>
        <div className="att-legend">
          {Object.values(STATUS).filter(s => s.code !== '-').map(s => (
            <span key={s.code} className="att-legend-item"
              style={{ color: s.color }}>
              <span className="att-legend-dot"
                style={{ background: s.color }} />
              {s.short} = {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          padding: '40px', textAlign: 'center', color: '#888'
        }}>
          Loading attendance data...
        </div>
      )}

      {/* ══ MONTHLY VIEW ══════════════════════════════════════════ */}
      {!loading && activeView === 'monthly' && (
        <div className="att-table-card">
          <div ref={monthlyTopRef} className="att-top-scroll-wrapper"
            onScroll={() => syncScroll(monthlyTopRef, monthlyTableRef)}>
            <div style={{ width: `${monthlyW}px`, height: '1px' }} />
          </div>
          <div ref={monthlyTableRef} className="att-table-scroll"
            onScroll={() => syncScroll(monthlyTableRef, monthlyTopRef)}>
            <table className="att-table">
              <thead>
                <tr>
                  <th className="att-th-sticky att-th-sno">ID</th>
                  <th className="att-th-sticky att-th-name">Employee</th>
                  <th className="att-th-sticky att-th-cat">Role</th>
                  {days.map(({ day, dow, isSunday }) => (
                    <th key={day}
                      className={`att-th-day${isSunday ? ' att-th-sunday' : ''}`}
                      title={DOW_NAMES[dow]}>
                      <div className="att-th-day-inner">
                        <span className="att-th-day-num">{day}</span>
                        <span className="att-th-day-name">
                          {DOW_NAMES[dow].slice(0, 2)}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="att-th-total">P</th>
                  <th className="att-th-total">A</th>
                  <th className="att-th-total">H</th>
                  <th className="att-th-total">PH</th>
                  <th className="att-th-total att-th-wages">Wages Days</th>
                </tr>

                {/* Quick mark row */}
                <tr className="att-mark-row">
                  <td colSpan={3} className="att-mark-label">
                    Quick Mark Day →
                  </td>
                  {days.map(({ day, isSunday }) => (
                    <td key={day}
                      className={isSunday ? 'att-sunday-col' : ''}>
                      <div className="att-quick-btns">
                        <select className="att-quick-select"
                          onChange={e => {
                            const v = e.target.value;
                            if (v) {
                              quickMarkDay(day, v);
                              e.target.value = '';
                            }
                          }}>
                          <option value="">▼</option>
                          <option value="P">Present (P)</option>
                          <option value="A">Absent (A)</option>
                          <option value="PH">Paid Holiday (PH)</option>
                          <option value="H">Half Day (H)</option>
                          <option value="CLEAR">Clear</option>
                        </select>
                      </div>
                    </td>
                  ))}
                  <td colSpan={5} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => {
                  const s = computeSummary(
                    attendance[emp.id] || {}, selYear, selMonth);
                  return (
                    <tr key={emp.id} className="att-row">
                      <td className="att-td-sno">{idx + 1}</td>
                      <td className="att-td-name col-left">
                        <button className="att-emp-name-btn"
                          onClick={() =>
                            setModal({ type: 'detail', emp })}>
                          {emp.name}
                        </button>
                      </td>
                      <td className="att-td-cat col-left">
                        <span className={`att-cat-badge att-cat-${emp.category.toLowerCase().replace(/\s+/g, '-')
                          }`}>
                          {emp.category}
                        </span>
                      </td>
                      {days.map(({ day, isSunday }) => (
                        <td key={day}
                          className={isSunday ? 'att-sunday-col' : ''}>
                          <StatusCell
                            value={attendance[emp.id]?.[day]
                              || (isSunday ? 'PH' : '')}
                            onChange={val =>
                              updateCell(emp.id, day, val)}
                            isSunday={isSunday}
                          />
                        </td>
                      ))}
                      <td className="att-td-total att-td-p">{s.present}</td>
                      <td className="att-td-total att-td-a">{s.absent}</td>
                      <td className="att-td-total att-td-h">{s.half}</td>
                      <td className="att-td-total att-td-ph">{s.ph}</td>
                      <td className="att-td-total att-td-wages">
                        {s.totalForWages}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="att-table-hint">
            💡 Click any cell to cycle: Present → Absent → Half Day → Paid Holiday → Empty.
            Click employee name for details.
          </div>
        </div>
      )}

      {/* ══ SUMMARY VIEW ══════════════════════════════════════════ */}
      {!loading && activeView === 'summary' && (
        <div className="att-table-card">
          <h3 className="att-section-title">
            <span>📊 Monthly Summary — {MONTHS[selMonth]} {selYear}</span>
            <span className="att-overall-salary">
              Total: <strong>₹{totalMonthlySalary.toLocaleString(
                'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              )}</strong>
            </span>
          </h3>

          <div ref={summaryTopRef} className="att-top-scroll-wrapper"
            onScroll={() => syncScroll(summaryTopRef, summaryTableRef)}>
            <div style={{ width: `${summaryW}px`, height: '1px' }} />
          </div>

          <div ref={summaryTableRef} className="att-table-scroll"
            onScroll={() => syncScroll(summaryTableRef, summaryTopRef)}>
            <table className="att-summary-table">
              <thead>
                <tr>
                  <th className="att-sum-sticky-id">ID</th>
                  <th className="att-sum-sticky-emp">Employee</th>
                  <th className="att-sum-sticky-role">Role</th>
                  <th className="att-sum-sticky-gpay">GPay</th>
                  <th className="att-sum-sticky-salary">Base Salary (₹)</th>
                  <th>Actions</th>
                  <th>Working Days</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Half Days</th>
                  <th>Paid Holidays</th>
                  <th>Days for Wages</th>
                  <th>Per Day (₹)</th>
                  <th>Loss of Pay (₹)</th>
                  <th>Net Salary (₹)</th>
                  <th>Incentive (₹)</th>
                  <th>Advance (₹)</th>
                  <th>Total (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summaries
                  .filter(s =>
                    (!filterCat || s.emp.category === filterCat) &&
                    (!filterName || s.emp.name.toLowerCase()
                      .includes(filterName.toLowerCase())))
                  .map((s, idx) => {
                    const detail = salaryDetails[s.emp.id];
                    const basic = Number(
                      detail?.baseSalary ?? s.emp.baseSalary ?? 5000);
                    const perDay = basic / 31;
                    const lop = perDay * s.absent;
                    const net = perDay * s.totalForWages;
                    const incVal = Number(detail?.incentive ?? 0);
                    const advVal = Number(detail?.advance ?? 0);
                    const total = net + incVal - advVal;
                    const isHidden = detail?.isHidden
                      || hiddenEmpIds.has(s.emp.id);
                    const statusVal = detail?.salaryStatus ?? 'pending';

                    return (
                      <tr key={s.emp.id}
                        className={`att-summary-row${isHidden ? ' att-row-hidden' : ''
                          }`}>
                        <td className="att-sum-sticky-id">{idx + 1}</td>
                        <td className="col-left att-sum-sticky-emp">
                          {s.emp.name}
                        </td>
                        <td className="col-left att-sum-sticky-role">
                          <span className={`att-cat-badge att-cat-${s.emp.category.toLowerCase().replace(/\s+/g, '-')
                            }`}>
                            {s.emp.category}
                          </span>
                        </td>
                        <td className="att-sum-sticky-gpay">
                          {s.emp.gpayNumber || '—'}
                        </td>
                        <td className="att-sum-sticky-salary">
                          {isHidden ? (
                            <span className="att-hidden-placeholder">—</span>
                          ) : (
                            <input type="number"
                              className="att-summary-input"
                              style={{ width: '90px' }}
                              value={detail?.baseSalary ?? s.emp.baseSalary ?? 5000}
                              placeholder="5000"
                              onChange={e =>
                                updateSalaryDetail(
                                  s.emp.id, 'baseSalary', e.target.value)} />
                          )}
                        </td>
                        <td>
                          <div className="att-actions-cell">
                            <button className="att-action-btn edit"
                              onClick={() =>
                                setModal({ type: 'edit', emp: s.emp })}
                              title="Edit">✏️</button>
                            <button className="att-action-btn hide"
                              onClick={() => toggleHide(s.emp.id)}
                              title={isHidden
                                ? 'Unhide Salary' : 'Hide Salary'}>
                              {isHidden ? '👁️‍🗨️' : '👁️'}
                            </button>
                          </div>
                        </td>
                        <td className="td-center">{s.workingDays}</td>
                        <td className="td-center att-text-green">
                          {s.present}
                        </td>
                        <td className="td-center att-text-red">
                          {s.absent}
                        </td>
                        <td className="td-center att-text-amber">
                          {s.half}
                        </td>
                        <td className="td-center att-text-purple">
                          {s.ph}
                        </td>
                        <td className="td-center att-text-blue">
                          <strong>{s.totalForWages}</strong>
                        </td>
                        <td className="td-center">
                          {isHidden ? <span className="att-hidden-placeholder">—</span>
                            : `₹${perDay.toFixed(2)}`}
                        </td>
                        <td className="td-center att-text-red">
                          {isHidden ? <span className="att-hidden-placeholder">—</span>
                            : `₹${lop.toFixed(2)}`}
                        </td>
                        <td className="td-center att-text-green">
                          {isHidden ? <span className="att-hidden-placeholder">—</span>
                            : `₹${net.toFixed(2)}`}
                        </td>
                        <td className="td-center">
                          {isHidden ? (
                            <span className="att-hidden-placeholder">—</span>
                          ) : (
                            <input type="number"
                              className="att-summary-input"
                              value={detail?.incentive ?? ''}
                              placeholder="0"
                              onChange={e =>
                                updateSalaryDetail(
                                  s.emp.id, 'incentive', e.target.value)} />
                          )}
                        </td>
                        <td className="td-center">
                          {isHidden ? (
                            <span className="att-hidden-placeholder">—</span>
                          ) : (
                            <input type="number"
                              className="att-summary-input"
                              value={detail?.advance ?? ''}
                              placeholder="0"
                              onChange={e =>
                                updateSalaryDetail(
                                  s.emp.id, 'advance', e.target.value)} />
                          )}
                        </td>
                        <td className="td-center"
                          style={{ fontWeight: 700, color: '#111827' }}>
                          {isHidden ? (
                            <span className="att-hidden-placeholder">—</span>
                          ) : `₹${total.toFixed(2)}`}
                        </td>
                        <td className="td-center">
                          {isHidden ? (
                            <span className="att-hidden-placeholder">—</span>
                          ) : (
                            <select
                              className={`att-summary-select status-${statusVal}`}
                              value={statusVal}
                              onChange={e =>
                                updateSalaryDetail(
                                  s.emp.id, 'salaryStatus', e.target.value)}>
                              <option value="credited">Credited</option>
                              <option value="pending">Pending</option>
                              <option value="wip">WIP</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ YEARLY VIEW ═══════════════════════════════════════════ */}
      {!loading && activeView === 'yearly' && (
        <div className="att-table-card">
          <h3 className="att-section-title">
            📈 Yearly Overview — {selYear}
          </h3>

          <div className="att-yearly-months">
            {MONTHS.map((m, mi) => {
              const wd = countWorkingDays(selYear, mi);
              const totalP = employees.reduce((sum, emp) => {
                const s = computeSummary(
                  attendance[emp.id] || {}, selYear, mi);
                return sum + s.present;
              }, 0);
              const avg = employees.length > 0
                ? Math.round((totalP / (wd * employees.length)) * 100) : 0;
              return (
                <div key={m}
                  className={`att-month-card${mi === selMonth ? ' current' : ''}`}
                  onClick={() => {
                    setSelMonth(mi);
                    setActiveView('monthly');
                  }}>
                  <div className="att-month-name">{m.slice(0, 3)}</div>
                  <div className="att-month-wd">{wd} days</div>
                  <div className="att-month-pct" style={{
                    color: avg >= 75 ? '#16a34a'
                      : avg >= 50 ? '#d97706' : '#dc2626'
                  }}>
                    {avg}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="att-table-scroll" style={{ marginTop: 20 }}>
            <table className="att-summary-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Total Working Days ({selYear})</th>
                  <th>Total Present</th>
                  <th>Total Absent</th>
                  <th>Annual Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {yearlySummary
                  .filter(s =>
                    (!filterCat || s.emp.category === filterCat) &&
                    (!filterName || s.emp.name.toLowerCase()
                      .includes(filterName.toLowerCase())))
                  .map((s, idx) => {
                    const pct = s.totalWorking > 0
                      ? Math.round(
                        (s.totalPresent / s.totalWorking) * 100) : 0;
                    return (
                      <tr key={s.emp.id}>
                        <td>{idx + 1}</td>
                        <td className="col-left">{s.emp.name}</td>
                        <td className="col-left">
                          <span className={`att-cat-badge att-cat-${s.emp.category.toLowerCase().replace(/\s+/g, '-')
                            }`}>
                            {s.emp.category}
                          </span>
                        </td>
                        <td className="td-center">{s.totalWorking}</td>
                        <td className="td-center att-text-green">
                          <strong>{s.totalPresent}</strong>
                        </td>
                        <td className="td-center att-text-red">
                          {s.totalAbsent}
                        </td>
                        <td>
                          <div className="att-pct-inline">
                            <div className="att-pct-track sm">
                              <div className="att-pct-fill" style={{
                                width: `${pct}%`,
                                background: pct >= 75 ? '#16a34a'
                                  : pct >= 50 ? '#d97706'
                                    : '#dc2626'
                              }} />
                            </div>
                            <span style={{
                              color: pct >= 75 ? '#16a34a'
                                : pct >= 50 ? '#d97706' : '#dc2626',
                              fontWeight: 700
                            }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal === 'add' && <AddEmpModal />}
      {modal?.type === 'detail' && <EmpDetailModal emp={modal.emp} />}
      {modal?.type === 'edit' && <EditEmpModal emp={modal.emp} />}
      {modal?.type === 'delete_confirm' && (
        <DeleteConfirmModal emp={modal.emp} />
      )}
    </div>
  );
};

export default Attendance;