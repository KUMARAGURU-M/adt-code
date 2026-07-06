import React, { useState, useEffect } from 'react';
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

export default function HourlyReminder() {
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    // Do not show the popup if the user is already on the Hourly Graph page to avoid double popups
    const isHourlyGraphPage = location.pathname.endsWith('/hourly-graph');

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

        const maxHours = Math.max(...rows.map(r => r.hours?.length || 0), 8);

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
  }, [location.pathname]);

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
