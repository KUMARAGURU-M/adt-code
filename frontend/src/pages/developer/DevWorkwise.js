// src/pages/developer/DevWorkwise.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DevWorkwise.css';
import { apiCall, getCurrentUser } from '../../utils/api';

// ── Constants ─────────────────────────────────────────────────────
const BREAK_REASONS = ['Tea Break', 'Lunch Break', 'Restroom', 'Other'];
const ON_HOLD_REASONS = ['Client query', 'Rework', 'Need update', 'Others'];
const LOG_STATUSES = ['Running', 'On Break', 'FINISH', 'WIP', 'HOLD', 'PENDING'];

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
    }).replace(/ /g, '-');
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
  <div className="dww-field">
    <label className="dww-label">
      <span>{icon}</span> {label}
      <span className="dww-readonly-badge">auto-filled</span>
    </label>
    <div className="dww-readonly-value">
      {value || (
        <span className="dww-readonly-placeholder">{placeholder}</span>
      )}
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════
const DevWorkwise = ({ tasks, setTasks, isCheckedIn, checkInTime, isOvertimeActive, attendanceToday }) => {
  const user = getCurrentUser();
  const isAdmin = user?.roles?.includes('Admin');
  const hasAccess = (perm) => isAdmin || (user?.permissions || []).includes(perm);

  // ── Timer state ──────────────────────────────────────────────
  const [status, setStatus] = useState('stopped');
  const [context, setContext] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [timeLogId, setTimeLogId] = useState(null);
  const [breakEl, setBreakEl] = useState(0);
  const breakRef = useRef(null);
  const sessionStartRef = useRef(null);
  const [toast, setToast] = useState(null);
  const lastBeepTimeRef = useRef(0);
  const contextRef = useRef(null);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  // Auto-close info/warning toasts after 5 seconds
  useEffect(() => {
    if (toast && toast.type !== 'error') {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Break limits ──────────────────────────────────────────────
  const getBreakLimitSeconds = (reason) => {
    if (reason === 'Tea Break') return 15 * 60;
    if (reason === 'Lunch Break') return 50 * 60;
    return null;
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (time, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, time);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };
      playTone(audioCtx.currentTime, 0.25);
      playTone(audioCtx.currentTime + 0.3, 0.25);
    } catch (err) {
      console.warn('Could not play break alert beep:', err);
    }
  };

  const sendDesktopNotification = (reason, limitMinutes) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Break Limit Exceeded!', {
          body: `Your ${reason} has exceeded the limit of ${limitMinutes} minutes. Please resume your work.`,
          tag: 'break-limit-alert',
          requireInteraction: true
        });
      } catch (e) {}
    }
  };

  // ── Task selection state ──────────────────────────────────────
  const currentUser = getCurrentUser();
  const currentUserName = currentUser?.fullName || currentUser?.userCode || '';

  const myAssignedTasks = (tasks || []).filter(t => {
    if (t.completed || t.status === 'Completed') return false;
    if (!currentUserName) return true;
    return (t.assignedTo || '').toLowerCase() === currentUserName.toLowerCase();
  });

  const [selTask, setSelTask] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (!selTask) { setSelectedTask(null); return; }
    const t = myAssignedTasks.find(x => String(x.id) === String(selTask));
    setSelectedTask(t || null);
  }, [selTask, tasks]);

  // ── Stop popup ────────────────────────────────────────────────
  const [showStop, setShowStop] = useState(false);
  const [stopStatus, setStopStatus] = useState('stopped');
  const [holdReason, setHoldReason] = useState('');
  const [holdOther, setHoldOther] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');

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
    status: '', startDate: '', endDate: '',
  });
  const [busy, setBusy] = useState(false);

  // ── Data loaders ─────────────────────────────────────────────
  const loadCurrent = useCallback(async () => {
    try {
      const data = await apiCall('/workwise/current');
      if (data) {
        setContext(data);
        setTimeLogId(data.timeLogId);
        const workSec = (data.workingSeconds !== undefined && data.workingSeconds !== null)
          ? data.workingSeconds
          : Math.max(0, (data.elapsedSeconds || 0) - (data.breakSeconds || 0));
        setElapsed(workSec);
        sessionStartRef.current = Date.now() - (workSec * 1000);
        if (data.status === 'On Break') {
          setStatus('break');
          if (data.breakStartedAt || data.breakStart) {
            const breakStartIso = data.breakStartedAt || data.breakStart;
            breakRef.current = new Date(breakStartIso);
            const calculatedBreakEl = Math.floor(
              (Date.now() - breakRef.current.getTime()) / 1000
            );
            setBreakEl(calculatedBreakEl);
            const limit = getBreakLimitSeconds(data.breakReason);
            if (limit) {
              if (calculatedBreakEl > limit) {
                setToast({ type: 'error', message: `⚠️ Active ${data.breakReason} limit (${limit / 60} mins) is exceeded!` });
              } else {
                setToast({ type: 'info', message: `ℹ️ Active ${data.breakReason}. Limit: ${limit / 60} mins. Remaining: ${fmt(limit - calculatedBreakEl)}` });
              }
            }
          }
        } else {
          setStatus('running');
        }
      }
    } catch { /* no running task */ }
  }, []);

  const loadLogs = useCallback(async (pg = 0, filter = null, sizeVal = logSize) => {
    try {
      const f = filter !== null ? filter : logF;
      const p = new URLSearchParams({ page: pg, size: sizeVal });
      if (f.status) p.set('status', f.status);
      if (f.startDate) p.set('startDate', f.startDate);
      if (f.endDate) p.set('endDate', f.endDate);

      const logsData = await apiCall(`/workwise/logs?${p}`);
      let contentList = logsData?.content || [];

      // Prepend today's attendance row if no log yet
      const attendanceRes = await apiCall('/attendance/today').catch(() => null);
      if (pg === 0 && attendanceRes && attendanceRes.checkInTime) {
        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
        const hasTodayLog = contentList.some(l => l.logDate === todayStr);
        if (!hasTodayLog) {
          contentList = [
            {
              id: attendanceRes.id || 'today-checkin-placeholder',
              logDate: todayStr,
              taskTitle: 'No Active Task',
              projectName: '—',
              summary: '—',
              breakSeconds: 0,
              workingSeconds: 0,
              status: attendanceRes.checkOutTime ? 'FINISH' : 'RUNNING',
              startTime: null,
              endTime: null,
              manualCheckIn: attendanceRes.checkInTime,
              manualCheckOut: attendanceRes.checkOutTime
            },
            ...contentList
          ];
        }
      }

      setLogs(contentList);
      setLogTotal(logsData?.totalElements || contentList.length);
      setLogPages(logsData?.totalPages || 1);
      setLogPage(pg);
    } catch (e) {
      console.warn('Could not load dev logs:', e.message);
    }
  }, [logF, logSize]);

  useEffect(() => {
    loadCurrent();
  }, []);

  // Auto-search logs when filter changes
  useEffect(() => {
    const handler = setTimeout(() => {
      loadLogs(0, logF);
    }, 300);
    return () => clearTimeout(handler);
  }, [logF, loadLogs]);

  // ── Timers ───────────────────────────────────────────────────
  useEffect(() => {
    let iv = null;
    if (status === 'running') {
      iv = setInterval(() => {
        setElapsed(() => {
          const now = Date.now();
          const start = sessionStartRef.current || now;
          return Math.floor((now - start) / 1000);
        });
      }, 1000);
    }
    return () => clearInterval(iv);
  }, [status]);

  useEffect(() => {
    let iv = null;
    if (status === 'break') {
      lastBeepTimeRef.current = 0;
      iv = setInterval(() => {
        setBreakEl(() => {
          const now = Date.now();
          const start = breakRef.current ? breakRef.current.getTime() : now;
          const newEl = Math.floor((now - start) / 1000);
          const reason = contextRef.current?.breakReason;
          const limit = getBreakLimitSeconds(reason);
          if (limit && newEl > limit) {
            if (lastBeepTimeRef.current === 0 || now - lastBeepTimeRef.current >= 30000) {
              lastBeepTimeRef.current = now;
              playBeep();
              sendDesktopNotification(reason, limit / 60);
              setToast({ type: 'error', message: `⚠️ ${reason} limit (${limit / 60} mins) exceeded!` });
            }
          }
          return newEl;
        });
      }, 1000);
    } else {
      setBreakEl(0);
      breakRef.current = null;
      lastBeepTimeRef.current = 0;
    }
    return () => clearInterval(iv);
  }, [status]);

  const isFormValid = () => !!(selectedTask);

  // ── Handlers ─────────────────────────────────────────────────
  const handleStart = async () => {
    if (!isFormValid()) { alert('Please select an assigned active task to start.'); return; }
    setBusy(true);
    try {
      const data = await apiCall('/workwise/start', 'POST', {
        taskId: selectedTask.id,
        isOvertime: isOvertimeActive
      });
      setContext(data);
      setTimeLogId(data.timeLogId);
      setElapsed(0);
      sessionStartRef.current = Date.now();
      setStatus('running');
      setToast({ type: 'info', message: `▶ Work session started for "${selectedTask.title}"` });
      loadLogs(0);
    } catch (e) {
      alert('Error starting task: ' + e.message);
    } finally { setBusy(false); }
  };

  const handleStop = async () => {
    if (stopStatus === 'on-hold' && !holdReason) {
      alert('Please select an on-hold reason.');
      return;
    }
    setBusy(true);
    try {
      const result = await apiCall('/workwise/stop', 'POST', {
        timeLogId,
        pagesCompleted: 0,
        markTaskCompleted: stopStatus === 'completed',
        status: stopStatus,
        onHoldReason: holdReason || null,
        summary: sessionSummary.trim() || 'Developer work session',
      });

      // Reset all state
      setStatus('stopped');
      setContext(null);
      setTimeLogId(null);
      setElapsed(0);
      setBreakEl(0);
      setShowStop(false);
      setStopStatus('stopped');
      setHoldReason('');
      setHoldOther('');
      setSessionSummary('');
      setSelTask('');
      setSelectedTask(null);

      await loadLogs(0);
      if (typeof setTasks === 'function') {
        const res = await apiCall('/developer/tasks');
        if (res) setTasks(res.map(t => ({ ...t, completed: t.status === 'Completed' })));
      }

      if (result?.message) setToast({ type: 'info', message: `✅ ${result.message}` });
    } catch (e) {
      alert('Error stopping task: ' + e.message);
    } finally { setBusy(false); }
  };

  const handleBreakStart = async () => {
    if (!bReason) { alert('Please select a break reason.'); return; }
    if (bReason === 'Other' && !bCustom.trim()) { alert('Please specify the reason for break.'); return; }
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    setBusy(true);
    try {
      const data = await apiCall('/workwise/break/start', 'POST', {
        timeLogId: timeLogId || null,
        breakReason: bReason,
        customReason: bReason === 'Other' ? bCustom : null,
        description: bDesc || null,
      });
      setContext(data);
      if (data) {
        setTimeLogId(data.timeLogId);
        const workSec = (data.workingSeconds !== undefined && data.workingSeconds !== null)
          ? data.workingSeconds
          : Math.max(0, (data.elapsedSeconds || 0) - (data.breakSeconds || 0));
        setElapsed(workSec);
      }
      setStatus('break');
      breakRef.current = new Date();
      setBreakEl(0);
      setShowBreak(false);
      const limit = getBreakLimitSeconds(bReason);
      setToast({
        type: 'info',
        message: limit
          ? `☕ ${bReason} started. Limit is ${limit / 60} minutes.`
          : `☕ Break (${bReason}) started.`
      });
      setBReason(''); setBCustom(''); setBDesc('');
    } catch (e) {
      alert('Error starting break: ' + e.message);
    } finally { setBusy(false); }
  };

  const handleResume = async () => {
    setBusy(true);
    try {
      const data = await apiCall('/workwise/break/end', 'POST', { timeLogId });
      if (data) {
        setContext(data);
        setTimeLogId(data.timeLogId);
        setStatus('running');
        const workSec = (data.workingSeconds !== undefined && data.workingSeconds !== null)
          ? data.workingSeconds
          : Math.max(0, (data.elapsedSeconds || 0) - (data.breakSeconds || 0));
        setElapsed(workSec);
        sessionStartRef.current = Date.now() - (workSec * 1000);
      } else {
        setContext(null); setTimeLogId(null);
        setStatus('stopped'); setElapsed(0);
        sessionStartRef.current = null;
        setSelTask(''); setSelectedTask(null);
        await loadLogs(0);
      }
      setBreakEl(0);
      breakRef.current = null;
    } catch (e) {
      alert('Error resuming: ' + e.message);
    } finally { setBusy(false); }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="dww-page">

      {/* ══ TOAST ══════════════════════════════════════════════ */}
      {toast && (
        <div className={`dww-toast ${toast.type}`}>
          <span className="dww-toast-icon">
            {toast.type === 'error' ? '🚨' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="dww-toast-message">{toast.message}</span>
          <button className="dww-toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* ══ STOP POPUP ══════════════════════════════════════════ */}
      {showStop && (
        <div className="dww-popup-overlay">
          <div className="dww-popup-box">
            <div className="dww-popup-header">
              <h3 className="dww-popup-title">⏹ Stop Dev Session</h3>
              <button className="dww-popup-close" onClick={() => {
                setShowStop(false); setStopStatus('stopped');
                setHoldReason(''); setSessionSummary('');
              }}>✕</button>
            </div>

            {/* Summary */}
            <div className="dww-popup-field">
              <label className="dww-popup-label">
                📝 Work Session Summary <span className="dww-req">*</span>
              </label>
              <textarea
                className="dww-popup-textarea"
                rows="3"
                placeholder="Describe code written, bugs resolved, modules built, PR links..."
                value={sessionSummary}
                onChange={e => setSessionSummary(e.target.value)}
              />
            </div>

            {/* Status selection */}
            <div className="dww-popup-radio-group">
              {/* Completed */}
              <label className={`dww-popup-radio-option ${stopStatus === 'completed' ? 'selected' : ''}`}>
                <input type="radio" name="dst" value="completed"
                  checked={stopStatus === 'completed'}
                  onChange={e => setStopStatus(e.target.value)} />
                <span className="dww-radio-content">
                  <span className="dww-radio-icon">✅</span>
                  <span className="dww-radio-text">
                    <strong>Task Completed</strong>
                    <span className="dww-radio-subtext">Mark this dev task as fully done</span>
                  </span>
                </span>
              </label>

              {/* On Hold */}
              <label className={`dww-popup-radio-option ${stopStatus === 'on-hold' ? 'selected' : ''}`}>
                <input type="radio" name="dst" value="on-hold"
                  checked={stopStatus === 'on-hold'}
                  onChange={e => setStopStatus(e.target.value)} />
                <span className="dww-radio-content">
                  <span className="dww-radio-icon">⏸️</span>
                  <span className="dww-radio-text">
                    <strong>On-Hold</strong>
                    <span className="dww-radio-subtext">Work paused — can resume later</span>
                  </span>
                </span>
              </label>

              {stopStatus === 'on-hold' && (
                <div className="dww-onhold-details">
                  <div className="dww-select-wrap">
                    <select className="dww-popup-select"
                      value={holdReason}
                      onChange={e => setHoldReason(e.target.value)}>
                      <option value="">Select Reason</option>
                      {ON_HOLD_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <span className="dww-arrow">▾</span>
                  </div>
                  {holdReason === 'Others' && (
                    <input type="text"
                      className="dww-popup-input dww-onhold-other-input"
                      placeholder="Describe the reason"
                      value={holdOther}
                      onChange={e => setHoldOther(e.target.value)} />
                  )}
                </div>
              )}

              {/* Stopped / WIP */}
              <label className={`dww-popup-radio-option ${stopStatus === 'stopped' ? 'selected' : ''}`}>
                <input type="radio" name="dst" value="stopped"
                  checked={stopStatus === 'stopped'}
                  onChange={e => setStopStatus(e.target.value)} />
                <span className="dww-radio-content">
                  <span className="dww-radio-icon">⏹️</span>
                  <span className="dww-radio-text">
                    <strong>WIP / Stopped</strong>
                    <span className="dww-radio-subtext">Work in progress — can restart later</span>
                  </span>
                </span>
              </label>
            </div>

            <div className="dww-popup-actions">
              <button className="dww-popup-btn dww-popup-btn-cancel"
                onClick={() => {
                  setShowStop(false); setStopStatus('stopped');
                  setHoldReason(''); setSessionSummary('');
                }}>
                Cancel
              </button>
              <button className="dww-popup-btn dww-popup-btn-submit"
                onClick={handleStop}
                disabled={busy}>
                {busy ? 'Stopping...' : 'Stop Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BREAK POPUP ═════════════════════════════════════════ */}
      {showBreak && (
        <div className="dww-popup-overlay">
          <div className="dww-popup-box">
            <div className="dww-popup-header">
              <h3 className="dww-popup-title">☕ Take a Break</h3>
              <button className="dww-popup-close" onClick={() => {
                setShowBreak(false);
                setBReason(''); setBCustom(''); setBDesc('');
              }}>✕</button>
            </div>

            <div className="dww-break-note">
              <span>ℹ️</span>
              Task work time will pause during break and resume when you complete the break.
            </div>

            <div className="dww-popup-field">
              <label className="dww-popup-label">
                ☕ Break Reason <span className="dww-req">*</span>
              </label>
              <div className="dww-select-wrap">
                <select className="dww-popup-select"
                  value={bReason}
                  onChange={e => setBReason(e.target.value)}>
                  <option value="">Select a reason</option>
                  {BREAK_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <span className="dww-arrow">▾</span>
              </div>
            </div>

            {bReason === 'Other' && (
              <div className="dww-popup-field">
                <label className="dww-popup-label">
                  📝 Specify Reason <span className="dww-req">*</span>
                </label>
                <input type="text" className="dww-popup-input"
                  placeholder="Describe your reason"
                  value={bCustom}
                  onChange={e => setBCustom(e.target.value)} />
              </div>
            )}

            <div className="dww-popup-field">
              <label className="dww-popup-label">💬 Description (Optional)</label>
              <textarea className="dww-popup-textarea" rows="3"
                placeholder="Optional notes about this break"
                value={bDesc}
                onChange={e => setBDesc(e.target.value)} />
            </div>

            <div className="dww-popup-actions">
              <button className="dww-popup-btn dww-popup-btn-cancel"
                onClick={() => {
                  setShowBreak(false);
                  setBReason(''); setBCustom(''); setBDesc('');
                }}>
                Cancel
              </button>
              <button className="dww-popup-btn dww-popup-btn-submit"
                onClick={handleBreakStart} disabled={busy}>
                {busy ? 'Starting...' : 'Start Break'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN CARD ═══════════════════════════════════════════ */}
      <div className="dww-card dww-top-card">
        <div className="dww-card-header">
          <h2 className="dww-section-title">⚙️ Dev WorkWise</h2>
          <div className={`dww-status-pill ${status}`}>
            {status === 'running' ? '▶ Running'
              : status === 'break' ? '☕ On Break'
                : '⏸ Stopped'}
          </div>
        </div>

        {/* Check-in guard */}
        {!isCheckedIn && !isOvertimeActive ? (
          <div className="dww-checkin-guard">
            <span className="dww-guard-icon">⚠️</span>
            <h3>Attendance Check-In Required</h3>
            <p>You must Check In or Start Overtime on the main Dashboard to use the WorkWise tracker.</p>
          </div>
        ) : (
          <div className="dww-form">

            {/* ── STOPPED: selection form ── */}
            {status === 'stopped' && (
              <div className="dww-fields-group">

                {/* Task selector */}
                <div className="dww-field">
                  <label className="dww-label">
                    <span>🎯</span> Developer Task
                    <span className="dww-label-desc">(Select — other fields auto-fill, read-only)</span>
                  </label>
                  <div className="dww-select-wrap">
                    <select className="dww-select" value={selTask}
                      onChange={e => setSelTask(e.target.value)}>
                      <option value="">— Select an assigned dev task —</option>
                      {myAssignedTasks.length > 0 && (
                        <optgroup label="📋 Active Dev Tasks">
                          {myAssignedTasks.map(t => (
                            <option key={t.id} value={t.id}>
                              [{t.project || t.projectName || 'Project'}] {t.title}
                              {t.priority ? ` · ${t.priority}` : ''}
                              {t.dueDate ? ` · Due: ${fmtDate(t.dueDate)}` : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <span className="dww-arrow">▾</span>
                  </div>

                  {myAssignedTasks.length === 0 && (
                    <span className="dww-sub-hint">No active tasks assigned to you yet.</span>
                  )}

                  {/* Task chips */}
                  {selectedTask && (
                    <div className="dww-task-chip-row">
                      {selectedTask.priority && (
                        <span className={`dww-chip-priority priority-${(selectedTask.priority || '').toLowerCase()}`}>
                          {selectedTask.priority} Priority
                        </span>
                      )}
                      {selectedTask.dueDate && (
                        <span className="dww-chip-due">
                          📅 Due: {fmtDate(selectedTask.dueDate)}
                        </span>
                      )}
                      {selectedTask.project && (
                        <span className="dww-chip-project">
                          📁 {selectedTask.project}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Auto-filled read-only fields */}
                {selectedTask ? (
                  <>
                    <div className="dww-readonly-grid">
                      <ReadOnly label="Project" icon="📁"
                        value={selectedTask.project || selectedTask.projectName}
                        placeholder="Auto-filled from task" />
                      <ReadOnly label="Priority" icon="🎯"
                        value={selectedTask.priority}
                        placeholder="Auto-filled from task" />
                      <ReadOnly label="Due Date" icon="📅"
                        value={fmtDate(selectedTask.dueDate)}
                        placeholder="Auto-filled from task" />
                      <ReadOnly label="Assigned By" icon="👤"
                        value={selectedTask.assignedBy}
                        placeholder="Auto-filled from task" />
                    </div>
                    {selectedTask.description && (
                      <div className="dww-field">
                        <label className="dww-label"><span>📝</span> Task Description</label>
                        <div className="dww-task-desc-display">{selectedTask.description}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="dww-manual-hint">
                    <span>💡</span>
                    Select an assigned developer task above to auto-populate task details and start the timer.
                  </div>
                )}

                {/* Action buttons */}
                <div className="dww-btn-container">
                  <button
                    className={`dww-toggle-btn ${isFormValid() ? 'dww-btn-start' : 'dww-btn-disabled'}`}
                    onClick={handleStart}
                    disabled={!isFormValid() || busy}>
                    {busy ? 'Starting...' : '▶ Start Task'}
                  </button>
                  <button
                    className="dww-btn-break dww-toggle-btn"
                    onClick={() => setShowBreak(true)}
                    disabled={busy}>
                    ☕ Take Break
                  </button>
                </div>
              </div>
            )}

            {/* ── BREAK state ── */}
            {status === 'break' && (
              <div className="dww-dynamic-running-section">
                <h2 className="dww-working-title"><span>☕</span> On Break</h2>

                <div className="dww-timers-row">
                  {context?.projectName && (
                    <div className="dww-timer-banner dww-timer-running" style={{ flex: 1 }}>
                      <div className="dww-timer-display">{fmt(elapsed)}</div>
                      <div className="dww-timer-label">TASK WORK TIME (PAUSED)</div>
                    </div>
                  )}
                  <div className="dww-timer-banner dww-timer-break" style={{ flex: 1 }}>
                    <div className="dww-timer-display">{fmt(breakEl)}</div>
                    <div className="dww-timer-label">BREAK DURATION</div>
                  </div>
                </div>

                {/* Break limit progress */}
                {(() => {
                  const reason = context?.breakReason;
                  const limit = getBreakLimitSeconds(reason);
                  if (!limit) return null;
                  const isExceeded = breakEl > limit;
                  const pct = Math.min((breakEl / limit) * 100, 100);
                  const remaining = Math.max(0, limit - breakEl);
                  return (
                    <div className={`dww-break-progress-container ${isExceeded ? 'exceeded' : ''}`}>
                      <div className="dww-break-progress-header">
                        <span className="dww-bp-limit-label">⏱️ Limit: {limit / 60} mins ({reason})</span>
                        <span className={`dww-bp-time-label ${isExceeded ? 'danger' : ''}`}>
                          {isExceeded ? `Exceeded by ${fmt(breakEl - limit)}` : `Remaining: ${fmt(remaining)}`}
                        </span>
                      </div>
                      <div className="dww-break-progress-bar">
                        <div className={`dww-break-progress-fill ${isExceeded ? 'exceeded' : ''}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      {isExceeded && (
                        <div className="dww-break-exceeded-warning">
                          🚨 Please resume your work! Break limit exceeded.
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="dww-break-info">
                  <p className="dww-break-text">
                    {context?.breakReason ? `☕ Break reason: ${context.breakReason}` : 'Timer is paused. Resume when ready.'}
                  </p>
                  <p className="dww-break-subtext">
                    {context?.projectName
                      ? 'Task timer keeps running. Break time is subtracted from your productive time.'
                      : 'Shift break is tracked separately and will be recorded in your time logs.'}
                  </p>
                </div>

                {context?.projectName && (
                  <div className="dww-break-task-info">
                    <span className="dww-bti-item">
                      <span className="dww-bti-label">Task</span>
                      <span>
                        {context.taskTitle || context.isbnBookTitle || '-'}
                        {context.isOvertime && <span className="dww-ot-badge" style={{ marginLeft: 6 }}>OT</span>}
                      </span>
                    </span>
                    <span className="dww-bti-item">
                      <span className="dww-bti-label">Project</span>
                      <span>{context.projectName || '-'}</span>
                    </span>
                    {context.dueDate && (
                      <span className="dww-bti-item">
                        <span className="dww-bti-label">Due Date</span>
                        <span>{fmtDate(context.dueDate)}</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="dww-running-buttons">
                  <button className="dww-btn-resume" onClick={handleResume} disabled={busy}>
                    {busy ? 'Resuming...' : '▶ Resume Work'}
                  </button>
                  {context?.projectName && (
                    <button className="dww-btn-stop-large" onClick={() => setShowStop(true)}>
                      ⏹ Stop Session
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── RUNNING state ── */}
            {status === 'running' && context && (
              <div className="dww-dynamic-running-section">
                <div className="dww-timer-banner dww-timer-running">
                  <div className="dww-timer-display">{fmt(elapsed)}</div>
                  <div className="dww-timer-label">
                    ELAPSED TIME
                    {context.isOvertime && <span className="dww-ot-badge">OT</span>}
                  </div>
                </div>

                <div className="dww-running-grid">
                  {[
                    ['⏱️', 'bg-purple', 'border-blue', 'STARTED AT',
                      context.startedAt ? new Date(context.startedAt).toLocaleTimeString('en-IN') : '-'],
                    ['📁', 'bg-green', 'border-green', 'PROJECT', context.projectName || '-'],
                    ['🎯', 'bg-orange', 'border-orange', 'PRIORITY', context.priority || '-'],
                    ['📅', 'bg-pink', 'border-pink', 'DUE DATE', fmtDate(context.dueDate)],
                    ['👤', 'bg-teal', 'border-teal', 'ASSIGNED BY', context.assignedBy || '-'],
                    ['📋', 'bg-blue', 'border-blue', 'TASK TITLE',
                      (context.taskTitle || context.isbnBookTitle || '-') +
                      (context.isOvertime ? ' (OT)' : '')],
                  ].map(([icon, iconBg, border, label, val]) => (
                    <div key={label} className={`dww-run-card ${border}`}>
                      <div className="dww-run-card-header">
                        <span className={`dww-run-icon ${iconBg}`}>{icon}</span>
                        <span className="dww-run-label">{label}</span>
                      </div>
                      <div className="dww-run-value">{val}</div>
                    </div>
                  ))}
                </div>

                {context.taskDescription && (
                  <div className="dww-field" style={{ width: '100%' }}>
                    <label className="dww-label"><span>📝</span> Task Description</label>
                    <div className="dww-task-desc-display">{context.taskDescription}</div>
                  </div>
                )}

                <div className="dww-running-buttons">
                  <button className="dww-btn-break" onClick={() => setShowBreak(true)}>☕ Take Break</button>
                  <button className="dww-btn-stop-large" onClick={() => setShowStop(true)}>⏹ Stop Session</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ TIME LOGS ════════════════════════════════════════════ */}
      <div className="dww-card dww-bottom-card">
        <div className="dww-logs-header">
          <h3 className="dww-logs-title">📋 My Dev Time Logs</h3>
          <span className="dww-logs-count">{logTotal} records</span>
        </div>

        <div className="dww-filters">
          {/* Status */}
          <div className="dww-filter-col">
            <label>Status</label>
            <select className="dww-filter-select"
              value={logF.status}
              onChange={e => setLogF(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Status</option>
              {LOG_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="dww-filter-col">
            <label>Start Date</label>
            <input type="date" className="dww-filter-date"
              value={logF.startDate}
              onChange={e => setLogF(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="dww-filter-col">
            <label>End Date</label>
            <input type="date" className="dww-filter-date"
              value={logF.endDate}
              onChange={e => setLogF(f => ({ ...f, endDate: e.target.value }))} />
          </div>

          {/* Clear */}
          <div className="dww-filter-col dww-clear-col">
            <button className="dww-clear-btn" style={{ width: '100%' }}
              onClick={() => setLogF({ status: '', startDate: '', endDate: '' })}>
              Clear Filters
            </button>
          </div>
        </div>

        <div className="dww-table-container">
          <table className="dww-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '110px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '200px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '80px' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Date</th>
                <th style={{ textAlign: 'center' }}>Check In</th>
                <th style={{ textAlign: 'center' }}>Check Out</th>
                <th style={{ textAlign: 'center' }}>Work Start</th>
                <th style={{ textAlign: 'center' }}>Work End</th>
                <th style={{ textAlign: 'left' }}>Project</th>
                <th style={{ textAlign: 'left' }}>Task</th>
                <th style={{ textAlign: 'left' }}>Summary</th>
                <th style={{ textAlign: 'center' }}>Break Time</th>
                <th style={{ textAlign: 'center' }}>Working Time</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="dww-table-empty">No time logs found.</td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td style={{ textAlign: 'center' }}>{fmtDate(log.logDate)}</td>
                  <td className="dww-td-mono" style={{ textAlign: 'center' }}>{formatTime(log.manualCheckIn)}</td>
                  <td className="dww-td-mono" style={{ textAlign: 'center' }}>{formatTime(log.manualCheckOut)}</td>
                  <td className="dww-td-mono" style={{ textAlign: 'center' }}>{formatTime(log.startTime)}</td>
                  <td className="dww-td-mono" style={{ textAlign: 'center' }}>{formatTime(log.endTime)}</td>
                  <td style={{ textAlign: 'left', wordBreak: 'break-word' }}>{log.projectName || '-'}</td>
                  <td style={{ textAlign: 'left', wordBreak: 'break-word' }}>
                    <strong>{log.taskTitle || log.isbnTitle || '-'}</strong>
                    {log.isOvertime && <span className="dww-ot-tag">OT</span>}
                  </td>
                  <td style={{ textAlign: 'left', fontSize: '0.82rem', color: '#64748b', wordBreak: 'break-word' }}>
                    {log.summary || '-'}
                  </td>
                  <td className="dww-td-mono" style={{ textAlign: 'center' }}>{log.breakSeconds ? fmt(log.breakSeconds) : '-'}</td>
                  <td className="dww-td-mono" style={{ textAlign: 'center' }}>{log.workingSeconds != null ? fmt(log.workingSeconds) : '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`dww-status-chip ${chipClass(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dww-pagination">
          <div className="dww-page-items">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888' }}>Items per page:</label>
              <select
                value={logSize}
                onChange={e => { const n = Number(e.target.value); setLogSize(n); loadLogs(0, logF, n); }}
                style={{ padding: '3px 6px', border: '1.5px solid #e8e8ee', borderRadius: '6px', fontSize: '0.75rem', background: '#fff' }}
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span>Showing {logs.length} of {logTotal} records</span>
          </div>
          {logPages > 1 && (
            <div className="dww-page-controls">
              <button className="dww-page-btn" disabled={logPage === 0} onClick={() => loadLogs(logPage - 1)}>‹</button>
              {Array.from({ length: Math.min(logPages, 7) }, (_, i) => i).map(n => (
                <button key={n}
                  className={`dww-page-btn ${logPage === n ? 'active' : ''}`}
                  onClick={() => loadLogs(n)}>
                  {n + 1}
                </button>
              ))}
              {logPages > 7 && <span className="dww-page-ellipsis">…</span>}
              <button className="dww-page-btn" disabled={logPage >= logPages - 1} onClick={() => loadLogs(logPage + 1)}>›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevWorkwise;
