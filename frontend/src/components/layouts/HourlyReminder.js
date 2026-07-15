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
        // 1. Fetch today's logs
        const todayStr = new Date().toISOString().slice(0, 10);
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
              setNotification({
                hourIdx: i,
                message: `🔔 It's time to log your production for the ${ordinal(i + 1)} hour! You have a 10-minute active window to enter process and count.`
              });

              if (lastNotifiedHourRef.current !== i) {
                lastNotifiedHourRef.current = i;
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
      const [sh] = checkInTimeStr.split(':').map(Number);
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


