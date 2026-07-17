import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, apiCall, getRolePrefix } from '../../utils/api';
import './HourlyReminder.css';

const ordinal = (n) => {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
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
      osc.frequency.setValueAtTime(880, time); // A5 note
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      osc.start(time);
      osc.stop(time + duration);
    };
    playTone(audioCtx.currentTime, 0.25);
    playTone(audioCtx.currentTime + 0.3, 0.25);
  } catch (err) {
    console.warn('Could not play reminder beep:', err);
  }
};
// ── Local date helper: returns YYYY-MM-DD in the browser's local timezone ────
const getLocalDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function HourlyReminder() {
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const lastNotifiedHourRef = useRef(null);

  // Request desktop notification permission if supported and not asked yet
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    // Reset last notified hour on page switch/navigation
    lastNotifiedHourRef.current = null;

    // Do not show the popup if the user is already on the Hourly Graph page to avoid double popups
    const isHourlyGraphPage = location.pathname.endsWith('/hourly-graph');

    const sendDesktopNotification = (hourIdx) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const n = new Notification('Hourly Production Reminder', {
            body: `It's time to log your production for the ${ordinal(hourIdx + 1)} hour! You have a 10-minute active window to enter process and count.`,
            tag: `hourly-reminder-${hourIdx}`,
            requireInteraction: true
          });
          n.onclick = () => {
            window.focus();
            const prefix = getRolePrefix(user.roles);
            navigate(`/${prefix}/hourly-graph`);
          };
        } catch (e) {
          console.warn('Desktop notification failed:', e);
        }
      }
    };

    const checkReminder = async () => {
      try {
        // 1. Fetch today's logs using browser local date, not UTC
        const todayStr = getLocalDate();
        const data = await apiCall(`/hourly-graph/logs?date=${todayStr}`);
        const rows = data?.rows || [];
        const myRow = rows.find(r => r.userId === user.userId);
        if (!myRow || !myRow.inTime) {
          setNotification(null);
          return;
        }

        const maxHours = Math.max(...rows.map(r => r.hours?.length || 0), 12);

        // 2. Find if any active hour needs logging
        for (let i = 0; i < maxHours; i++) {
          if (isHourActive(i, myRow.inTime)) {
            const hData = myRow.hours?.[i];
            const hValue = typeof hData === 'object' && hData !== null ? (hData.value || '') : (hData || '');
            const hProc = typeof hData === 'object' && hData !== null ? (hData.process || '') : '';

            if (!hValue || !hProc) {
              if (lastNotifiedHourRef.current !== i) {
                lastNotifiedHourRef.current = i;
                setNotification({
                  hourIdx: i,
                  message: `🔔 It's time to log your production for the ${ordinal(i + 1)} hour! You have a 10-minute active window to enter process and count.`
                });
                playBeep();
                sendDesktopNotification(i);
              }
              return;
            }
          }
        }
        setNotification(null);
      } catch (err) {
        console.warn('HourlyReminder check failed:', err.message);
      }
    };

    const isHourActive = (hourIdx, checkInTimeStr) => {
      if (!checkInTimeStr) return false;
      const parts = checkInTimeStr.split(':').map(Number);
      const sh = parts[0] || 0;
      const sm = parts[1] || 0;

      // Force calculations to Asia/Kolkata (IST) timezone to match server-side check-in timezone
      let nowMins;
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const p = formatter.formatToParts(new Date());
        const hour = parseInt(p.find(x => x.type === 'hour').value, 10);
        const minute = parseInt(p.find(x => x.type === 'minute').value, 10);
        nowMins = hour * 60 + minute;
      } catch (e) {
        const d = new Date();
        nowMins = d.getHours() * 60 + d.getMinutes();
      }

      // Window starts exactly (hourIdx + 1) hours after check-in, preserving minutes.
      // e.g. check-in 8:50 → 1st window: 9:50–10:00, 2nd: 10:50–11:00
      const checkInTotalMins = sh * 60 + sm;
      const windowStartMins = (checkInTotalMins + (hourIdx + 1) * 60) % (24 * 60);
      const windowEndMins = (windowStartMins + 10) % (24 * 60);

      if (windowStartMins <= windowEndMins) {
        return nowMins >= windowStartMins && nowMins < windowEndMins;
      } else {
        return nowMins >= windowStartMins || nowMins < windowEndMins;
      }
    };

    // Run check immediately on mount/path change
    if (!isHourlyGraphPage) {
      checkReminder();
    } else {
      setNotification(null);
    }

    // Poll every 60 seconds
    const interval = setInterval(() => {
      if (!isHourlyGraphPage) {
        checkReminder();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [location.pathname, navigate]);

  if (!notification) return null;

  const handleGoToHourlyGraph = () => {
    const user = getCurrentUser();
    if (user) {
      const prefix = getRolePrefix(user.roles);
      navigate(`/${prefix}/hourly-graph`);
      setNotification(null);
    }
  };

  return (
    <div className="global-popup-notification" onClick={handleGoToHourlyGraph}>
      <span className="global-popup-close" onClick={(e) => { e.stopPropagation(); setNotification(null); }}>✕</span>
      <div className="global-popup-content">
        <p className="global-popup-text">{notification.message}</p>
        <span className="global-popup-action">Go to Hourly Graph ➔</span>
      </div>
    </div>
  );
}

