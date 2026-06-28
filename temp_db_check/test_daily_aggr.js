const mappedLogs = []; // Empty logs for today

const checkInsList = [
  {
    "id": "1c72d0de-7814-436b-acb6-b1ac42c9f06f",
    "employeeId": "b383e35d-7bdf-481b-a6a6-cf139594aac1",
    "userId": "071e4dff-097f-40bb-a19a-82ba2134410d",
    "employeeName": "surendar",
    "attendanceDate": "2026-06-10",
    "status": "P",
    "checkInTime": "2026-06-10T05:20:13.127087Z",
    "checkOutTime": null
  }
];

const loggedUserIds = new Set(mappedLogs.map(l => l.userId).filter(Boolean));
const mergedLogs = [...mappedLogs];
const startStr = "2026-06-10";

checkInsList.forEach(ci => {
    const hasUser = ci.userId ? loggedUserIds.has(ci.userId) : false;
    if (ci.checkInTime && !hasUser) {
        mergedLogs.push({
            id: ci.id || ci.employeeId,
            userId: ci.userId,
            employee: ci.employeeName,
            initial: ci.employeeName ? ci.employeeName.charAt(0).toUpperCase() : "?",
            date: startStr,
            projectId: null,
            project: "No Active Task",
            checkIn: "—",
            checkOut: "—",
            workedHrs: "0h 00m",
            breakCount: 0,
            breakHrs: "0h 00m",
            lunchIn: "—",
            lunchOut: "—",
            lunchHrs: "0h 00m",
            pages: 0,
            status: ci.checkOutTime ? "Complete" : "Active",
            timeline: [],
            workingSecondsRaw: 0,
            breakSecondsRaw: 0,
            lunchSecondsRaw: 0,
            startTimeRaw: null,
            endTimeRaw: null,
            manualCheckInRaw: ci.checkInTime,
            manualCheckOutRaw: ci.checkOutTime
        });
    }
});

console.log('Merged logs:', mergedLogs);

// Simulating buildDailyAggrRows
function buildDailyAggrRows(mappedLogs) {
    const map = {};
    mappedLogs.forEach(log => {
        const empKey = log.employee;
        if (!map[empKey]) {
            map[empKey] = {
                id: log.id,
                userId: log.userId,
                employee: log.employee,
                initial: log.initial,
                date: log.date,
                projects: new Set(),
                checkInRaw: null,
                checkOutRaw: null,
                manualCheckInRaw: null,
                manualCheckOutRaw: null,
                hasActive: false,
                workingSeconds: 0,
                breakCount: 0,
                breakSeconds: 0,
                lunchSeconds: 0,
                pages: 0,
                timeline: [],
            };
        }
        const e = map[empKey];
        
        if (log.project && log.project !== "No Project") {
            e.projects.add(log.project);
        }
        
        e.workingSeconds += log.workingSecondsRaw || 0;
        e.breakCount += log.breakCount || 0;
        e.breakSeconds += log.breakSecondsRaw || 0;
        e.lunchSeconds += log.lunchSecondsRaw || 0;
        e.pages += log.pages || 0;
        
        if (log.status === "Active") {
            e.hasActive = true;
        }
        
        const currentStartTime = log.startTimeRaw ? new Date(log.startTimeRaw) : null;
        if (currentStartTime) {
            if (!e.checkInRaw || currentStartTime < e.checkInRaw) {
                e.checkInRaw = currentStartTime;
            }
        }
        
        const currentEndTime = log.endTimeRaw ? new Date(log.endTimeRaw) : null;
        if (log.status === "Active") {
            e.checkOutRaw = null; // Still active
        } else if (currentEndTime && e.checkOutRaw !== null) {
            if (!e.checkOutRaw || currentEndTime > e.checkOutRaw) {
                e.checkOutRaw = currentEndTime;
            }
        }

        if (log.manualCheckInRaw) {
            const mci = new Date(log.manualCheckInRaw);
            if (!e.manualCheckInRaw || mci < e.manualCheckInRaw) {
                e.manualCheckInRaw = mci;
            }
        }

        if (log.manualCheckOutRaw) {
            const mco = new Date(log.manualCheckOutRaw);
            if (!e.manualCheckOutRaw || mco > e.manualCheckOutRaw) {
                e.manualCheckOutRaw = mco;
            }
        }
        
        if (log.timeline) {
            e.timeline = [...e.timeline, ...log.timeline];
        }
    });

    return Object.values(map).map(e => {
        const formatTime = (dateObj) => {
            if (!dateObj) return "—";
            return dateObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        };
        
        const formatSecondsToHrsStr = (totalSecs) => {
            if (!totalSecs) return "0h 00m";
            const mins = Math.floor(totalSecs / 60);
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return `${h}h ${String(m).padStart(2, "0")}m`;
        };

        e.timeline.sort((a, b) => a.rawTime - b.rawTime);

        const lunchStarts = e.timeline.filter(t => t.type === "lunch-start").map(t => t.rawTime);
        const lunchEnds = e.timeline.filter(t => t.type === "lunch-end").map(t => t.rawTime);
        
        const earliestLunchStart = lunchStarts.length ? new Date(Math.min(...lunchStarts)) : null;
        const latestLunchEnd = lunchEnds.length ? new Date(Math.max(...lunchEnds)) : null;

        return {
            id: e.id,
            userId: e.userId,
            employee: e.employee,
            initial: e.initial,
            date: e.date,
            project: Array.from(e.projects).join(", ") || "No Project",
            checkIn: formatTime(e.manualCheckInRaw || e.checkInRaw),
            checkOut: e.manualCheckOutRaw ? formatTime(e.manualCheckOutRaw) : (e.hasActive ? "—" : formatTime(e.checkOutRaw)),
            workedHrs: formatSecondsToHrsStr(e.workingSeconds),
            breakCount: e.breakCount,
            breakHrs: formatSecondsToHrsStr(e.breakSeconds),
            lunchIn: formatTime(earliestLunchStart),
            lunchOut: formatTime(latestLunchEnd),
            lunchHrs: formatSecondsToHrsStr(e.lunchSeconds),
            pages: e.pages,
            status: e.hasActive ? "Active" : "Complete",
            timeline: e.timeline
        };
    });
}

const resRows = buildDailyAggrRows(mergedLogs);
console.log('Result rows:', resRows);
