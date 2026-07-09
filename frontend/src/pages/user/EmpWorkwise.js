import React, {
  useState, useEffect, useCallback, useRef
} from 'react';
import './EmpWorkwise.css';
import { apiCall } from '../../utils/api';

// ── Constants ─────────────────────────────────────────────────────
const BREAK_REASONS = ['Tea Break', 'Lunch Break', 'Restroom', 'Other'];
const ON_HOLD_REASONS = ['Client query', 'Rework', 'Need update', 'Others'];

// Must match time_logs.status DB CHECK constraint
const LOG_STATUSES = [
  'Running', 'On Break', 'FINISH', 'WIP',
  'HOLD', 'PENDING', 'YTS', 'RTU', 'UPLOADED', 'QUERY',
];

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (s) => {
  if (!s && s !== 0) return '00 : 00 : 00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')} : `
    + `${String(m).padStart(2, '0')} : `
    + `${String(sec).padStart(2, '0')}`;
};

const fmtDate = (d) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return d; }
};

const formatTime = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ap = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ap}`;
  } catch {
    return '—';
  }
};

const chipClass = (s) => {
  const v = (s || '').toUpperCase();
  if (['FINISH', 'COMPLETED'].includes(v)) return 'chip-finish';
  if (['WIP', 'RUNNING'].includes(v)) return 'chip-wip';
  if (v === 'ON BREAK') return 'chip-break';
  if (v === 'HOLD') return 'chip-hold';
  if (['PENDING', 'YTS'].includes(v)) return 'chip-pending';
  return 'chip-default';
};

// ── Read-only display field ───────────────────────────────────────
const ReadOnly = ({ label, icon, value, placeholder = '—' }) => (
  <div className="ww-field">
    <label className="ww-label">
      <span>{icon}</span> {label}
      <span className="ww-readonly-badge">auto-filled</span>
    </label>
    <div className="ww-readonly-value">
      {value || (
        <span className="ww-readonly-placeholder">{placeholder}</span>
      )}
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════
export default function EmpWorkwise() {

  // ── Timer state ──────────────────────────────────────────────
  const [status, setStatus] = useState('stopped');
  const [context, setContext] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [timeLogId, setTimeLogId] = useState(null);
  const [breakEl, setBreakEl] = useState(0);
  const breakRef = useRef(null);

  // ── Task data ─────────────────────────────────────────────────
  const [myTasks, setMyTasks] = useState([]);
  const [nextTask, setNextTask] = useState(null);

  // ── Task selection state ──────────────────────────────────────
  // selTask = taskId string
  // selectedTask = full MyTaskOption object
  const [selTask, setSelTask] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  // Auto-filled display values (derived from selectedTask)
  const [autoProject, setAutoProject] = useState('');
  const [autoProcess, setAutoProcess] = useState('');
  const [autoJob, setAutoJob] = useState('');
  const [autoProjectId, setAutoProjectId] = useState(null);
  const [autoProcessId, setAutoProcessId] = useState(null);
  const [autoJobId, setAutoJobId] = useState(null);

  // ── Dropdown data (for log filters only) ─────────────────────
  const [projects, setProjects] = useState([]);
  const [processes, setProcesses] = useState([]);

  // ── Stop popup ────────────────────────────────────────────────
  const [showStop, setShowStop] = useState(false);
  const [stopVal, setStopVal] = useState(null);
  const [pagesDone, setPagesDone] = useState('');
  const [stopStatus, setStopStatus] = useState('stopped');
  const [holdReason, setHoldReason] = useState('');
  const [holdOther, setHoldOther] = useState('');

  // ── Break popup ───────────────────────────────────────────────
  const [showBreak, setShowBreak] = useState(false);
  const [bReason, setBReason] = useState('');
  const [bCustom, setBCustom] = useState('');
  const [bDesc, setBDesc] = useState('');

  // ── Time logs ─────────────────────────────────────────────────
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(0);
  const [logTotal, setLogTotal] = useState(0);
  const [logPages, setLogPages] = useState(0);
  const [logSize, setLogSize] = useState(25);
  const [logF, setLogF] = useState({
    projectId: '', processId: '', status: '',
    startDate: '', endDate: '',
  });

  const [busy, setBusy] = useState(false);

  // ── Data loaders ─────────────────────────────────────────────

  // BUG FIX: tasks come from /workwise/my-tasks (user-scoped endpoint).
  // Backend filters by JWT userId — no cross-user leakage possible.
  const loadTasks = useCallback(async () => {
    try {
      const data = await apiCall('/workwise/my-tasks');
      setMyTasks(data || []);
    } catch (e) {
      console.warn('Could not load tasks:', e.message);
    }
  }, []);

  const loadDropdowns = useCallback(async () => {
    try {
      const [proj, proc] = await Promise.all([
        apiCall('/projects'),
        apiCall('/processes'),
      ]);
      setProjects(proj || []);
      setProcesses(proc || []);
    } catch (e) {
      console.warn('Could not load dropdowns:', e.message);
    }
  }, []);

  const loadCurrent = useCallback(async () => {
    try {
      const data = await apiCall('/workwise/current');
      if (data) {
        setContext(data);
        setTimeLogId(data.timeLogId);
        setElapsed(data.elapsedSeconds || 0);
        if (data.status === 'On Break') {
          setStatus('break');
          if (data.breakStartedAt) {
            breakRef.current = new Date(data.breakStartedAt);
            setBreakEl(Math.floor(
              (Date.now() - breakRef.current.getTime()) / 1000
            ));
          }
        } else {
          setStatus('running');
        }
      }
    } catch { /* no running task — fine */ }
  }, []);

  // BUG FIX: pass filter snapshot to avoid React batching delay
  const loadLogs = useCallback(async (pg = 0, filter = null, sizeVal = logSize) => {
    try {
      const f = filter !== null ? filter : logF;
      const p = new URLSearchParams({ page: pg, size: sizeVal });
      if (f.projectId) p.set('projectId', f.projectId);
      if (f.processId) p.set('processId', f.processId);
      if (f.status) p.set('status', f.status);
      if (f.startDate) p.set('startDate', f.startDate);
      if (f.endDate) p.set('endDate', f.endDate);

      const [logsData, attendanceToday] = await Promise.all([
        apiCall(`/workwise/logs?${p}`),
        apiCall('/attendance/today').catch(() => null)
      ]);

      let contentList = logsData.content || [];

      // Prepend today's check-in if present and no task log exists for today yet
      if (pg === 0 && attendanceToday && attendanceToday.checkInTime) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const hasTodayLog = contentList.some(l => l.logDate === todayStr);
        if (!hasTodayLog) {
          contentList = [
            {
              id: attendanceToday.id || 'today-checkin-placeholder',
              logDate: todayStr,
              projectName: 'No Active Task',
              processName: '—',
              isbnTitle: '—',
              pagesCompleted: 0,
              breakSeconds: 0,
              workingSeconds: 0,
              status: attendanceToday.checkOutTime ? 'FINISH' : 'RUNNING',
              startTime: null,
              endTime: null,
              manualCheckIn: attendanceToday.checkInTime,
              manualCheckOut: attendanceToday.checkOutTime
            },
            ...contentList
          ];
        }
      }

      setLogs(contentList);
      setLogTotal(logsData.totalElements || contentList.length);
      setLogPages(logsData.totalPages || 1);
      setLogPage(pg);
    } catch (e) {
      console.warn('Could not load logs:', e.message);
    }
  }, [logF, logSize]);

  const loadNext = useCallback(async () => {
    try {
      setNextTask(await apiCall('/workwise/next-task'));
    } catch {
      setNextTask(null);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadDropdowns();
    loadCurrent();
    loadLogs(0);
    loadNext();
    // eslint-disable-next-line
  }, []);

  // ── Auto-populate from selected task ─────────────────────────
  // When user selects a task, ALL other fields fill from task data.
  // Employee cannot edit project/process/job — they are read-only.
  useEffect(() => {
    if (!selTask) {
      setSelectedTask(null);
      setAutoProject(''); setAutoProcess(''); setAutoJob('');
      setAutoProjectId(null); setAutoProcessId(null); setAutoJobId(null);
      return;
    }
    const t = myTasks.find(x => x.taskId === selTask);
    if (!t) return;

    setSelectedTask(t);
    setAutoProject(t.projectName || '');
    setAutoProcess(t.processName || '');
    setAutoProjectId(t.projectId || null);
    setAutoProcessId(t.processId || null);

    // Auto-fill first job from task's job list
    if (t.jobs && t.jobs.length > 0) {
      const j = t.jobs[0];
      setAutoJobId(j.jobId);
      setAutoJob([j.jobIdCode, j.titleName, j.xmlIsbn]
        .filter(Boolean).join(' / '));
    } else {
      setAutoJobId(null);
      setAutoJob('');
    }
  }, [selTask, myTasks]);

  // ── Timers ───────────────────────────────────────────────────
  useEffect(() => {
    let iv = null;
    if (status === 'running' || status === 'break') {
      iv = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(iv);
  }, [status]);

  useEffect(() => {
    let iv = null;
    if (status === 'break') {
      iv = setInterval(() => setBreakEl(b => b + 1), 1000);
    } else {
      setBreakEl(0);
      breakRef.current = null;
    }
    return () => clearInterval(iv);
  }, [status]);

  // ── Fetch stop validation when popup opens ────────────────────
  useEffect(() => {
    if (!showStop || !timeLogId) return;
    apiCall(`/workwise/stop-validation/${timeLogId}`)
      .then(d => {
        setStopVal(d);
        if (d.assignedPagesStr === "All Pages" && d.assignedPages != null) {
          const remaining = Math.max(0, d.assignedPages - (d.pagesCompletedSoFar || 0));
          setPagesDone(remaining.toString());
          setStopStatus('completed');
        } else {
          setPagesDone('');
          setStopStatus('stopped');
        }
      })
      .catch(() => setStopVal(null));
  }, [showStop, timeLogId]);

  // Page completion check (cumulative)
  const canComplete = () => {
    if (!stopVal || stopVal.assignedPages == null) return true;
    const entered = parseInt(pagesDone) || 0;
    const already = stopVal.pagesCompletedSoFar || 0;
    return (already + entered) >= stopVal.assignedPages;
  };

  // Remaining pages this session can cover
  const remainingPages = () => {
    if (!stopVal || stopVal.assignedPages == null) return null;
    const already = stopVal.pagesCompletedSoFar || 0;
    return Math.max(0, stopVal.assignedPages - already);
  };

  // Task is selectable only if active (not completed)
  const isFormValid = () =>
    !!(selectedTask && !selectedTask.isCompleted);

  // ── Handlers ─────────────────────────────────────────────────

  const fillFromNextTask = (task) => {
    if (!task) return;
    setSelTask(task.taskId);
    // useEffect on selTask auto-populates the rest
  };

  const handleStart = async () => {
    if (!isFormValid()) {
      alert('Please select an active assigned task to start.');
      return;
    }
    if (!autoProjectId || !autoProcessId) {
      alert('Selected task has no project or process assigned. Contact admin.');
      return;
    }
    setBusy(true);
    try {
      // Backend derives project/process/job from task.
      // We send them for logging convenience but backend overwrites from task.
      const data = await apiCall('/workwise/start', 'POST', {
        taskId: selectedTask.taskId,
        projectId: autoProjectId,
        processId: autoProcessId,
        jobId: autoJobId || null,
      });
      setContext(data);
      setTimeLogId(data.timeLogId);
      setElapsed(0);
      setStatus('running');
    } catch (e) {
      alert('Error starting task: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!pagesDone.toString().trim()) {
      alert('Please enter the number of pages completed this session.');
      return;
    }
    const pages = parseInt(pagesDone) || 0;

    // BUG FIX: >= check
    if (stopStatus === 'completed' && !canComplete()) {
      const assigned = stopVal?.assignedPages ?? '?';
      const already = stopVal?.pagesCompletedSoFar ?? 0;
      alert(
        `Cannot mark as Completed.\n\n` +
        `Previously completed: ${already}\n` +
        `This session: ${pages}\n` +
        `Total: ${already + pages} / ${assigned} assigned pages.\n\n` +
        `Complete all assigned pages before marking Completed.`
      );
      return;
    }
    if (stopStatus === 'on-hold' && !holdReason) {
      alert('Please select an on-hold reason.');
      return;
    }
    setBusy(true);
    try {
      const result = await apiCall('/workwise/stop', 'POST', {
        timeLogId: timeLogId,
        pagesCompleted: pages,
        markTaskCompleted: stopStatus === 'completed',
        status: stopStatus,
        onHoldReason: holdReason || null,
      });

      // Reset all state
      setStatus('stopped');
      setContext(null);
      setTimeLogId(null);
      setElapsed(0);
      setBreakEl(0);
      setShowStop(false);
      setPagesDone('');
      setStopStatus('stopped');
      setHoldReason('');
      setHoldOther('');
      setStopVal(null);
      setSelTask('');
      setSelectedTask(null);
      setAutoProject(''); setAutoProcess(''); setAutoJob('');
      setAutoProjectId(null); setAutoProcessId(null); setAutoJobId(null);

      // Refresh data — both employee log and task list update
      await Promise.all([loadLogs(0), loadTasks(), loadNext()]);

      if (result.nextTask) {
        setNextTask(result.nextTask);
        alert(
          `✅ ${result.message}\n\n` +
          `📋 Next: ${result.nextTask.taskTitle}\n` +
          `Project: ${result.nextTask.projectName}`
        );
      } else if (result.taskCompleted) {
        alert(`✅ ${result.message}`);
      }

    } catch (e) {
      alert('Error stopping task: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleBreakStart = async () => {
    if (!bReason) {
      alert('Please select a break reason.');
      return;
    }
    if (bReason === 'Other' && !bCustom.trim()) {
      alert('Please specify the reason for break.');
      return;
    }
    setBusy(true);
    try {
      const data = await apiCall('/workwise/break/start', 'POST', {
        timeLogId: timeLogId,
        breakReason: bReason,       // DB enum value
        customReason: bReason === 'Other' ? bCustom : null,
        description: bDesc || null,
      });
      setContext(data);
      setStatus('break');
      breakRef.current = new Date();
      setBreakEl(0);
      setShowBreak(false);
      setBReason(''); setBCustom(''); setBDesc('');
    } catch (e) {
      alert('Error starting break: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResume = async () => {
    setBusy(true);
    try {
      const data = await apiCall('/workwise/break/end', 'POST',
        { timeLogId });
      setContext(data);
      setStatus('running');
      setBreakEl(0);
      breakRef.current = null;
    } catch (e) {
      alert('Error resuming: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  // Split tasks for dropdown display
  const activeTasks = myTasks.filter(t => !t.isCompleted);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="workwise-page">

      {/* ══ STOP POPUP ══════════════════════════════════════════ */}
      {showStop && (
        <div className="ww-popup-overlay">
          <div className="ww-popup-box">
            <div className="ww-popup-header">
              <h3 className="ww-popup-title">⏹ Stop Timer</h3>
              <button className="ww-popup-close" onClick={() => {
                setShowStop(false); setPagesDone('');
                setStopStatus('stopped'); setHoldReason('');
                setStopVal(null);
              }}>✕</button>
            </div>

            {/* Page progress banner */}
            {stopVal?.assignedPages != null && (
              <div className="ww-page-progress-banner">
                <div className="ww-ppb-row">
                  <span className="ww-ppb-label">Task</span>
                  <strong>{stopVal.taskTitle}</strong>
                </div>
                <div className="ww-ppb-row">
                  <span className="ww-ppb-label">Assigned Pages</span>
                  <strong>{stopVal.assignedPages}</strong>
                </div>
                <div className="ww-ppb-row">
                  <span className="ww-ppb-label">Previously Completed</span>
                  <strong>{stopVal.pagesCompletedSoFar}</strong>
                </div>
                <div className="ww-ppb-progress">
                  <div className="ww-ppb-fill" style={{
                    width: `${Math.min(
                      ((stopVal.pagesCompletedSoFar || 0) /
                        stopVal.assignedPages) * 100, 100
                    )}%`
                  }} />
                </div>
              </div>
            )}

            <div className="ww-popup-field">
              <label className="ww-popup-label">
                📄 Pages Completed This Session
                <span className="ww-req">*</span>
              </label>
              {stopVal?.assignedPages != null && (
                <div style={{
                  fontSize: '0.78rem',
                  marginBottom: '6px',
                  color: remainingPages() > 0 ? '#1e40af' : '#16a34a',
                  fontWeight: 600,
                }}>
                  {remainingPages() > 0
                    ? `📌 Remaining: ${remainingPages()} pages (max you can enter)`
                    : '✅ All pages completed — mark as Completed'}
                </div>
              )}
              <input
                type="number" min="0"
                max={remainingPages() !== null ? remainingPages() : undefined}
                className="ww-popup-input"
                placeholder={stopVal?.assignedPages != null
                  ? `Enter pages done this session (max ${remainingPages()})`
                  : 'Enter pages completed this session'}
                value={pagesDone}
                onChange={e => {
                  // Clamp to max remaining so employee can't exceed total
                  let val = e.target.value;
                  const maxPages = remainingPages();
                  if (maxPages !== null && parseInt(val) > maxPages) {
                    val = maxPages.toString();
                  }
                  setPagesDone(val);
                  // Auto-select 'completed' when threshold met
                  if (stopVal?.assignedPages != null) {
                    const entered = parseInt(val) || 0;
                    const already = stopVal.pagesCompletedSoFar || 0;
                    const assigned = stopVal.assignedPages;
                    if ((already + entered) >= assigned) {
                      setStopStatus('completed');
                    } else if (stopStatus === 'completed') {
                      setStopStatus('stopped');
                    }
                  }
                }}
              />

              {/* Live cumulative feedback */}
              {stopVal?.assignedPages != null && pagesDone !== '' && (
                <div className={`ww-popup-hint ${canComplete() ? 'hint-success' : 'hint-warn'
                  }`}>
                  {(() => {
                    const entered = parseInt(pagesDone) || 0;
                    const already = stopVal.pagesCompletedSoFar || 0;
                    const total = already + entered;
                    const assigned = stopVal.assignedPages;
                    return canComplete()
                      ? `✅ ${total} / ${assigned} — Can mark as Completed`
                      : `⚠️ ${total} / ${assigned} — ${assigned - total} more needed to complete`;
                  })()}
                </div>
              )}
            </div>

            <div className="ww-popup-radio-group">

              {/* Completed — disabled until pages met */}
              <label className={`ww-popup-radio-option ${stopStatus === 'completed' ? 'selected' : ''
                } ${!canComplete() ? 'option-disabled' : ''}`}>
                <input type="radio" name="st" value="completed"
                  checked={stopStatus === 'completed'}
                  disabled={!canComplete()}
                  onChange={e => setStopStatus(e.target.value)} />
                <span className="ww-radio-content">
                  <span className="ww-radio-icon">✅</span>
                  <span className="ww-radio-text">
                    <strong>Completed</strong>
                    <span className="ww-radio-subtext">
                      {canComplete()
                        ? 'All pages done — task will be marked complete'
                        : `Disabled — enter ${stopVal?.assignedPages ?? '?'} total pages to unlock`}
                    </span>
                  </span>
                </span>
              </label>

              {/* On Hold */}
              <label className={`ww-popup-radio-option ${stopStatus === 'on-hold' ? 'selected' : ''
                }`}>
                <input type="radio" name="st" value="on-hold"
                  checked={stopStatus === 'on-hold'}
                  onChange={e => setStopStatus(e.target.value)} />
                <span className="ww-radio-content">
                  <span className="ww-radio-icon">⏸️</span>
                  <span className="ww-radio-text">
                    <strong>On-Hold</strong>
                    <span className="ww-radio-subtext">
                      Work paused — can resume later
                    </span>
                  </span>
                </span>
              </label>

              {stopStatus === 'on-hold' && (
                <div className="ww-onhold-details">
                  <div className="ww-select-wrap">
                    <select className="ww-popup-select"
                      value={holdReason}
                      onChange={e => setHoldReason(e.target.value)}>
                      <option value="">Select Reason</option>
                      {ON_HOLD_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <span className="ww-arrow">▾</span>
                  </div>
                  {holdReason === 'Others' && (
                    <input type="text"
                      className="ww-popup-input ww-onhold-other-input"
                      placeholder="Describe the reason"
                      value={holdOther}
                      onChange={e => setHoldOther(e.target.value)} />
                  )}
                </div>
              )}

              {/* Stopped */}
              <label className={`ww-popup-radio-option ${stopStatus === 'stopped' ? 'selected' : ''
                }`}>
                <input type="radio" name="st" value="stopped"
                  checked={stopStatus === 'stopped'}
                  onChange={e => setStopStatus(e.target.value)} />
                <span className="ww-radio-content">
                  <span className="ww-radio-icon">⏹️</span>
                  <span className="ww-radio-text">
                    <strong>Stopped</strong>
                    <span className="ww-radio-subtext">
                      Work stopped — can restart later
                    </span>
                  </span>
                </span>
              </label>
            </div>

            <div className="ww-popup-actions">
              <button className="ww-popup-btn ww-popup-btn-cancel"
                onClick={() => {
                  setShowStop(false); setPagesDone('');
                  setStopStatus('stopped'); setHoldReason('');
                  setStopVal(null);
                }}>
                Cancel
              </button>
              <button className="ww-popup-btn ww-popup-btn-submit"
                onClick={handleStop}
                disabled={busy || !pagesDone.toString().trim()}>
                {busy ? 'Stopping...' : 'Stop Timer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BREAK POPUP ═════════════════════════════════════════ */}
      {showBreak && (
        <div className="ww-popup-overlay">
          <div className="ww-popup-box">
            <div className="ww-popup-header">
              <h3 className="ww-popup-title">☕ Take a Break</h3>
              <button className="ww-popup-close" onClick={() => {
                setShowBreak(false);
                setBReason(''); setBCustom(''); setBDesc('');
              }}>✕</button>
            </div>

            <div className="ww-break-note">
              <span>ℹ️</span>
              The task timer keeps running during break. Break time is
              tracked separately and subtracted from productive time.
            </div>

            <div className="ww-popup-field">
              <label className="ww-popup-label">
                ☕ Break Reason <span className="ww-req">*</span>
              </label>
              <div className="ww-select-wrap">
                <select className="ww-popup-select"
                  value={bReason}
                  onChange={e => setBReason(e.target.value)}>
                  <option value="">Select a reason</option>
                  {BREAK_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <span className="ww-arrow">▾</span>
              </div>
            </div>

            {bReason === 'Other' && (
              <div className="ww-popup-field">
                <label className="ww-popup-label">
                  📝 Specify Reason <span className="ww-req">*</span>
                </label>
                <input type="text" className="ww-popup-input"
                  placeholder="Describe your reason"
                  value={bCustom}
                  onChange={e => setBCustom(e.target.value)} />
              </div>
            )}

            <div className="ww-popup-field">
              <label className="ww-popup-label">
                💬 Description (Optional)
              </label>
              <textarea className="ww-popup-textarea" rows="3"
                placeholder="Optional notes about this break"
                value={bDesc}
                onChange={e => setBDesc(e.target.value)} />
            </div>

            <div className="ww-popup-actions">
              <button className="ww-popup-btn ww-popup-btn-cancel"
                onClick={() => {
                  setShowBreak(false);
                  setBReason(''); setBCustom(''); setBDesc('');
                }}>
                Cancel
              </button>
              <button className="ww-popup-btn ww-popup-btn-submit"
                onClick={handleBreakStart} disabled={busy}>
                {busy ? 'Starting...' : 'Start Break'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN CARD ══════════════════════════════════════════ */}
      <div className="ww-card ww-top-card">
        <div className="ww-card-header">
          <h2 className="ww-section-title">WorkWise</h2>
          <div className={`ww-status-pill ${status}`}>
            {status === 'running' ? '▶ Running'
              : status === 'break' ? '☕ On Break'
                : '⏸ Stopped'}
          </div>
        </div>

        {/* Next task banner */}
        {status === 'stopped' && nextTask && (
          <div className="ww-next-task-banner">
            <span className="ww-next-task-icon">📋</span>
            <div className="ww-next-task-info">
              <span className="ww-next-task-label">
                Next Assigned Task:
              </span>
              <strong>{nextTask.taskTitle}</strong>
              <span className="ww-next-task-meta">
                {nextTask.projectName}
                {nextTask.processName ? ` · ${nextTask.processName}` : ''}
                {nextTask.assignedPages != null
                  ? ` · ${nextTask.pagesCompleted ?? 0}/${nextTask.assignedPages} pg`
                  : ''}
                {nextTask.dueDate
                  ? ` · Due: ${fmtDate(nextTask.dueDate)}`
                  : ''}
              </span>
            </div>
            <button className="ww-next-task-use-btn"
              onClick={() => fillFromNextTask(nextTask)}>
              Use This Task
            </button>
          </div>
        )}

        <div className="ww-form">

          {/* ── STOPPED: selection form ── */}
          {status === 'stopped' && (
            <div className="ww-fields-group">

              {/* Task selector */}
              <div className="ww-field">
                <label className="ww-label">
                  <span>✅</span> Task
                  <span className="ww-label-desc">
                    (Select — other fields auto-fill, read-only)
                  </span>
                </label>
                <div className="ww-select-wrap">
                  <select className="ww-select" value={selTask}
                    onChange={e => setSelTask(e.target.value)}>
                    <option value="">— Select a task —</option>
                    {activeTasks.length > 0 && (
                      <optgroup label="📋 Active Tasks">
                        {activeTasks.map(t => (
                          <option key={t.taskId} value={t.taskId}>
                            {t.taskTitle}
                            {t.assignedPages != null
                              ? ` [${t.pagesCompleted ?? 0}/${t.assignedPages} pg]`
                              : ''}
                            {t.dueDate
                              ? ` · Due: ${fmtDate(t.dueDate)}`
                              : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <span className="ww-arrow">▾</span>
                </div>

                {activeTasks.length === 0 && (
                  <span className="ww-sub-hint">
                    No active tasks assigned to you yet.
                  </span>
                )}

                {/* Task chips */}
                {selectedTask && !selectedTask.isCompleted && (
                  <div className="ww-task-chip-row">
                    {selectedTask.complexity && (
                      <span className="ww-chip-complexity">
                        {selectedTask.complexity}
                      </span>
                    )}
                    {selectedTask.dueDate && (
                      <span className="ww-chip-due">
                        📅 Due: {fmtDate(selectedTask.dueDate)}
                      </span>
                    )}
                    {selectedTask.chapterArticleBatch && (
                      <span className="ww-chip-chapter">
                        📑 {selectedTask.chapterArticleBatch}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Auto-filled read-only fields */}
              {selectedTask && !selectedTask.isCompleted ? (
                <>
                  <ReadOnly label="Project" icon="📁"
                    value={autoProject}
                    placeholder="Auto-filled from task" />
                  <ReadOnly label="Process" icon="⚙️"
                    value={autoProcess}
                    placeholder="Auto-filled from task" />
                  <ReadOnly label="Book / Job" icon="📚"
                    value={autoJob}
                    placeholder="No job assigned to this task" />
                  {selectedTask.assignedPages != null && (
                    <ReadOnly label="Assigned Pages" icon="📄"
                      value={`${selectedTask.pagesCompleted ?? 0} / ${selectedTask.assignedPages} pages completed`}
                    />
                  )}
                </>
              ) : selectedTask && selectedTask.isCompleted ? (
                <div className="ww-manual-hint" style={{ color: '#16a34a' }}>
                  <span>✅</span>
                  This task is already completed. Select another task.
                </div>
              ) : (
                <div className="ww-manual-hint">
                  <span>💡</span>
                  Select an assigned task above to auto-populate
                  task details and start the timer.
                </div>
              )}

              {/* Start button */}
              <div className="ww-btn-container">
                <button
                  className={`ww-toggle-btn ${isFormValid() ? 'ww-btn-start' : 'ww-btn-disabled'
                    }`}
                  onClick={handleStart}
                  disabled={!isFormValid() || busy}>
                  {busy ? 'Starting...' : '▶ Start Task'}
                </button>
              </div>
            </div>
          )}

          {/* ── BREAK state ── */}
          {status === 'break' && (
            <div className="ww-dynamic-running-section">
              <h2 className="ww-working-title">
                <span>☕</span> On Break
              </h2>

              <div className="ww-timers-row">
                <div className="ww-timer-banner ww-timer-running"
                  style={{ flex: 1 }}>
                  <div className="ww-timer-display">{fmt(elapsed)}</div>
                  <div className="ww-timer-label">TOTAL ELAPSED</div>
                </div>
                <div className="ww-timer-banner ww-timer-break"
                  style={{ flex: 1 }}>
                  <div className="ww-timer-display">{fmt(breakEl)}</div>
                  <div className="ww-timer-label">BREAK DURATION</div>
                </div>
              </div>

              <div className="ww-break-info">
                <p className="ww-break-text">
                  {context?.breakReason
                    ? `☕ Break reason: ${context.breakReason}`
                    : 'Timer is paused. Resume when ready.'}
                </p>
                <p className="ww-break-subtext">
                  Task timer keeps running. Break time is subtracted
                  from your productive time.
                </p>
              </div>

              {context && (
                <div className="ww-break-task-info">
                  <span className="ww-bti-item">
                    <span className="ww-bti-label">Project</span>
                    <span>{context.projectName || '-'}</span>
                  </span>
                  <span className="ww-bti-item">
                    <span className="ww-bti-label">Process</span>
                    <span>{context.processName || '-'}</span>
                  </span>
                  {context.isbnBookTitle && (
                    <span className="ww-bti-item">
                      <span className="ww-bti-label">Book/Job</span>
                      <span>{context.isbnBookTitle}</span>
                    </span>
                  )}
                </div>
              )}

              <div className="ww-running-buttons">
                <button className="ww-btn-resume"
                  onClick={handleResume} disabled={busy}>
                  {busy ? 'Resuming...' : '▶ Resume Work'}
                </button>
                <button className="ww-btn-stop-large"
                  onClick={() => setShowStop(true)}>
                  ⏹ Stop Task
                </button>
              </div>
            </div>
          )}

          {/* ── RUNNING state ── */}
          {status === 'running' && context && (
            <div className="ww-dynamic-running-section">
              <div className="ww-timer-banner ww-timer-running">
                <div className="ww-timer-display">{fmt(elapsed)}</div>
                <div className="ww-timer-label">ELAPSED TIME</div>
              </div>

              {/* Page progress bar */}
              {context.assignedPages != null && (
                <div className="ww-page-progress">
                  <div className="ww-pp-header">
                    <span className="ww-pp-label">Page Progress</span>
                    <span className="ww-pp-count">
                      {context.pagesCompletedSoFar || 0} /{' '}
                      {context.assignedPages} assigned pages completed
                    </span>
                  </div>
                  <div className="ww-progress-bar">
                    <div className="ww-progress-fill" style={{
                      width: `${Math.min(
                        ((context.pagesCompletedSoFar || 0) /
                          context.assignedPages) * 100, 100
                      )}%`
                    }} />
                  </div>
                </div>
              )}

              <div className="ww-running-grid">
                {[
                  ['⏱️', 'bg-purple', 'border-blue', 'STARTED AT',
                    context.startedAt
                      ? new Date(context.startedAt).toLocaleTimeString('en-IN')
                      : '-'],
                  ['📁', 'bg-green', 'border-green', 'PROJECT',
                    context.projectName || '-'],
                  ['⚙️', 'bg-orange', 'border-orange', 'PROCESS',
                    context.processName || '-'],
                  ['📚', 'bg-blue', 'border-blue', 'ISBN / BOOK TITLE',
                    context.isbnBookTitle || '-'],
                  ['📅', 'bg-pink', 'border-pink', 'DUE DATE',
                    fmtDate(context.dueDate)],
                  ['📄', 'bg-teal', 'border-teal', 'ASSIGNED PAGES',
                    context.assignedPagesAndChapter || '-'],
                  ['🕘', 'bg-purple', 'border-lightpurple', 'SHIFT',
                    context.shift || '-'],
                  ['🧩', 'bg-orange', 'border-orange', 'COMPLEXITY',
                    context.complexity || '-'],
                  ['📄', 'bg-teal', 'border-teal', 'TOTAL PAGES',
                    context.totalPages?.toString() || '-'],
                ].map(([icon, iconBg, border, label, val]) => (
                  <div key={label} className={`ww-run-card ${border}`}>
                    <div className="ww-run-card-header">
                      <span className={`ww-run-icon ${iconBg}`}>{icon}</span>
                      <span className="ww-run-label">{label}</span>
                    </div>
                    <div className="ww-run-value">{val}</div>
                  </div>
                ))}
              </div>

              {context.taskDescription && (
                <div className="ww-field"
                  style={{ marginTop: '8px', width: '100%' }}>
                  <label className="ww-label">
                    <span>📝</span> Task Description
                  </label>
                  <div className="ww-task-desc-display">
                    {context.taskDescription}
                  </div>
                </div>
              )}

              <div className="ww-running-buttons">
                <button className="ww-btn-break"
                  onClick={() => setShowBreak(true)}>
                  ☕ Take Break
                </button>
                <button className="ww-btn-stop-large"
                  onClick={() => setShowStop(true)}>
                  ⏹ Stop Task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ TIME LOGS ═══════════════════════════════════════════ */}
      <div className="ww-card ww-bottom-card">
        <div className="ww-logs-header">
          <h3 className="ww-logs-title">📋 My Time Logs</h3>
          <span className="ww-logs-count">{logTotal} records</span>
        </div>

        <div className="ww-filters">
          {/* Project */}
          <div className="ww-filter-col">
            <label>Project</label>
            <select className="ww-filter-select"
              value={logF.projectId}
              onChange={e => setLogF(f =>
                ({ ...f, projectId: e.target.value }))}>
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Process */}
          <div className="ww-filter-col">
            <label>Process</label>
            <select className="ww-filter-select"
              value={logF.processId}
              onChange={e => setLogF(f =>
                ({ ...f, processId: e.target.value }))}>
              <option value="">All Processes</option>
              {processes.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="ww-filter-col">
            <label>Status</label>
            <select className="ww-filter-select"
              value={logF.status}
              onChange={e => setLogF(f =>
                ({ ...f, status: e.target.value }))}>
              <option value="">All Status</option>
              {LOG_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="ww-filter-col">
            <label>Start Date</label>
            <input type="date" className="ww-filter-date"
              value={logF.startDate}
              onChange={e => setLogF(f =>
                ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="ww-filter-col">
            <label>End Date</label>
            <input type="date" className="ww-filter-date"
              value={logF.endDate}
              onChange={e => setLogF(f =>
                ({ ...f, endDate: e.target.value }))} />
          </div>

          {/* Actions */}
          <div className="ww-filter-col ww-clear-col">
            <button className="ww-clear-btn"
              onClick={() => {
                const cleared = {
                  projectId: '', processId: '', status: '',
                  startDate: '', endDate: ''
                };
                setLogF(cleared);
                loadLogs(0, cleared);
              }}>
              Clear
            </button>
            {/* BUG FIX: pass current logF snapshot directly */}
            <button className="ww-apply-btn"
              onClick={() => loadLogs(0, logF)}>
              Apply
            </button>
          </div>
        </div>

        <div className="ww-table-container">
          <table className="ww-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Project</th>
                <th>Process</th>
                <th>ISBN / Book</th>
                <th>Pages</th>
                <th>Break Time</th>
                <th>Working Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="ww-table-empty">
                    No time logs found.
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td>{fmtDate(log.logDate)}</td>
                  <td className="ww-td-mono">{formatTime(log.manualCheckIn || log.startTime)}</td>
                  <td className="ww-td-mono">{formatTime(log.manualCheckOut || log.endTime)}</td>
                  <td>{log.projectName || '-'}</td>
                  <td>{log.processName || '-'}</td>
                  <td>{log.isbnTitle || '-'}</td>
                  <td className="ww-td-center">
                    {log.pagesCompleted ?? '0'}
                  </td>
                  <td className="ww-td-mono">
                    {log.breakSeconds
                      ? fmt(log.breakSeconds)
                      : '-'}
                  </td>
                  <td className="ww-td-mono">
                    {log.workingSeconds != null
                      ? fmt(log.workingSeconds)
                      : '-'}
                  </td>
                  <td>
                    <span className={`ww-status-chip ${chipClass(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ww-pagination">
          <div className="ww-page-items">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ww-text-muted)' }}>Items per page:</label>
              <select
                value={logSize}
                onChange={e => {
                  const newSize = Number(e.target.value);
                  setLogSize(newSize);
                  loadLogs(0, logF, newSize);
                }}
                style={{
                  padding: '3px 6px',
                  border: '1.5px solid var(--ww-border)',
                  borderRadius: 'var(--ww-radius-sm)',
                  outline: 'none',
                  fontSize: '0.75rem',
                  background: 'var(--ww-surface)',
                  color: 'var(--ww-text)'
                }}
              >
                {[10, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <span>Showing {logs.length} of {logTotal} records</span>
          </div>
          {logPages > 1 && (
            <div className="ww-page-controls">
              <button className="ww-page-btn"
                disabled={logPage === 0}
                onClick={() => loadLogs(logPage - 1)}>‹</button>
              {Array.from(
                { length: Math.min(logPages, 7) }, (_, i) => i
              ).map(n => (
                <button key={n}
                  className={`ww-page-btn ${logPage === n ? 'active' : ''}`}
                  onClick={() => loadLogs(n)}>
                  {n + 1}
                </button>
              ))}
              {logPages > 7 && (
                <span className="ww-page-ellipsis">…</span>
              )}
              <button className="ww-page-btn"
                disabled={logPage >= logPages - 1}
                onClick={() => loadLogs(logPage + 1)}>›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}