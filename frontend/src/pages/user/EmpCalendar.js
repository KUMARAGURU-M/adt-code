import React, { useState, useEffect } from 'react';
import './EmpCalendar.css';
import { apiCall } from '../../utils/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EmpCalendar = () => {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async (date) => {
    setLoading(true);
    setError('');
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-indexed for backend
      const data = await apiCall(`/workwise/calendar-stats?year=${year}&month=${month}`);
      setStats(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load calendar stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(currentDate);
  }, [currentDate]);

  const handlePrev = () => {
    if (activeTab === 'daily' || activeTab === 'monthly') {
      const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      setCurrentDate(prev);
    } else if (activeTab === 'weekly') {
      const prev = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      setCurrentDate(prev);
    }
  };

  const handleNext = () => {
    if (activeTab === 'daily' || activeTab === 'monthly') {
      const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setCurrentDate(next);
    } else if (activeTab === 'weekly') {
      const next = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      setCurrentDate(next);
    }
  };

  const handleCurrent = () => {
    setCurrentDate(new Date());
  };

  // Date utilities
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  let offset = firstDay.getDay() - 1; // Map Monday as 0
  if (offset < 0) offset = 6;

  const emptyCells = Array.from({ length: offset }, () => null);
  const daysInMonth = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1);

  const getDayStat = (dayNum) => {
    if (!stats || !stats.dailyStats) return null;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return stats.dailyStats.find(s => s.date === dateString);
  };

  const getSelectedWeeklyStat = () => {
    if (!stats || !stats.weeklyStats) return null;
    const targetTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
    return stats.weeklyStats.find(w => {
      const s = new Date(w.startDate).getTime();
      const e = new Date(w.endDate).getTime();
      return targetTime >= s && targetTime <= e;
    });
  };

  const formatSeconds = (sec) => {
    if (!sec) return '0h 0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const fmtDateShort = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const selWeek = getSelectedWeeklyStat();

  return (
    <div className="ec-page">
      <div className="ec-card">
        
        {/* TOP TAB NAVIGATION */}
        <div className="ec-tab-nav">
          <button 
            className={`ec-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            📅 Daily
          </button>
          <button 
            className={`ec-tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            📊 Weekly
          </button>
          <button 
            className={`ec-tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            📈 Monthly
          </button>
        </div>

        {/* HEADER SECTION */}
        <div className="ec-header-row">
          <div className="ec-header-left">
            {activeTab === 'daily' && (
              <>
                <h2 className="ec-title">{MONTHS[month]} {year}</h2>
                <p className="ec-subtitle">
                  Total: {formatSeconds(stats?.monthlySummary?.totalWorkingSeconds)} | Pages: {stats?.monthlySummary?.totalPagesCompleted ?? 0}
                </p>
              </>
            )}
            {activeTab === 'weekly' && (
              <>
                <h2 className="ec-title">{selWeek ? selWeek.weekLabel : 'Week --'}, {year}</h2>
                <p className="ec-subtitle">
                  {selWeek ? `${fmtDateShort(selWeek.startDate)} - ${fmtDateShort(selWeek.endDate)}` : '--'}
                </p>
              </>
            )}
            {activeTab === 'monthly' && (
              <>
                <h2 className="ec-title">{MONTHS[month]} {year}</h2>
                <p className="ec-subtitle">
                  {stats?.weeklyStats?.length ? `${fmtDateShort(stats.weeklyStats[0].startDate)} - ${fmtDateShort(stats.weeklyStats[stats.weeklyStats.length - 1].endDate)}` : '--'}
                </p>
              </>
            )}
          </div>
          
          <div className="ec-header-right">
            <button className="ec-nav-btn ec-nav-prev" onClick={handlePrev}>← Prev</button>
            <button className="ec-nav-btn ec-nav-current" onClick={handleCurrent}>
              {activeTab === 'daily' && 'Today'}
              {activeTab === 'weekly' && 'This Week'}
              {activeTab === 'monthly' && 'This Month'}
            </button>
            <button className="ec-nav-btn ec-nav-next" onClick={handleNext}>Next →</button>
          </div>
        </div>

        {/* CONTENT SECTIONS */}
        <div className="ec-content">
          
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
              Loading calendar data...
            </div>
          ) : error ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>
              {error}
            </div>
          ) : (
            <>
              {/* ----- DAILY VIEW ----- */}
              {activeTab === 'daily' && (
                <div className="ec-daily-view">
                  <div className="ec-grid-header">
                    {DAYS.map(d => <div key={d} className="ec-grid-hd">{d}</div>)}
                  </div>
                  <div className="ec-grid-body">
                    {emptyCells.map((_, i) => (
                      <div key={`empty-${i}`} className="ec-cell ec-cell-empty"></div>
                    ))}
                    {daysInMonth.map(day => {
                      const dayStat = getDayStat(day);
                      const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                      let cellClass = "ec-cell";
                      if (isToday) cellClass += " ec-cell-today";
                      if (dayStat && dayStat.workingSeconds > 0) cellClass += " ec-cell-data";

                      const projectsTooltip = dayStat && dayStat.projectNames && dayStat.projectNames.length > 0
                        ? `Projects: ${dayStat.projectNames.join(', ')}`
                        : '';

                      return (
                        <div key={day} className={cellClass} title={projectsTooltip}>
                          <span className="ec-day-number">{day}</span>
                          {dayStat && dayStat.workingSeconds > 0 && (
                            <div className="ec-day-details">
                              <span className="ec-day-hours">{formatSeconds(dayStat.workingSeconds)}</span>
                              <span className="ec-day-pages">📄 {dayStat.pagesCompleted}</span>
                              <span className="ec-day-projects">
                                {dayStat.projectNames && dayStat.projectNames.length > 0 
                                  ? `${dayStat.projectNames.length} project${dayStat.projectNames.length > 1 ? 's' : ''}`
                                  : '0 projects'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ----- WEEKLY VIEW ----- */}
              {activeTab === 'weekly' && (
                <div className="ec-summary-view">
                  <div className="ec-summary-cards">
                    <div className="ec-summary-card">
                      <span className="ec-card-label">Total Hours</span>
                      <span className="ec-card-value">{selWeek ? formatSeconds(selWeek.workingSeconds) : '0h 0m'}</span>
                    </div>
                    <div className="ec-summary-card">
                      <span className="ec-card-label">📄 Pages</span>
                      <span className="ec-card-value">{selWeek ? selWeek.pagesCompleted : 0}</span>
                    </div>
                    <div className="ec-summary-card">
                      <span className="ec-card-label">Projects</span>
                      <span className="ec-card-value">{selWeek ? selWeek.projectCount : 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ----- MONTHLY VIEW ----- */}
              {activeTab === 'monthly' && stats && (
                <div className="ec-summary-view">
                  <div className="ec-summary-cards">
                    <div className="ec-summary-card">
                      <span className="ec-card-label">Total Hours</span>
                      <span className="ec-card-value">{formatSeconds(stats.monthlySummary?.totalWorkingSeconds)}</span>
                    </div>
                    <div className="ec-summary-card">
                      <span className="ec-card-label">📄 Pages</span>
                      <span className="ec-card-value">{stats.monthlySummary?.totalPagesCompleted ?? 0}</span>
                    </div>
                    <div className="ec-summary-card">
                      <span className="ec-card-label">Projects</span>
                      <span className="ec-card-value">{stats.monthlySummary?.uniqueProjectsCount ?? 0}</span>
                    </div>
                  </div>

                  <div className="ec-breakdown-section">
                    <h3 className="ec-section-title">Weekly Breakdown</h3>
                    {stats.weeklyStats && stats.weeklyStats.length === 0 ? (
                      <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>No weekly stats recorded.</p>
                    ) : stats.weeklyStats.map((w, idx) => (
                      <div className="ec-breakdown-card" key={idx}>
                        <div className="ec-bd-top">{w.weekLabel} ({fmtDateShort(w.startDate)} - {fmtDateShort(w.endDate)})</div>
                        <div className="ec-bd-bottom">
                          <span className="ec-bd-hours">{formatSeconds(w.workingSeconds)}</span>
                          <span className="ec-bd-pages">📄 {w.pagesCompleted}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="ec-breakdown-section">
                    <h3 className="ec-section-title">Project Breakdown</h3>
                    {stats.projectBreakdown && stats.projectBreakdown.length === 0 ? (
                      <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>No project stats recorded.</p>
                    ) : stats.projectBreakdown.map((p, idx) => (
                      <div className="ec-breakdown-card" key={idx}>
                        <div className="ec-bd-top">{p.projectName}</div>
                        <div className="ec-bd-bottom">
                          <span className="ec-bd-hours">{formatSeconds(p.workingSeconds)} • 📄 {p.pagesCompleted} page{p.pagesCompleted !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmpCalendar;
