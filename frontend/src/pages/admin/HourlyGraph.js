import React, { useState, useRef, useEffect, useMemo } from "react";
import "./HourlyGraph.css";
import { apiCall, getCurrentUser } from "../../utils/api";

const HOUR_ACCENT_CLASSES = ["h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8"];
const hourAccent = (i) => HOUR_ACCENT_CLASSES[i % HOUR_ACCENT_CLASSES.length];

const ordinal = (n) => {
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return `${n}st`;
    if (j === 2 && k !== 12) return `${n}nd`;
    if (j === 3 && k !== 13) return `${n}rd`;
    return `${n}th`;
};

const ROW_BANDS = ["band-a", "band-b", "band-c", "band-d", "band-e", "band-f"];

const vk = (groupKey, colId) => `${groupKey}::${colId}`;

// ── Inline-editable header label (only editable by Admin) ────────────────────
function EditableHeader({ value, onChange, className = "", placeholder = "Label", disabled = false }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
        if (editing) setDraft(value);
    }, [editing, value]);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const commit = () => {
        const v = draft.trim();
        onChange(v || value);
        setEditing(false);
    };

    if (disabled) {
        return <span className={`${className}`}>{value}</span>;
    }

    if (editing) {
        return (
            <input
                ref={inputRef}
                className={`hg-edit-input ${className}`}
                value={draft}
                placeholder={placeholder}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") setEditing(false);
                }}
            />
        );
    }

    return (
        <span
            className={`hg-editable-label ${className}`}
            onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
            }}
            title="Click to rename"
        >
            {value}
        </span>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HourlyGraph() {
    const TODAY = new Date().toISOString().slice(0, 10);
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.roles?.includes("Admin");
    const isPrivileged = currentUser?.roles?.some(r => r === "Admin" || r === "Manager" || r === "Team Leader");
    const currentUserId = currentUser?.userId;
    const showTargetGraph = true;

    const [periodDate, setPeriodDate] = useState(TODAY);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [activeDay, setActiveDay] = useState("");
    const [hourCount, setHourCount] = useState(8);
    const [rows, setRows] = useState([]);

    // Master data from DB
    const [projects, setProjects] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [shifts, setShifts] = useState([]);

    // Target table column groups and values
    const [columnGroups, setColumnGroups] = useState([]);
    const [targetRows, setTargetRows] = useState([]);
    const [addingGroup, setAddingGroup] = useState(null);
    const [newColName, setNewColName] = useState("");

    const [search, setSearch] = useState("");
    const [savedAt, setSavedAt] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCheckedIn, setIsCheckedIn] = useState(true); // Default to true to prevent screen flash
    const [notification, setNotification] = useState(null); // Floating pop-up notification

    const dateInputRef = useRef(null);
    const monthYearLabel = new Date(periodDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const hourLabels = Array.from({ length: hourCount }, (_, i) => ordinal(i + 1));

    const markDirty = () => setDirty(true);

    // ── Fetch Setup and Daily Data ──
    useEffect(() => {
        const loadMasterData = async () => {
            try {
                // Verify check-in status for employees
                if (!isAdmin) {
                    const attToday = await apiCall("/attendance/today");
                    setIsCheckedIn(!!attToday?.checkInTime);
                }

                const pData = await apiCall("/projects");
                const procData = await apiCall("/processes");
                const sData = await apiCall("/shifts");
                const settings = await apiCall("/hourly-graph/settings");

                setProjects(pData || []);
                setProcesses(procData || []);
                setShifts(sData || []);
                setColumnGroups(settings?.columnGroups || []);

                // Map projects and default targets
                const activeProjects = pData || [];
                const savedTargets = settings?.targetRows || [];
                const mergedTargets = [];
                activeProjects.forEach(p => {
                    const formatted = p.clientName ? `${p.clientName}_${p.name}` : p.name;
                    const existing = savedTargets.find(r => r.project === formatted);
                    if (existing) {
                        mergedTargets.push({
                            ...existing,
                            id: existing.id || `tgt-${p.id}`
                        });
                    } else {
                        mergedTargets.push({
                            id: `tgt-${p.id}`,
                            project: formatted,
                            values: {}
                        });
                    }
                });
                // Keep any extra targets that aren't matches for current active projects
                savedTargets.forEach(r => {
                    if (!mergedTargets.some(mt => mt.project === r.project)) {
                        mergedTargets.push(r);
                    }
                });
                setTargetRows(mergedTargets);

            } catch (err) {
                console.error("Failed to fetch setup details:", err);
                setError("Failed to load setup resources.");
            }
        };
        loadMasterData();
    }, [isAdmin]);

    useEffect(() => {
        const loadDailyLogs = async () => {
            try {
                setLoading(true);
                const data = await apiCall(`/hourly-graph/logs?date=${periodDate}`);
                setRows(data?.rows || []);
                setActiveDay(data?.activeDay || "");
                setDirty(false);
                setError("");
            } catch (err) {
                console.error("Failed to load logs:", err);
                setError("Failed to fetch hourly production records.");
            } finally {
                setLoading(false);
            }
        };
        loadDailyLogs();
    }, [periodDate]);

    // Keep hourCount in sync with maximum hours array length in rows
    useEffect(() => {
        if (rows.length > 0) {
            const maxHours = Math.max(...rows.map(r => r.hours?.length || 0), 8);
            setHourCount(maxHours);
        }
    }, [rows]);

    // ── Hourly Notification Reminder Popup check ──
    useEffect(() => {
        if (isAdmin || rows.length === 0) return;
        const myRow = rows.find(r => r.userId === currentUserId);
        if (!myRow) return;

        const checkReminder = () => {
            for (let i = 0; i < hourCount; i++) {
                if (isHourActive(i, myRow.shift, myRow.inTime)) {
                    const hData = myRow.hours?.[i];
                    const hValue = typeof hData === "object" && hData !== null ? (hData.value || "") : (hData || "");
                    const hProc = typeof hData === "object" && hData !== null ? (hData.process || "") : "";

                    if (!hValue || !hProc) {
                        setNotification({
                            hourIdx: i,
                            message: `🔔 It's time to log your production for the ${ordinal(i + 1)} hour! You have a 10-minute active window to enter process and count.`
                        });
                        return;
                    }
                }
            }
            setNotification(null);
        };

        checkReminder();
        const timer = setInterval(checkReminder, 30000); // Check every 30 seconds
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, hourCount, shifts]);

    const getInitials = (name) => {
        if (!name) return "?";
        const parts = name.split(" ").filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const getAvatarBg = (name) => {
        if (!name) return "#cbd5e1";
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash % 360);
        return `hsl(${h}, 65%, 40%)`;
    };

    const targetUserRow = useMemo(() => {
        let targetUserId = currentUserId;
        if (isPrivileged && selectedUserId) {
            targetUserId = selectedUserId;
        }
        return rows.find(r => r.userId?.toString().toLowerCase() === targetUserId?.toString().toLowerCase());
    }, [rows, currentUserId, isPrivileged, selectedUserId]);

    const userSummaries = useMemo(() => {
        let baseRows = rows.filter(r => !r.excluded);
        let targetUserId = currentUserId;
        if (isPrivileged && selectedUserId) {
            targetUserId = selectedUserId;
        }
        baseRows = baseRows.filter(r => r.userId?.toString().toLowerCase() === targetUserId?.toString().toLowerCase());
        return baseRows
            .map(r => {
                const processesMap = {};
                let hasWork = false;

                if (r.hours && Array.isArray(r.hours)) {
                    r.hours.forEach(h => {
                        const value = parseFloat(h?.value) || 0;
                        if (value > 0) {
                            hasWork = true;
                            const processName = h?.process || r.process || "Unassigned";
                            processesMap[processName] = (processesMap[processName] || 0) + value;
                        }
                    });
                }

                return {
                    userId: r.userId,
                    name: r.name || "Unknown Employee",
                    processes: processesMap,
                    hasWork
                };
            })
            .filter(s => s.hasWork);
    }, [rows, currentUserId, isPrivileged, selectedUserId]);

    // ── Hourly edit timing helper (employees can only edit during active window) ──
    const isHourActive = (hourIdx, shiftName, checkInTimeStr) => {
        if (isAdmin) return true;
        if (periodDate !== TODAY) return false;
        if (!checkInTimeStr) return false;

        const [sh] = checkInTimeStr.split(":").map(Number);
        const targetHour = (sh + 1 + hourIdx) % 24;

        const now = new Date();
        let targetTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, 0, 0);

        if (sh > targetHour) {
            if (now.getHours() >= sh) {
                targetTimeToday.setDate(targetTimeToday.getDate() + 1);
            }
        } else {
            if (now.getHours() < sh) {
                targetTimeToday.setDate(targetTimeToday.getDate() - 1);
            }
        }

        const diffMs = now - targetTimeToday;
        const diffMin = diffMs / 1000 / 60;

        return diffMin >= 0 && diffMin <= 10;
    };

    const canEditHour = (row, hIdx) => {
        if (isPrivileged) return true;
        if (row.userId !== currentUserId) return false;
        return isHourActive(hIdx, row.shift, row.inTime);
    };

    // ── Save Function ──
    const handleSave = async () => {
        try {
            setError("");
            if (isAdmin) {
                // Save target settings
                await apiCall("/hourly-graph/settings", "POST", {
                    columnGroups,
                    targetRows
                });
            }

            // Save daily logs
            const filteredToSave = isPrivileged ? rows : rows.filter(r => r.userId === currentUserId);
            if (filteredToSave.length > 0) {
                await apiCall("/hourly-graph/logs", "POST", {
                    date: periodDate,
                    rows: filteredToSave
                });
            }

            setSavedAt(new Date());
            setDirty(false);
            alert("Report saved successfully!");
        } catch (err) {
            console.error("Save failed:", err);
            setError(err.message || "Failed to save Hourly Graph report.");
            alert("Save failed: " + (err.message || "Unknown error"));
        }
    };

    // ── Save Targets specifically Function ──
    const handleSaveTargets = async () => {
        try {
            setError("");
            await apiCall("/hourly-graph/settings", "POST", {
                columnGroups,
                targetRows
            });
            setSavedAt(new Date());
            setDirty(false);
            alert("Daily production targets saved successfully!");
        } catch (err) {
            console.error("Failed to save targets:", err);
            setError(err.message || "Failed to save daily production targets.");
            alert("Save failed: " + (err.message || "Unknown error"));
        }
    };

    // ── Visibility / Exclude Icon handler ──
    const handleToggleVisibility = async (userId, currentExcluded) => {
        const action = currentExcluded ? "show" : "hide";
        if (!window.confirm(`Are you sure you want to ${action} this employee?`)) return;
        try {
            const nextExcluded = !currentExcluded;
            await apiCall(`/hourly-graph/users/${userId}/toggle-visibility`, "POST", { exclude: nextExcluded });
            setRows(prev => prev.map(r => r.userId === userId ? { ...r, excluded: nextExcluded } : r));
        } catch (err) {
            console.error("Failed to toggle visibility:", err);
            alert("Error: " + err.message);
        }
    };

    // ── Row updates ──
    const updateRow = (id, field, value) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
        markDirty();
    };

    const updateHour = (id, hourIdx, field, value) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const hours = [...(r.hours || [])];
                while (hours.length <= hourIdx) {
                    hours.push({ process: "", value: "" });
                }
                const oldItem = hours[hourIdx];
                const oldObj = typeof oldItem === "object" && oldItem !== null ? oldItem : { process: "", value: oldItem || "" };
                hours[hourIdx] = { ...oldObj, [field]: value };
                return { ...r, hours };
            })
        );
        markDirty();
    };


    const addHourColumn = () => {
        if (!isAdmin) return;
        setHourCount((c) => c + 1);
        setRows((prev) => prev.map((r) => ({ ...r, hours: [...r.hours, { process: "", value: "" }] })));
        markDirty();
    };

    // ── Target value handlers (Admin only) ──
    const updateTargetProject = (id, value) => {
        if (!isAdmin) return;
        setTargetRows((prev) => prev.map((r) => (r.id === id ? { ...r, project: value } : r)));
        markDirty();
    };

    const updateTargetValue = (id, groupKey, colId, value) => {
        if (!isAdmin) return;
        setTargetRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, values: { ...r.values, [vk(groupKey, colId)]: value } } : r))
        );
        markDirty();
    };

    const addTargetRow = () => {
        if (!isAdmin) return;
        const newId = `tgt-${Date.now()}`;
        setTargetRows((prev) => [...prev, { id: newId, project: "", values: {}, isNew: true }]);
        markDirty();
    };

    const removeTargetRow = (id) => {
        if (!isAdmin) return;
        if (!window.confirm("Are you sure you want to delete this project target row?")) return;
        setTargetRows((prev) => prev.filter((r) => r.id !== id));
        markDirty();
    };

    // ── Column-group header handlers (Admin only) ──
    const updateGroupLabel = (groupKey, label) => {
        if (!isAdmin) return;
        setColumnGroups((prev) => prev.map((g) => (g.key === groupKey ? { ...g, label } : g)));
        markDirty();
    };

    const updateColumnLabel = (groupKey, colId, label) => {
        if (!isAdmin) return;
        setColumnGroups((prev) =>
            prev.map((g) =>
                g.key === groupKey ? { ...g, columns: g.columns.map((c) => (c.id === colId ? { ...c, label } : c)) } : g
            )
        );
        markDirty();
    };

    const removeGroup = (groupKey) => {
        if (!isAdmin) return;
        if (!window.confirm("Are you sure you want to delete this column group and all its columns?")) return;
        setColumnGroups((prev) => (prev.length > 1 ? prev.filter((g) => g.key !== groupKey) : prev));
        markDirty();
    };

    const removeColumn = (groupKey, colId) => {
        if (!isAdmin) return;
        if (!window.confirm("Are you sure you want to delete this column?")) return;
        setColumnGroups((prev) => {
            const next = prev
                .map((g) => (g.key === groupKey ? { ...g, columns: g.columns.filter((c) => c.id !== colId) } : g))
                .filter((g) => g.columns.length > 0);
            return next.length > 0 ? next : prev;
        });
        markDirty();
    };

    const startAddColumn = (groupKey) => {
        if (!isAdmin) return;
        setAddingGroup(groupKey);
        setNewColName("");
    };

    const cancelAddColumn = () => {
        setAddingGroup(null);
        setNewColName("");
    };

    const confirmAddColumn = () => {
        if (!isAdmin) return;
        const name = newColName.trim();
        if (!name) {
            cancelAddColumn();
            return;
        }
        if (addingGroup === "__new__") {
            const newKey = `grp-${Date.now()}`;
            setColumnGroups((prev) => [
                ...prev,
                {
                    key: newKey,
                    label: name,
                    tint: ROW_BANDS[prev.length % ROW_BANDS.length],
                    columns: [{ id: `col-${Date.now()}`, label: "Value" }],
                },
            ]);
        } else {
            setColumnGroups((prev) =>
                prev.map((g) => (g.key === addingGroup ? { ...g, columns: [...g.columns, { id: `col-${Date.now()}`, label: name }] } : g))
            );
        }
        cancelAddColumn();
        markDirty();
    };

    const filteredRows = useMemo(() => {
        return rows.filter((r) => (search ? r.name.toLowerCase().includes(search.toLowerCase()) : true));
    }, [rows, search]);
    const totalTargetCols = 2 + columnGroups.reduce((a, g) => a + g.columns.length, 0) + (isAdmin ? 1 : 0);
    const totalEmployeeCols = 6 + hourLabels.length * 2 + (isAdmin ? 1 : 0);

    if (!isAdmin && !isCheckedIn) {
        return (
            <div className="emp-locked-container" style={{ padding: "80px 20px", display: "flex", justifyContent: "center" }}>
                <div className="emp-locked-card" style={{ background: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(16px)", border: "1px solid var(--hg-line)", borderRadius: "var(--hg-radius-lg)", padding: "40px", maxWidth: "450px", textAlign: "center", boxShadow: "var(--hg-shadow-md)" }}>
                    <div className="emp-locked-icon" style={{ fontSize: "50px", marginBottom: "16px" }}>🔒</div>
                    <h3 style={{ margin: "0 0 10px 0", fontWeight: 700 }}>Hourly Graph Locked</h3>
                    <p style={{ color: "var(--hg-text-sub)", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px 0" }}>You must Check-In to your shift to access the Hourly Graph page and record your production updates.</p>
                </div>
            </div>
        );
    }

    if (loading && rows.length === 0) {
        return <div className="hg-wrapper" style={{ padding: "40px", textAlign: "center" }}><h3>Loading Hourly Production Grid...</h3></div>;
    }

    return (
        <div className="hg-wrapper">
            {error && <div className="hg-error-banner">⚠️ {error}</div>}

            {/* ── Page Header ── */}
            <div className="hg-page-header">
                <div className="hg-page-title">
                    <span className="hg-page-icon">📊</span>
                    <h2>Hourly Production Report</h2>
                </div>
            </div>

            {/* ── Daily Production Target Graph ── */}
            {showTargetGraph && (
                <div className="hg-target-head">
                    <div className="hg-target-banner">
                        Arrow Data-Tech Daily Production Target Graph - {monthYearLabel}
                    </div>
                </div>
            )}

            <div className="hg-target-section-layout">
                {showTargetGraph && (
                    <div className="hg-sheet-card hg-target-card">
                        <div className="hg-table-container">
                            <table className="hg-table hg-target-table">
                                <thead>
                                    <tr>
                                        <th rowSpan={2} className="th-fixed th-sno">S.No</th>
                                        <th rowSpan={2} className="th-fixed th-project">Project Name</th>
                                        {columnGroups.map((group) => (
                                            <th key={group.key} colSpan={group.columns.length} className={`th-group th-group-${group.tint}`}>
                                                <div className="hg-group-header">
                                                    <EditableHeader
                                                        value={group.label}
                                                        onChange={(v) => updateGroupLabel(group.key, v)}
                                                        className="hg-group-label"
                                                        placeholder="Group name"
                                                        disabled={!isAdmin}
                                                    />
                                                    {isAdmin && columnGroups.length > 1 && (
                                                        <button
                                                            className="hg-del-col-btn"
                                                            onClick={() => removeGroup(group.key)}
                                                            title={`Remove ${group.label} group`}
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                    {isAdmin && (addingGroup === group.key ? (
                                                        <span className="hg-add-col-inline" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                autoFocus
                                                                className="hg-add-col-input"
                                                                placeholder="Column name"
                                                                value={newColName}
                                                                onChange={(e) => setNewColName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") confirmAddColumn();
                                                                    if (e.key === "Escape") cancelAddColumn();
                                                                }}
                                                            />
                                                            <button className="hg-add-col-ok" onClick={confirmAddColumn} title="Add">✓</button>
                                                            <button className="hg-add-col-cancel" onClick={cancelAddColumn} title="Cancel">✕</button>
                                                        </span>
                                                    ) : (
                                                        <button className="hg-add-col-btn" onClick={() => startAddColumn(group.key)} title={`Add column to ${group.label}`}>
                                                            +
                                                        </button>
                                                    ))}
                                                </div>
                                            </th>
                                        ))}
                                        {isAdmin && (
                                            <th rowSpan={2} className="th-add-group">
                                                {addingGroup === "__new__" ? (
                                                    <span className="hg-add-col-inline" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            autoFocus
                                                            className="hg-add-col-input"
                                                            placeholder="Group name"
                                                            value={newColName}
                                                            onChange={(e) => setNewColName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") confirmAddColumn();
                                                                if (e.key === "Escape") cancelAddColumn();
                                                            }}
                                                        />
                                                        <button className="hg-add-col-ok" onClick={confirmAddColumn} title="Add group">✓</button>
                                                        <button className="hg-add-col-cancel" onClick={cancelAddColumn} title="Cancel">✕</button>
                                                    </span>
                                                ) : (
                                                    <button className="hg-add-group-btn" onClick={() => startAddColumn("__new__")} title="Add a new column group">
                                                        + Group
                                                    </button>
                                                )}
                                            </th>
                                        )}
                                    </tr>
                                    <tr>
                                        {columnGroups.map((group) =>
                                            group.columns.map((c) => (
                                                <th key={`${group.key}-${c.id}`} className={`th-group th-group-${group.tint}`}>
                                                    <div className="hg-col-header">
                                                        <EditableHeader
                                                            value={c.label}
                                                            onChange={(v) => updateColumnLabel(group.key, c.id, v)}
                                                            placeholder="Column name"
                                                            disabled={!isAdmin}
                                                        />
                                                        {isAdmin && (
                                                            <button
                                                                className="hg-del-col-btn hg-del-col-btn--sm"
                                                                onClick={() => removeColumn(group.key, c.id)}
                                                                title={`Remove ${c.label} column`}
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                </th>
                                            ))
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {targetRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={totalTargetCols} className="hg-empty">No project targets configured.</td>
                                        </tr>
                                    ) : (
                                        targetRows.map((row, idx) => (
                                            <tr key={row.id} className={`hg-row ${ROW_BANDS[idx % ROW_BANDS.length]}`}>
                                                <td className="td-sno">
                                                    <span className="hg-sno-num">{idx + 1}</span>
                                                    {isAdmin && (
                                                        <button className="hg-sno-remove" onClick={() => removeTargetRow(row.id)} title="Remove row">✕</button>
                                                    )}
                                                </td>
                                                <td className="td-project">
                                                    {!row.isNew ? (
                                                        <span style={{ fontWeight: 700, paddingLeft: "5px" }}>{row.project}</span>
                                                    ) : (
                                                        <select
                                                            className="hg-cell-select tgt-project-select"
                                                            value={row.project}
                                                            onChange={(e) => updateTargetProject(row.id, e.target.value)}
                                                            disabled={!isAdmin}
                                                        >
                                                            <option value="">Select project…</option>
                                                            {projects.map((p) => {
                                                                const formatted = p.clientName ? `${p.clientName}_${p.name}` : p.name;
                                                                return <option key={p.id} value={formatted}>{formatted}</option>;
                                                            })}
                                                        </select>
                                                    )}
                                                </td>
                                                {columnGroups.map((group) =>
                                                    group.columns.map((c) => (
                                                        <td key={`${group.key}-${c.id}`}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="hg-cell-input hg-cell-input--value"
                                                                placeholder="-"
                                                                value={row.values[vk(group.key, c.id)] ?? ""}
                                                                onChange={(e) => updateTargetValue(row.id, group.key, c.id, e.target.value)}
                                                                disabled={!isAdmin}
                                                            />
                                                        </td>
                                                    ))
                                                )}
                                                {isAdmin && <td className="td-add-col-spacer" />}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {isAdmin && (
                                    <tfoot>
                                        <tr>
                                            <td colSpan={totalTargetCols} style={{ padding: "6px 8px" }}>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button className="hg-add-btn" onClick={addTargetRow}>+ Add Project Row</button>
                                                    <button className="hg-save-btn" onClick={handleSaveTargets}>💾</button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Daily Productivity Summaries by User ── */}
                <div className="hg-summary-container" style={!showTargetGraph ? { width: "100%", maxWidth: "100%" } : {}}>
                    <div className="hg-summary-header">
                        <span className="hg-summary-icon">✨</span>
                        <h3>Daily Production Card</h3>
                    </div>
                    <div className="hg-summary-scroll">
                        {userSummaries.length === 0 ? (
                            <div className="hg-summary-empty">No work recorded today for {targetUserRow?.name || "this user"}.</div>
                        ) : (
                            userSummaries.map((summary) => (
                                <div key={summary.userId || summary.name} className="hg-summary-card">
                                    <div className="hg-summary-user">
                                        <div
                                            className="hg-summary-avatar"
                                            style={{ backgroundColor: getAvatarBg(summary.name) }}
                                        >
                                            {getInitials(summary.name)}
                                        </div>
                                        <div className="hg-summary-user-info">
                                            <div className="hg-summary-user-name">{summary.name}</div>
                                            <div className="hg-summary-user-subtitle">Active today</div>
                                        </div>
                                    </div>
                                    <div className="hg-summary-detail-list">
                                        {Object.entries(summary.processes).map(([processName, pages]) => (
                                            <div key={processName} className="hg-summary-detail-row">
                                                <div className="hg-summary-process-name">
                                                    <span className="hg-summary-bullet" />
                                                    {processName}
                                                </div>
                                                <div className="hg-summary-pages-badge">
                                                    <strong>{pages}</strong> pages
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ── Slim functional toolbar ── */}
            <div className="hg-toolbar">
                <div className="hg-search-wrap">
                    <span className="hg-search-icon">🔍</span>
                    <input
                        className="hg-search"
                        placeholder="Search employee…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="hg-toolbar-actions">
                    {dirty ? (
                        <span className="hg-unsaved-tag">● Unsaved changes</span>
                    ) : savedAt ? (
                        <span className="hg-saved-tag">✓ Saved {savedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                    ) : null}
                    <button className="hg-save-btn" onClick={handleSave}>💾 Save Report</button>
                </div>
            </div>

            {/* ── Sheet header: DATE / DAY block + title banner ── */}
            <div className="hg-sheet-head">
                <div className="hg-dd-widget">
                    <div className="hg-dd-col">
                        <div className="hg-dd-label">DATE</div>
                        <div className="hg-dd-value" onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}>
                            {new Date(periodDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            <input
                                ref={dateInputRef}
                                type="date"
                                className="hg-date-hidden"
                                value={periodDate}
                                onChange={(e) => e.target.value && setPeriodDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="hg-dd-col">
                        <div className="hg-dd-label">DAY</div>
                        <span className="hg-dd-day-label">{activeDay || "—"}</span>
                    </div>
                </div>

                <div className="hg-title-banner">
                    Arrow Data-Tech Employee Daily Hourly Production Report Details - {monthYearLabel}
                </div>
            </div>

            {/* ── Sheet table ── */}
            <div className="hg-sheet-card">
                <div className="hg-table-container">
                    <table className="hg-table">
                        <thead>
                            <tr>
                                <th className="th-sno">S.NO</th>
                                <th className="th-name">NAME</th>
                                <th className="th-shift">SHIFT DETAILS</th>
                                <th className="th-time">IN TIME</th>
                                <th className="th-time">OUT TIME</th>
                                <th className="th-project">PROJECT NAME</th>
                                {hourLabels.map((h, i) => (
                                    <React.Fragment key={i}>
                                        <th className={`th-${hourAccent(i)} th-hour-process`}>PROCESS</th>
                                        <th className={`th-${hourAccent(i)}`}>{h} HOUR</th>
                                    </React.Fragment>
                                ))}
                                {isAdmin && (
                                    <th className="th-add-col">
                                        <button className="hg-add-hour-btn" onClick={addHourColumn} title="Add a process/hour column">+</button>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={totalEmployeeCols} className="hg-empty">
                                        No employees match your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, idx) => {
                                    const isSelf = row.userId === currentUserId;
                                    const canEditRow = isPrivileged || isSelf;

                                    return (
                                        <tr
                                            key={row.id}
                                            className={`hg-row ${ROW_BANDS[idx % ROW_BANDS.length]} ${selectedUserId === row.userId ? "hg-row--selected" : ""}`}
                                            style={row.excluded ? { opacity: 0.55, border: "2px dashed rgba(255, 255, 255, 0.4)" } : {}}
                                        >
                                            <td className="td-sno">
                                                <span className="hg-sno-num">{idx + 1}</span>
                                            </td>

                                            <td className="td-name" style={{ cursor: isPrivileged ? "pointer" : "default" }} onClick={() => {
                                                if (isPrivileged) {
                                                    setSelectedUserId(row.userId === selectedUserId ? null : row.userId);
                                                }
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    {isAdmin && row.userId && (
                                                        <button
                                                            className="hg-exclude-btn"
                                                            onClick={() => handleToggleVisibility(row.userId, row.excluded)}
                                                            title={row.excluded ? "Show this employee to other users" : "Hide this employee from other users"}
                                                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}
                                                        >
                                                            {row.excluded ? "🙈" : "👁️"}
                                                        </button>
                                                    )}
                                                    <span className="hg-cell-name-label">{row.name}</span>
                                                    {row.excluded && <span style={{ fontSize: "10px", opacity: 0.7, marginLeft: "4px" }}>(Hidden)</span>}
                                                </div>
                                            </td>

                                            <td className="td-shift">
                                                <select
                                                    className="hg-cell-select"
                                                    value={row.shift}
                                                    onChange={(e) => updateRow(row.id, "shift", e.target.value)}
                                                    disabled={!isAdmin}
                                                >
                                                    {shifts.map((s) => (
                                                        <option key={s.id} value={s.name}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="td-time">
                                                <input
                                                    type="time"
                                                    className="hg-cell-input td-checkin"
                                                    value={row.inTime}
                                                    disabled
                                                />
                                            </td>

                                            <td className="td-time">
                                                <input
                                                    type="time"
                                                    className="hg-cell-input td-checkout"
                                                    value={row.outTime}
                                                    disabled
                                                />
                                            </td>

                                            <td className="td-project">
                                                <select
                                                    className="hg-cell-select hg-cell-select--project"
                                                    value={row.project}
                                                    onChange={(e) => updateRow(row.id, "project", e.target.value)}
                                                    disabled={!canEditRow}
                                                >
                                                    <option value="">—</option>
                                                    {projects.map((p) => {
                                                        const formatted = p.clientName ? `${p.clientName}_${p.name}` : p.name;
                                                        return <option key={p.id} value={formatted}>{formatted}</option>;
                                                    })}
                                                </select>
                                            </td>

                                            {Array.from({ length: hourLabels.length }).map((_, hIdx) => {
                                                const hData = row.hours?.[hIdx] || { process: "", value: "" };
                                                const hValue = typeof hData === "object" && hData !== null ? (hData.value || "") : (hData || "");
                                                const hProcess = typeof hData === "object" && hData !== null ? (hData.process || "") : "";
                                                const isEditable = canEditHour(row, hIdx);

                                                return (
                                                    <React.Fragment key={hIdx}>
                                                        <td className={`td-${hourAccent(hIdx)} td-hour-process`}>
                                                            <select
                                                                className="hg-cell-select hg-cell-select--process"
                                                                value={hProcess}
                                                                onChange={(e) => updateHour(row.id, hIdx, "process", e.target.value)}
                                                                disabled={!isEditable}
                                                            >
                                                                <option value="">—</option>
                                                                {processes.map((p) => (
                                                                    <option key={p.id} value={p.name}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className={`td-${hourAccent(hIdx)}`}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="hg-cell-input hg-cell-input--value"
                                                                placeholder=""
                                                                value={hValue}
                                                                onChange={(e) => updateHour(row.id, hIdx, "value", e.target.value)}
                                                                disabled={!isEditable}
                                                            />
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}

                                            {isAdmin && <td className="td-add-col-spacer" />}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Floating Pop-Up Notification Reminder ── */}
            {notification && (
                <div className="hg-popup-notification">
                    <span className="hg-popup-close" onClick={() => setNotification(null)}>✕</span>
                    <p>{notification.message}</p>
                </div>
            )}
        </div>
    );
}

