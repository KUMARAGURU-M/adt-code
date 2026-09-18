// src/pages/admin/MonthlyTargets.js
import React, { useState, useEffect } from 'react';
import {
  Search,
  Edit2,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Layers,
  Activity,
  ChevronLeft,
  ChevronRight,
  Percent,
  Clock,
  PauseCircle,
  Sparkles,
  Settings,
  Maximize2,
  Minimize2,
  Plus
} from 'lucide-react';
import { apiCall, getCurrentUser } from '../../utils/api';
import './MonthlyTargets.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getWeeklyRanges = (startDateStr, endDateStr) => {
  if (!startDateStr) return [];
  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : null;

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const w1Start = start;
  const w1End = addDays(start, 6);

  const w2Start = addDays(start, 7);
  const w2End = addDays(start, 13);

  const w3Start = addDays(start, 14);
  const w3End = addDays(start, 20);

  const w4Start = addDays(start, 21);
  const w4End = end || addDays(start, 27);

  return [
    { label: 'Week 1', range: `${formatDate(w1Start)} - ${formatDate(w1End)}` },
    { label: 'Week 2', range: `${formatDate(w2Start)} - ${formatDate(w2End)}` },
    { label: 'Week 3', range: `${formatDate(w3Start)} - ${formatDate(w3End)}` },
    { label: 'Week 4', range: `${formatDate(w4Start)} - ${formatDate(w4End)}` }
  ];
};

const getDaysDiff = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

const getJobWeek = (job, cycleStartDateStr, cycleEndDateStr) => {
  if (!cycleStartDateStr) return null;
  const effectiveUploadDate = job.uploadDate || job.endDate || job.endMonth;
  if (!effectiveUploadDate) return null;

  const uploadDays = getDaysDiff(cycleStartDateStr, effectiveUploadDate);

  if (uploadDays >= 0) {
    if (uploadDays < 7) {
      return 1;
    } else if (uploadDays >= 7 && uploadDays < 14) {
      return 2;
    } else if (uploadDays >= 14 && uploadDays < 21) {
      return 3;
    } else if (uploadDays >= 21 && uploadDays < 28) {
      return 4;
    } else {
      if (cycleEndDateStr) {
        const endDiff = getDaysDiff(effectiveUploadDate, cycleEndDateStr);
        if (endDiff >= 0) {
          return 5;
        }
      }
    }
  }
  return null;
};

const MonthlyTargets = () => {
  const user = getCurrentUser();
  const roles = user?.roles || [];
  const permissions = user?.permissions || [];
  const canManage = roles.includes('Admin') || roles.includes('Manager') || permissions.includes('monthly_targets.manage');

  // Selected Period State
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed

  // Operational Data State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, MET, IN_PROGRESS, UNSET

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [saving, setSaving] = useState(false);

  // Single Project Form Fields
  const [simpleChecked, setSimpleChecked] = useState(false);
  const [mediumChecked, setMediumChecked] = useState(false);
  const [complexChecked, setComplexChecked] = useState(false);
  const [heavyChecked, setHeavyChecked] = useState(false);

  const [targetPagesSimple, setTargetPagesSimple] = useState(0);
  const [targetPagesMedium, setTargetPagesMedium] = useState(0);
  const [targetPagesComplex, setTargetPagesComplex] = useState(0);
  const [targetPagesHeavyComplex, setTargetPagesHeavyComplex] = useState(0);
  const [targetPagesTotal, setTargetPagesTotal] = useState(0);
  const [targetPagesWeek1, setTargetPagesWeek1] = useState(0);
  const [targetPagesWeek2, setTargetPagesWeek2] = useState(0);
  const [targetPagesWeek3, setTargetPagesWeek3] = useState(0);
  const [targetPagesWeek4, setTargetPagesWeek4] = useState(0);

  const [singleStartDate, setSingleStartDate] = useState('');
  const [singleEndDate, setSingleEndDate] = useState('');



  // Project Detailed Drawer State
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState('overview'); // overview, weekly, team, books
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookStatusFilter, setBookStatusFilter] = useState('ALL');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Bulk Creation Metadata and States
  const [clients, setClients] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkProjectsTargets, setBulkProjectsTargets] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

  const getActualPagesByComplexity = (complexityKey) => {
    if (!selectedProjectDetail) return 0;
    if (selectedWeek === null) {
      if (complexityKey === 'simple') return selectedProjectDetail.actualPagesSimple || 0;
      if (complexityKey === 'medium') return selectedProjectDetail.actualPagesMedium || 0;
      if (complexityKey === 'complex') return selectedProjectDetail.actualPagesComplex || 0;
      if (complexityKey === 'heavy-complex') return selectedProjectDetail.actualPagesHeavyComplex || 0;
    }

    let sum = 0;
    (selectedProjectDetail.jobs || []).forEach(job => {
      const jobWeek = getJobWeek(job, selectedProjectDetail.billingCycleStartDate, selectedProjectDetail.billingCycleEndDate);
      const matchesWeek = (selectedWeek === 4) ? (jobWeek === 4 || jobWeek === 5) : (jobWeek === selectedWeek);

      if (matchesWeek) {
        const comp = (job.complexity || '').toLowerCase();
        if (comp.includes('simple')) {
          if (complexityKey === 'simple') sum += job.pageCount || 0;
        } else if (comp.includes('heavy') && comp.includes('complex')) {
          if (complexityKey === 'heavy-complex') sum += job.pageCount || 0;
        } else if (comp.includes('medium')) {
          if (complexityKey === 'medium') sum += job.pageCount || 0;
        } else if (comp.includes('complex')) {
          if (complexityKey === 'complex') sum += job.pageCount || 0;
        }
      }
    });
    return sum;
  };

  // Fetch clients & projects
  const fetchMetadata = async () => {
    try {
      const clientsData = await apiCall('/clients');
      const projectsData = await apiCall('/projects');
      setClients(clientsData || []);
      setAllProjects(projectsData || []);
    } catch (err) {
      console.error("Failed to load clients/projects metadata:", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleClientChange = (clientId) => {
    setSelectedClientId(clientId);
    if (clientId) {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const pad = (n) => String(n).padStart(2, '0');
      let finalStartDate = `${prevYear}-${pad(prevMonth)}-24`;
      let finalEndDate = `${year}-${pad(month)}-24`;

      const clientProjects = allProjects.filter(p => p.clientId === clientId);
      const initialTargets = {};
      clientProjects.forEach(p => {
        const existing = data.find(item => item.projectId === p.id);

        if (existing) {
          if (existing.billingCycleStartDate) {
            finalStartDate = existing.billingCycleStartDate;
          }
          if (existing.billingCycleEndDate) {
            finalEndDate = existing.billingCycleEndDate;
          }

          initialTargets[p.id] = {
            projectId: p.id,
            projectName: p.name,
            workflowName: p.workflowName || 'N/A',
            simpleChecked: (existing.targetPagesSimple || 0) > 0,
            mediumChecked: (existing.targetPagesMedium || 0) > 0,
            complexChecked: (existing.targetPagesComplex || 0) > 0,
            heavyChecked: (existing.targetPagesHeavyComplex || 0) > 0,
            targetPagesSimple: existing.targetPagesSimple || 0,
            targetPagesMedium: existing.targetPagesMedium || 0,
            targetPagesComplex: existing.targetPagesComplex || 0,
            targetPagesHeavyComplex: existing.targetPagesHeavyComplex || 0,
            targetPagesTotal: existing.targetPagesTotal || 0,
            targetPagesWeek1: existing.targetPagesWeek1 || 0,
            targetPagesWeek2: existing.targetPagesWeek2 || 0,
            targetPagesWeek3: existing.targetPagesWeek3 || 0,
            targetPagesWeek4: existing.targetPagesWeek4 || 0,
            monthlyTargetBooks: 0
          };
        } else {
          initialTargets[p.id] = {
            projectId: p.id,
            projectName: p.name,
            workflowName: p.workflowName || 'N/A',
            simpleChecked: false,
            mediumChecked: false,
            complexChecked: false,
            heavyChecked: false,
            targetPagesSimple: 0,
            targetPagesMedium: 0,
            targetPagesComplex: 0,
            targetPagesHeavyComplex: 0,
            targetPagesTotal: 0,
            targetPagesWeek1: 0,
            targetPagesWeek2: 0,
            targetPagesWeek3: 0,
            targetPagesWeek4: 0,
            monthlyTargetBooks: 0
          };
        }
      });

      setBulkStartDate(finalStartDate);
      setBulkEndDate(finalEndDate);
      setBulkProjectsTargets(initialTargets);
    } else {
      setBulkProjectsTargets({});
    }
  };

  const handleTargetChange = (projectId, field, value) => {
    setBulkProjectsTargets(prev => {
      const current = { ...prev[projectId] };
      const oldValue = current[field];
      current[field] = value;

      // If we are checking/unchecking complexity checkboxes:
      if (field === 'simpleChecked' && !value) {
        current.targetPagesTotal = Math.max(0, (current.targetPagesTotal || 0) - (current.targetPagesSimple || 0));
        current.targetPagesSimple = 0;
      } else if (field === 'mediumChecked' && !value) {
        current.targetPagesTotal = Math.max(0, (current.targetPagesTotal || 0) - (current.targetPagesMedium || 0));
        current.targetPagesMedium = 0;
      } else if (field === 'complexChecked' && !value) {
        current.targetPagesTotal = Math.max(0, (current.targetPagesTotal || 0) - (current.targetPagesComplex || 0));
        current.targetPagesComplex = 0;
      } else if (field === 'heavyChecked' && !value) {
        current.targetPagesTotal = Math.max(0, (current.targetPagesTotal || 0) - (current.targetPagesHeavyComplex || 0));
        current.targetPagesHeavyComplex = 0;
      }

      // If we are changing complexity page values:
      else if (field === 'targetPagesSimple') {
        const delta = value - (oldValue || 0);
        current.targetPagesTotal = Math.max(0, (current.targetPagesTotal || 0) + delta);
      } else if (field === 'targetPagesMedium') {
        const delta = value - (oldValue || 0);
        current.targetPagesTotal = Math.max(0, (current.targetPagesTotal || 0) + delta);
      } else if (field === 'targetPagesComplex') {
        const delta = value - (oldValue || 0);
        current.targetPagesTotal = Math.max(0, (current.targetPagesTotal || 0) + delta);
      } else if (field === 'targetPagesHeavyComplex') {
        const delta = value - (oldValue || 0);
        current.targetPagesTotal = Math.max(0, (current.targetPagesTotal || 0) + delta);
      }

      // Don't auto-split total pages across weeks on change; let users click the explicit Autofill button.

      return {
        ...prev,
        [projectId]: current
      };
    });
  };

  const handleSaveBulkTargets = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return;

    try {
      setBulkSaving(true);
      const targetItems = Object.values(bulkProjectsTargets).map(item => {
        const pagesSimple = item.simpleChecked ? parseInt(item.targetPagesSimple) || 0 : 0;
        const pagesMedium = item.mediumChecked ? parseInt(item.targetPagesMedium) || 0 : 0;
        const pagesComplex = item.complexChecked ? parseInt(item.targetPagesComplex) || 0 : 0;
        const pagesHeavy = item.heavyChecked ? parseInt(item.targetPagesHeavyComplex) || 0 : 0;

        // Use total input directly
        const pagesTotal = parseInt(item.targetPagesTotal) || 0;

        return {
          projectId: item.projectId,
          targetPagesSimple: pagesSimple,
          targetPagesMedium: pagesMedium,
          targetPagesComplex: pagesComplex,
          targetPagesHeavyComplex: pagesHeavy,
          targetPagesTotal: pagesTotal,
          targetPagesWeek1: parseInt(item.targetPagesWeek1) || 0,
          targetPagesWeek2: parseInt(item.targetPagesWeek2) || 0,
          targetPagesWeek3: parseInt(item.targetPagesWeek3) || 0,
          targetPagesWeek4: parseInt(item.targetPagesWeek4) || 0,
          monthlyTargetBooks: 0,
          weeklyTargetBooks: 0,
          week1TargetBooks: 0,
          week2TargetBooks: 0,
          week3TargetBooks: 0,
          week4TargetBooks: 0,
          week5TargetBooks: 0
        };
      });

      const payload = {
        clientId: selectedClientId,
        year,
        month,
        billingCycleStartDate: bulkStartDate,
        billingCycleEndDate: bulkEndDate,
        targets: targetItems
      };

      const updatedList = await apiCall('/targets/bulk', 'POST', payload);
      setData(updatedList || []);
      setShowBulkModal(false);
      setSelectedClientId('');
      setBulkProjectsTargets({});
    } catch (err) {
      alert(err.message || 'Failed to save bulk targets.');
    } finally {
      setBulkSaving(false);
    }
  };

  // Fetch target data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await apiCall(`/targets?year=${year}&month=${month}`);
      setData(result || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch targets report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  // Navigate Periods
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(prev => prev - 1);
    } else {
      setMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(prev => prev + 1);
    } else {
      setMonth(prev => prev + 1);
    }
  };

  const distributeSingleWeeklyPages = (totalVal) => {
    const base = Math.floor(totalVal / 4);
    const remainder = totalVal % 4;
    setTargetPagesWeek1(base);
    setTargetPagesWeek2(base);
    setTargetPagesWeek3(base);
    setTargetPagesWeek4(base + remainder);
  };

  const handleSimpleCheckChange = (checked) => {
    setSimpleChecked(checked);
    if (!checked) {
      const newTotal = Math.max(0, targetPagesTotal - (targetPagesSimple || 0));
      setTargetPagesTotal(newTotal);
      setTargetPagesSimple(0);
    }
  };

  const handleMediumCheckChange = (checked) => {
    setMediumChecked(checked);
    if (!checked) {
      const newTotal = Math.max(0, targetPagesTotal - (targetPagesMedium || 0));
      setTargetPagesTotal(newTotal);
      setTargetPagesMedium(0);
    }
  };

  const handleComplexCheckChange = (checked) => {
    setComplexChecked(checked);
    if (!checked) {
      const newTotal = Math.max(0, targetPagesTotal - (targetPagesComplex || 0));
      setTargetPagesTotal(newTotal);
      setTargetPagesComplex(0);
    }
  };

  const handleHeavyCheckChange = (checked) => {
    setHeavyChecked(checked);
    if (!checked) {
      const newTotal = Math.max(0, targetPagesTotal - (targetPagesHeavyComplex || 0));
      setTargetPagesTotal(newTotal);
      setTargetPagesHeavyComplex(0);
    }
  };

  const handleSimplePagesChange = (val) => {
    const parsedVal = Math.max(0, parseInt(val) || 0);
    const delta = parsedVal - (targetPagesSimple || 0);
    setTargetPagesSimple(parsedVal);
    const newTotal = Math.max(0, targetPagesTotal + delta);
    setTargetPagesTotal(newTotal);
  };

  const handleMediumPagesChange = (val) => {
    const parsedVal = Math.max(0, parseInt(val) || 0);
    const delta = parsedVal - (targetPagesMedium || 0);
    setTargetPagesMedium(parsedVal);
    const newTotal = Math.max(0, targetPagesTotal + delta);
    setTargetPagesTotal(newTotal);
  };

  const handleComplexPagesChange = (val) => {
    const parsedVal = Math.max(0, parseInt(val) || 0);
    const delta = parsedVal - (targetPagesComplex || 0);
    setTargetPagesComplex(parsedVal);
    const newTotal = Math.max(0, targetPagesTotal + delta);
    setTargetPagesTotal(newTotal);
  };

  const handleHeavyPagesChange = (val) => {
    const parsedVal = Math.max(0, parseInt(val) || 0);
    const delta = parsedVal - (targetPagesHeavyComplex || 0);
    setTargetPagesHeavyComplex(parsedVal);
    const newTotal = Math.max(0, targetPagesTotal + delta);
    setTargetPagesTotal(newTotal);
  };

  // Open target manager modal
  const openEditModal = (proj) => {
    setSelectedProject(proj);
    setSimpleChecked((proj.targetPagesSimple || 0) > 0);
    setMediumChecked((proj.targetPagesMedium || 0) > 0);
    setComplexChecked((proj.targetPagesComplex || 0) > 0);
    setHeavyChecked((proj.targetPagesHeavyComplex || 0) > 0);

    setTargetPagesSimple(proj.targetPagesSimple || 0);
    setTargetPagesMedium(proj.targetPagesMedium || 0);
    setTargetPagesComplex(proj.targetPagesComplex || 0);
    setTargetPagesHeavyComplex(proj.targetPagesHeavyComplex || 0);
    setTargetPagesTotal(proj.targetPagesTotal || 0);
    setTargetPagesWeek1(proj.targetPagesWeek1 || 0);
    setTargetPagesWeek2(proj.targetPagesWeek2 || 0);
    setTargetPagesWeek3(proj.targetPagesWeek3 || 0);
    setTargetPagesWeek4(proj.targetPagesWeek4 || 0);

    if (proj.billingCycleStartDate && proj.billingCycleEndDate) {
      setSingleStartDate(proj.billingCycleStartDate);
      setSingleEndDate(proj.billingCycleEndDate);
    } else {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const pad = (n) => String(n).padStart(2, '0');
      setSingleStartDate(`${prevYear}-${pad(prevMonth)}-24`);
      setSingleEndDate(`${year}-${pad(month)}-24`);
    }

    setShowModal(true);
  };

  // Save targets
  const handleSaveTarget = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      setSaving(true);
      const pagesSimple = simpleChecked ? parseInt(targetPagesSimple) || 0 : 0;
      const pagesMedium = mediumChecked ? parseInt(targetPagesMedium) || 0 : 0;
      const pagesComplex = complexChecked ? parseInt(targetPagesComplex) || 0 : 0;
      const pagesHeavy = heavyChecked ? parseInt(targetPagesHeavyComplex) || 0 : 0;
      const pagesTotal = parseInt(targetPagesTotal) || 0;

      const payload = {
        projectId: selectedProject.projectId,
        year,
        month,
        billingCycleStartDate: singleStartDate,
        billingCycleEndDate: singleEndDate,
        targetPagesSimple: pagesSimple,
        targetPagesMedium: pagesMedium,
        targetPagesComplex: pagesComplex,
        targetPagesHeavyComplex: pagesHeavy,
        targetPagesTotal: pagesTotal,
        targetPagesWeek1: targetPagesWeek1,
        targetPagesWeek2: targetPagesWeek2,
        targetPagesWeek3: targetPagesWeek3,
        targetPagesWeek4: targetPagesWeek4,
        monthlyTargetBooks: 0,
        weeklyTargetBooks: 0,
        week1TargetBooks: 0,
        week2TargetBooks: 0,
        week3TargetBooks: 0,
        week4TargetBooks: 0,
        week5TargetBooks: 0
      };

      const updatedProj = await apiCall('/targets', 'POST', payload);

      // Update local state list
      setData(prev => prev.map(item =>
        item.projectId === updatedProj.projectId ? updatedProj : item
      ));

      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Failed to save targets.');
    } finally {
      setSaving(false);
    }
  };

  const openDetailDrawer = async (projectId) => {
    try {
      setLoadingDetail(true);
      setShowDetailDrawer(true);
      setDetailTab('overview');
      setBookSearchQuery('');
      setBookStatusFilter('ALL');
      setSelectedWeek(null);
      setIsMaximized(true);
      const detail = await apiCall(`/targets/project/${projectId}?year=${year}&month=${month}`);
      setSelectedProjectDetail(detail);
    } catch (err) {
      alert(err.message || 'Failed to fetch project details.');
      setShowDetailDrawer(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Calculations for stats headers
  const totalProjects = data.length;
  const targetedProjects = data.filter(p => (p.targetPagesTotal || 0) > 0);
  const totalMonthlyTarget = data.reduce((acc, curr) => acc + (curr.targetPagesTotal || 0), 0);
  const totalMonthlyCompleted = data.reduce((acc, curr) => acc + (curr.actualPagesTotal || 0), 0);
  const activeBooks = data.reduce((acc, curr) => acc + (curr.actualInProgress || 0) + (curr.actualPending || 0), 0);

  const targetsMetCount = data.filter(p =>
    p.targetPagesTotal > 0 && p.actualPagesTotal >= p.targetPagesTotal
  ).length;

  const behindTargetsCount = data.filter(p =>
    p.targetPagesTotal > 0 && p.actualPagesTotal < p.targetPagesTotal
  ).length;

  // Filter projects list
  const filteredData = data.filter(proj => {
    const matchesSearch = proj.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const hasTarget = (proj.targetPagesTotal || 0) > 0;
    const isMet = hasTarget && proj.actualPagesTotal >= proj.targetPagesTotal;

    if (statusFilter === 'MET') return isMet;
    if (statusFilter === 'IN_PROGRESS') return hasTarget && !isMet;
    if (statusFilter === 'UNSET') return !hasTarget;
    return true; // ALL
  });

  // Calculate Progress Percentages
  const getProgressColor = (percent) => {
    if (percent >= 100) return 'progress-emerald';
    if (percent >= 75) return 'progress-indigo';
    if (percent >= 40) return 'progress-amber';
    return 'progress-rose';
  };

  return (
    <div className="targets-container">
      {/* Dynamic Header with Gradient Title */}
      <div className="targets-header-section">
        <div className="targets-title-block">
          <span className="targets-icon-glow">🎯</span>
          <div>
            <h1 className="gradient-title">Project Target & Operations Monitor</h1>
            <p className="subtitle">Admin control room to govern monthly and weekly book production output</p>
          </div>
        </div>

        {/* Month Selector & Create Actions Widget */}
        <div className="header-actions-group">
          <div className="period-navigation-widget">
            <button className="period-nav-btn" onClick={handlePrevMonth} title="Previous Month">
              <ChevronLeft size={18} />
            </button>
            <div className="period-display">
              <Calendar size={16} className="calendar-icon" />
              <span>{MONTHS[month - 1]} {year}</span>
            </div>
            <button className="period-nav-btn" onClick={handleNextMonth} title="Next Month">
              <ChevronRight size={18} />
            </button>
          </div>

          {canManage && (
            <button className="btn-create-target-bulk" onClick={() => setShowBulkModal(true)}>
              <Plus size={16} className="btn-icon" />
              <span>Create Target</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Bar */}
      <div className="metrics-summary-bar">
        <div className="metric-summary-card card-blue">
          <div className="card-top">
            <span className="card-icon"><Layers size={20} /></span>
            <span className="card-title">Projects governed</span>
          </div>
          <h3 className="card-value">{totalProjects}</h3>
          <p className="card-sub">{targetedProjects.length} with active targets</p>
        </div>

        <div className="metric-summary-card card-emerald">
          <div className="card-top">
            <span className="card-icon"><CheckCircle size={20} /></span>
            <span className="card-title">Targets met</span>
          </div>
          <h3 className="card-value">{targetsMetCount}</h3>
          <p className="card-sub">{totalProjects > 0 ? Math.round((targetsMetCount / totalProjects) * 100) : 0}% success rate</p>
        </div>

        <div className="metric-summary-card card-rose">
          <div className="card-top">
            <span className="card-icon"><AlertCircle size={20} /></span>
            <span className="card-title">Behind target</span>
          </div>
          <h3 className="card-value">{behindTargetsCount}</h3>
          <p className="card-sub">Needs operational attention</p>
        </div>

        <div className="metric-summary-card card-purple">
          <div className="card-top">
            <span className="card-icon"><TrendingUp size={20} /></span>
            <span className="card-title">Total page progress</span>
          </div>
          <h3 className="card-value">
            {totalMonthlyCompleted} <span className="value-separator">/</span> {totalMonthlyTarget}
          </h3>
          <p className="card-sub">Pages produced this month</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="targets-toolbar">
        <div className="search-box-wrapper">
          <Search size={16} className="search-icon-inside" />
          <input
            type="text"
            placeholder="Search projects or clients..."
            className="search-input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-button-group">
          <button
            className={`filter-tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Projects
          </button>
          <button
            className={`filter-tab-btn ${statusFilter === 'MET' ? 'active' : ''}`}
            onClick={() => setStatusFilter('MET')}
          >
            Target Met
          </button>
          <button
            className={`filter-tab-btn ${statusFilter === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => setStatusFilter('IN_PROGRESS')}
          >
            In Progress
          </button>
          <button
            className={`filter-tab-btn ${statusFilter === 'UNSET' ? 'active' : ''}`}
            onClick={() => setStatusFilter('UNSET')}
          >
            Targets Unset
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="dashboard-loading-wrapper">
          <div className="loader-element"></div>
          <p>Analyzing book registries and operational logs...</p>
        </div>
      ) : error ? (
        <div className="dashboard-error-wrapper">
          <AlertCircle size={32} className="error-icon" />
          <h4>Failed to synchronize data</h4>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchData}>Try Reconnecting</button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="dashboard-empty-wrapper">
          <Activity size={32} className="empty-icon" />
          <h4>No projects match filter parameters</h4>
          <p>Try searching for another project name or adjust the status tabs.</p>
        </div>
      ) : (
        <div className="projects-governance-grid">
          {filteredData.map((proj) => {
            const hasBookTarget = (proj.monthlyTargetBooks || 0) > 0;
            const hasPageTarget = (proj.targetPagesTotal || 0) > 0;
            const hasTarget = hasBookTarget || hasPageTarget;

            const bookProgress = hasBookTarget
              ? Math.min(100, Math.round((proj.actualCompletedMonth / proj.monthlyTargetBooks) * 100))
              : 0;

            const truePageProgress = hasPageTarget
              ? Math.round((proj.actualPagesTotal / proj.targetPagesTotal) * 100)
              : 0;

            const displayPageProgress = Math.min(100, truePageProgress);

            const isMet = hasPageTarget && proj.actualPagesTotal >= proj.targetPagesTotal;

            return (
              <div
                key={proj.projectId}
                className={`project-governed-card ${isMet ? 'glowing-card-emerald' : ''} ${!proj.isProjectActive ? 'card-inactive' : ''} clickable-card`}
                onClick={() => openDetailDrawer(proj.projectId)}
              >
                {/* Card Header */}
                <div className="card-project-header">
                  <div className="card-header-client-block">
                    <span className="project-client-sub">{proj.clientName}</span>
                  </div>
                  <div className="card-header-project-block">
                    <h4 className="project-card-name">{proj.projectName}</h4>
                    {!proj.isProjectActive && (
                      <span className="badge-inactive-state">Inactive</span>
                    )}
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="project-progress-container">
                  <div className="progress-labels">
                    <span className="progress-label-left">Page Target Progress</span>
                    <span className="progress-label-right">
                      {proj.actualPagesTotal} / {hasPageTarget ? proj.targetPagesTotal : 'Unset'} pages
                    </span>
                  </div>

                  {hasPageTarget ? (
                    <div className="progress-track-bar">
                      <div
                        className={`progress-fill-bar ${getProgressColor(truePageProgress)}`}
                        style={{ width: `${displayPageProgress}%` }}
                      >
                        {displayPageProgress >= 15 && (
                          <span className="progress-value-tooltip">{truePageProgress}%</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="progress-track-bar unset">
                      <span className="unset-hint">Targets not specified for this month</span>
                    </div>
                  )}
                </div>

                {/* Weekly Targets Breakdown */}
                {(() => {
                  const weekRanges = proj.billingCycleStartDate ? getWeeklyRanges(proj.billingCycleStartDate, proj.billingCycleEndDate) : [];
                  return (
                    <div className="weekly-visual-breakdown">
                      <h5 className="breakdown-title">Weekly Completed Pages</h5>
                      <div className="weeks-track-grid">
                        {[
                          { num: 1, target: proj.targetPagesWeek1 || 0, actual: proj.actualPagesWeek1 || 0 },
                          { num: 2, target: proj.targetPagesWeek2 || 0, actual: proj.actualPagesWeek2 || 0 },
                          { num: 3, target: proj.targetPagesWeek3 || 0, actual: proj.actualPagesWeek3 || 0 },
                          { num: 4, target: proj.targetPagesWeek4 || 0, actual: (proj.actualPagesWeek4 || 0) + (proj.actualPagesWeek5 || 0) }
                        ].map((wk) => {
                          const weekHasTarget = wk.target > 0;
                          const weekMet = weekHasTarget && wk.actual >= wk.target;
                          const range = weekRanges[wk.num - 1]?.range || '';

                          return (
                            <div
                              key={wk.num}
                              className={`week-track-node ${weekMet ? 'week-node-met' : ''} ${weekHasTarget ? 'has-target' : 'no-target'}`}
                              title={range ? `Week ${wk.num}: ${range}` : undefined}
                            >
                              <span className="week-label">W{wk.num}</span>
                              {range && <span className="week-range-text">{range}</span>}
                              <span className="week-actual">{wk.actual}</span>
                              <span className="week-target-divider"></span>
                              <span className="week-target-val">{weekHasTarget ? wk.target : '—'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Status Breakdown & Actions */}
                <div className="card-footer-analytics">
                  <div className="mini-status-badges">
                    <span className="mini-badge badge-pending" title="Pending Jobs">
                      <Clock size={11} /> {proj.actualPending}
                    </span>
                    <span className="mini-badge badge-progress" title="In Progress Jobs">
                      <Activity size={11} /> {proj.actualInProgress}
                    </span>
                    <span className="mini-badge badge-hold" title="On Hold Jobs">
                      <PauseCircle size={11} /> {proj.actualOnHold}
                    </span>
                  </div>

                  {canManage && (
                    <button
                      className="edit-targets-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(proj);
                      }}
                      title="Set targets for this project"
                    >
                      <Edit2 size={13} />
                      <span>Configure Targets</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configuration Glassmorphic Modal */}
      {showModal && selectedProject && (
        <div className="target-modal-overlay">
          <div className="target-modal-content">
            <div className="modal-header-block">
              <div className="header-icon-wrapper">
                <Settings size={20} className="header-icon" />
              </div>
              <div>
                <h3 className="modal-headline">Configure Target Guidelines</h3>
                <p className="modal-sub">{selectedProject.projectName} • {MONTHS[month - 1]} {year}</p>
              </div>
            </div>

            <form onSubmit={handleSaveTarget} className="target-form-wrapper">
              <div className="target-form-main-row">
                {/* Left Panel: Billing Cycle Dates */}
                <div className="target-form-left-col">
                  <div className="form-group-block">
                    <label className="input-label-tag">Billing Cycle Start Date</label>
                    <input
                      type="date"
                      className="modal-select-input"
                      value={singleStartDate}
                      onChange={(e) => setSingleStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group-block" style={{ marginTop: '20px' }}>
                    <label className="input-label-tag">Billing Cycle End Date</label>
                    <input
                      type="date"
                      className="modal-select-input"
                      value={singleEndDate}
                      onChange={(e) => setSingleEndDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group-block" style={{ marginTop: '20px' }}>
                    <label className="input-label-tag">Overall Target Page Count</label>
                    <input
                      type="number"
                      min="0"
                      className="modal-number-input large-input"
                      value={targetPagesTotal || ''}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setTargetPagesTotal(val);
                      }}
                      required
                    />
                  </div>

                  {/* Weekly Page Targets breakdown (4 Weeks) */}
                  <div className="weekly-pages-breakdown-wrapper">
                    <div className="weekly-breakdown-header-row">
                      <h5 className="weekly-breakdown-title">
                        Weekly Page Targets <span className="weekly-breakdown-subtitle">(4 Weeks)</span>
                      </h5>
                      <button
                        type="button"
                        className="weekly-autofill-btn"
                        onClick={() => distributeSingleWeeklyPages(targetPagesTotal)}
                        title="Auto-distribute total pages evenly across 4 weeks"
                      >
                        ⚡ Auto-fill Average
                      </button>
                    </div>

                    {/* Remaining indicator */}
                    {(() => {
                      const weeklySum = (targetPagesWeek1 || 0) + (targetPagesWeek2 || 0) + (targetPagesWeek3 || 0) + (targetPagesWeek4 || 0);
                      const remaining = (targetPagesTotal || 0) - weeklySum;
                      const isOver = remaining < 0;
                      const isBalanced = remaining === 0 && weeklySum > 0;
                      return (targetPagesTotal > 0 || weeklySum > 0) ? (
                        <div className={`weekly-remaining-bar ${isOver ? 'over' : isBalanced ? 'balanced' : ''}`}>
                          <span className="remaining-label">
                            {isBalanced
                              ? '✓ Fully allocated'
                              : isOver
                                ? `⚠ Over by ${Math.abs(remaining)} pages`
                                : `Remaining: ${remaining} pages`}
                          </span>
                          <div className="remaining-progress-track">
                            <div
                              className="remaining-progress-fill"
                              style={{ width: `${Math.min(100, (weeklySum / (targetPagesTotal || 1)) * 100)}%`, background: isOver ? '#ef4444' : isBalanced ? '#22c55e' : '#6366f1' }}
                            />
                          </div>
                        </div>
                      ) : null;
                    })()}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {getWeeklyRanges(singleStartDate, singleEndDate).map((wk, idx) => {
                        const weekVals = [targetPagesWeek1, targetPagesWeek2, targetPagesWeek3, targetPagesWeek4];
                        const setters = [setTargetPagesWeek1, setTargetPagesWeek2, setTargetPagesWeek3, setTargetPagesWeek4];
                        const val = weekVals[idx];
                        const setter = setters[idx];
                        return (
                          <div key={idx} className="weekly-row-item">
                            <div className="weekly-row-labels">
                              <span className="weekly-wk-name">{wk.label}</span>
                              <span className="weekly-wk-range">{wk.range}</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              className="mini-pages-num-input weekly-single-input"
                              placeholder="—"
                              value={val || ''}
                              onChange={(e) => setter(Math.max(0, parseInt(e.target.value) || 0))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Complexity Inputs */}
                <div className="target-form-right-col">
                  <h4 className="weekly-fields-headline">Page Target by Complexity</h4>

                  <div className="complexity-inputs-list-stack" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
                    <div className="complexity-input-item-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label className="checkbox-mini" style={{ width: '120px' }}>
                        <input
                          type="checkbox"
                          checked={simpleChecked}
                          onChange={(e) => handleSimpleCheckChange(e.target.checked)}
                        />
                        <span>Simple</span>
                      </label>
                      {simpleChecked && (
                        <input
                          type="number"
                          min="0"
                          placeholder="Page count"
                          className="mini-pages-num-input"
                          value={targetPagesSimple || ''}
                          onChange={(e) => handleSimplePagesChange(e.target.value)}
                        />
                      )}
                    </div>

                    <div className="complexity-input-item-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label className="checkbox-mini" style={{ width: '120px' }}>
                        <input
                          type="checkbox"
                          checked={mediumChecked}
                          onChange={(e) => handleMediumCheckChange(e.target.checked)}
                        />
                        <span>Medium</span>
                      </label>
                      {mediumChecked && (
                        <input
                          type="number"
                          min="0"
                          placeholder="Page count"
                          className="mini-pages-num-input"
                          value={targetPagesMedium || ''}
                          onChange={(e) => handleMediumPagesChange(e.target.value)}
                        />
                      )}
                    </div>

                    <div className="complexity-input-item-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label className="checkbox-mini" style={{ width: '120px' }}>
                        <input
                          type="checkbox"
                          checked={complexChecked}
                          onChange={(e) => handleComplexCheckChange(e.target.checked)}
                        />
                        <span>Complex</span>
                      </label>
                      {complexChecked && (
                        <input
                          type="number"
                          min="0"
                          placeholder="Page count"
                          className="mini-pages-num-input"
                          value={targetPagesComplex || ''}
                          onChange={(e) => handleComplexPagesChange(e.target.value)}
                        />
                      )}
                    </div>

                    <div className="complexity-input-item-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label className="checkbox-mini" style={{ width: '120px' }}>
                        <input
                          type="checkbox"
                          checked={heavyChecked}
                          onChange={(e) => handleHeavyCheckChange(e.target.checked)}
                        />
                        <span>Heavy Complex</span>
                      </label>
                      {heavyChecked && (
                        <input
                          type="number"
                          min="0"
                          placeholder="Page count"
                          className="mini-pages-num-input"
                          value={targetPagesHeavyComplex || ''}
                          onChange={(e) => handleHeavyPagesChange(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions-wrapper">
                <button
                  type="button"
                  className="modal-btn-dismiss"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn-confirm"
                  disabled={saving}
                >
                  {saving ? 'Saving config...' : 'Apply Targets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Target Setup Modal */}
      {showBulkModal && (
        <div className="target-modal-overlay">
          <div className="target-modal-content bulk-modal-content">
            <div className="modal-header-block">
              <div className="header-icon-wrapper">
                <Plus size={20} className="icon-glow" />
              </div>
              <div>
                <h3 className="modal-headline">Bulk Client Target Setup</h3>
                <p className="modal-sub">Set complexity page targets & billing cycles for client projects</p>
              </div>
            </div>

            <form onSubmit={handleSaveBulkTargets}>
              <div className="bulk-modal-fields-row" style={{ marginBottom: selectedClientId ? '20px' : '0' }}>
                <div className="form-group-block">
                  <label className="input-label">Select Client</label>
                  <select
                    className="modal-select-input"
                    value={selectedClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedClientId && (
                <div className="bulk-modal-fields-row">
                  <div className="form-group-block">
                    <label className="input-label">Billing Cycle Start Date</label>
                    <input
                      type="date"
                      className="modal-select-input"
                      value={bulkStartDate}
                      onChange={(e) => setBulkStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group-block">
                    <label className="input-label">Billing Cycle End Date</label>
                    <input
                      type="date"
                      className="modal-select-input"
                      value={bulkEndDate}
                      onChange={(e) => setBulkEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {selectedClientId && (
                <div className="bulk-projects-vertical-container">
                  {(() => {
                    const clientProjects = allProjects.filter(p => p.clientId === selectedClientId);
                    if (clientProjects.length === 0) {
                      return (
                        <div className="empty-table-msg">
                          No active projects registered for this client.
                        </div>
                      );
                    }
                    return clientProjects.map(p => {
                      const target = bulkProjectsTargets[p.id] || {};
                      return (
                        <div key={p.id} className="bulk-project-vertical-card">
                          <div className="bulk-project-card-header">
                            <h4 className="bulk-project-title">{p.name}</h4>
                            <span className="bulk-project-workflow">Workflow: {p.workflowName || 'N/A'}</span>
                          </div>

                          <div className="bulk-project-card-body">
                            {/* Complexity Targets (Optional) */}
                            <div className="bulk-complexity-section">
                              <span className="section-small-label">Complexity Page Targets (Optional)</span>

                              <div className="bulk-complexity-vertical-list">
                                <div className="bulk-complexity-row">
                                  <label className="checkbox-mini" style={{ width: '120px' }}>
                                    <input
                                      type="checkbox"
                                      checked={!!target.simpleChecked}
                                      onChange={(e) => handleTargetChange(p.id, 'simpleChecked', e.target.checked)}
                                    />
                                    <span>Simple</span>
                                  </label>
                                  {target.simpleChecked && (
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="Pages"
                                      className="mini-pages-num-input"
                                      value={target.targetPagesSimple || ''}
                                      onChange={(e) => handleTargetChange(p.id, 'targetPagesSimple', Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                  )}
                                </div>

                                <div className="bulk-complexity-row">
                                  <label className="checkbox-mini" style={{ width: '120px' }}>
                                    <input
                                      type="checkbox"
                                      checked={!!target.mediumChecked}
                                      onChange={(e) => handleTargetChange(p.id, 'mediumChecked', e.target.checked)}
                                    />
                                    <span>Medium</span>
                                  </label>
                                  {target.mediumChecked && (
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="Pages"
                                      className="mini-pages-num-input"
                                      value={target.targetPagesMedium || ''}
                                      onChange={(e) => handleTargetChange(p.id, 'targetPagesMedium', Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                  )}
                                </div>

                                <div className="bulk-complexity-row">
                                  <label className="checkbox-mini" style={{ width: '120px' }}>
                                    <input
                                      type="checkbox"
                                      checked={!!target.complexChecked}
                                      onChange={(e) => handleTargetChange(p.id, 'complexChecked', e.target.checked)}
                                    />
                                    <span>Complex</span>
                                  </label>
                                  {target.complexChecked && (
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="Pages"
                                      className="mini-pages-num-input"
                                      value={target.targetPagesComplex || ''}
                                      onChange={(e) => handleTargetChange(p.id, 'targetPagesComplex', Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                  )}
                                </div>

                                <div className="bulk-complexity-row">
                                  <label className="checkbox-mini" style={{ width: '120px' }}>
                                    <input
                                      type="checkbox"
                                      checked={!!target.heavyChecked}
                                      onChange={(e) => handleTargetChange(p.id, 'heavyChecked', e.target.checked)}
                                    />
                                    <span>Heavy Complex</span>
                                  </label>
                                  {target.heavyChecked && (
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="Pages"
                                      className="mini-pages-num-input"
                                      value={target.targetPagesHeavyComplex || ''}
                                      onChange={(e) => handleTargetChange(p.id, 'targetPagesHeavyComplex', Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Overall Pages Target */}
                            <div className="bulk-overall-target-section">
                              <label className="input-label">Overall Target Page Count</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="Total target pages"
                                className="modal-number-input overall-page-input-large"
                                value={target.targetPagesTotal || ''}
                                onChange={(e) => handleTargetChange(p.id, 'targetPagesTotal', Math.max(0, parseInt(e.target.value) || 0))}
                                required
                              />
                            </div>
                          </div>

                          <div className="bulk-project-card-weeks">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <span className="section-small-label">Weekly Page Targets (4 Weeks)</span>
                              <button
                                type="button"
                                className="weekly-autofill-btn"
                                onClick={() => {
                                  const total = target.targetPagesTotal || 0;
                                  const base = Math.floor(total / 4);
                                  const rem = total % 4;
                                  handleTargetChange(p.id, 'targetPagesWeek1', base);
                                  handleTargetChange(p.id, 'targetPagesWeek2', base);
                                  handleTargetChange(p.id, 'targetPagesWeek3', base);
                                  handleTargetChange(p.id, 'targetPagesWeek4', base + rem);
                                }}
                                title="Auto-distribute evenly across 4 weeks"
                              >
                                ⚡ Auto-fill Average
                              </button>
                            </div>

                            {/* Remaining indicator */}
                            {(() => {
                              const wSum = (target.targetPagesWeek1 || 0) + (target.targetPagesWeek2 || 0) + (target.targetPagesWeek3 || 0) + (target.targetPagesWeek4 || 0);
                              const rem = (target.targetPagesTotal || 0) - wSum;
                              const isOver = rem < 0;
                              const isOk = rem === 0 && wSum > 0;
                              return ((target.targetPagesTotal || 0) > 0 || wSum > 0) ? (
                                <div className={`weekly-remaining-bar ${isOver ? 'over' : isOk ? 'balanced' : ''}`} style={{ marginBottom: '10px' }}>
                                  <span className="remaining-label">
                                    {isOk ? '✓ Fully allocated' : isOver ? `⚠ Over by ${Math.abs(rem)} pages` : `Remaining: ${rem} pages`}
                                  </span>
                                  <div className="remaining-progress-track">
                                    <div className="remaining-progress-fill" style={{ width: `${Math.min(100, (wSum / (target.targetPagesTotal || 1)) * 100)}%`, background: isOver ? '#ef4444' : isOk ? '#22c55e' : '#6366f1' }} />
                                  </div>
                                </div>
                              ) : null;
                            })()}

                            <div className="bulk-weekly-inputs-grid">
                              {getWeeklyRanges(bulkStartDate, bulkEndDate).map((wk, idx) => {
                                const fieldName = `targetPagesWeek${idx + 1}`;
                                return (
                                  <div key={idx} className="weekly-input-item">
                                    <span className="weekly-input-label">{wk.label}</span>
                                    <span className="weekly-range-label">{wk.range}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="—"
                                      className="mini-pages-num-input weekly-page-input-field"
                                      value={target[fieldName] || ''}
                                      onChange={(e) => handleTargetChange(p.id, fieldName, Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              <div className="modal-actions-wrapper">
                <button
                  type="button"
                  className="modal-btn-dismiss"
                  onClick={() => {
                    setShowBulkModal(false);
                    setSelectedClientId('');
                    setBulkProjectsTargets({});
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn-confirm"
                  disabled={bulkSaving || !selectedClientId}
                >
                  {bulkSaving ? 'Applying targets...' : 'Create Targets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project details side drawer */}
      {showDetailDrawer && (
        <div className="drawer-overlay" onClick={() => setShowDetailDrawer(false)}>
          <div className={`drawer-container ${isMaximized ? 'maximized' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title-section">
                {!loadingDetail && selectedProjectDetail && (
                  <span className="drawer-client-name">{selectedProjectDetail.clientName}</span>
                )}
                <h3 className="drawer-project-name">
                  {loadingDetail ? 'Loading Details...' : selectedProjectDetail?.projectName}
                </h3>
              </div>
              <div className="drawer-header-actions">
                {!loadingDetail && selectedProjectDetail && (
                  <button
                    className="drawer-maximize-btn"
                    onClick={() => setIsMaximized(!isMaximized)}
                    title={isMaximized ? "Restore size" : "Open fully"}
                  >
                    {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                )}
                <button className="drawer-close-btn" onClick={() => setShowDetailDrawer(false)}>×</button>
              </div>
            </div>

            {loadingDetail ? (
              <div className="drawer-loading">
                <div className="loader-element"></div>
                <p>Retrieving operational records...</p>
              </div>
            ) : selectedProjectDetail ? (() => {
              const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
              const cycleStart = selectedProjectDetail.billingCycleStartDate;
              const cycleEnd = selectedProjectDetail.billingCycleEndDate;
              const weeks = cycleStart ? getWeeklyRanges(cycleStart, cycleEnd) : [];
              const getWeekJobsCount = (weekNum) => {
                if (!selectedProjectDetail.jobs) return 0;
                return selectedProjectDetail.jobs.filter(job => {
                  const jobWeek = getJobWeek(
                    job,
                    selectedProjectDetail.billingCycleStartDate,
                    selectedProjectDetail.billingCycleEndDate
                  );
                  if (weekNum === 4) {
                    return jobWeek === 4 || jobWeek === 5;
                  }
                  return jobWeek === weekNum;
                }).length;
              };

              const getWeekTargetBooks = (weekNum) => {
                if (weekNum === 1) return selectedProjectDetail.week1TargetBooks || 0;
                if (weekNum === 2) return selectedProjectDetail.week2TargetBooks || 0;
                if (weekNum === 3) return selectedProjectDetail.week3TargetBooks || 0;
                if (weekNum === 4) return (selectedProjectDetail.week4TargetBooks || 0) + (selectedProjectDetail.week5TargetBooks || 0);
                return 0;
              };

              return (
                <div className="drawer-body single-page-drawer">
                  <div className="drawer-content-scrollable">

                    {/* Section 1: Overview & Operational Workflow */}
                    <div className="drawer-section overview-section">
                      <div className="highlighted-workflow-card">
                        <div className="workflow-card-header center-header">
                          <h4 className="workflow-card-title center-title">
                            <span className="workflow-highlight">{selectedProjectDetail.workflowName}</span>
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Page Output by Complexity */}
                    {selectedProjectDetail.targetPagesTotal > 0 && (
                      <div className="drawer-section complexity-pages-section">
                        <h4 className="section-title">Page Output by Complexity</h4>
                        <div className="complexity-pages-grid">
                          {[
                            { label: 'Simple', target: selectedProjectDetail.targetPagesSimple, actual: getActualPagesByComplexity('simple'), key: 'simple' },
                            { label: 'Medium', target: selectedProjectDetail.targetPagesMedium, actual: getActualPagesByComplexity('medium'), key: 'medium' },
                            { label: 'Complex', target: selectedProjectDetail.targetPagesComplex, actual: getActualPagesByComplexity('complex'), key: 'complex' },
                            { label: 'Heavy Complex', target: selectedProjectDetail.targetPagesHeavyComplex, actual: getActualPagesByComplexity('heavy-complex'), key: 'heavy-complex' }
                          ].map((c, idx) => {
                            const progress = c.target > 0 ? Math.min(100, Math.round(((c.actual || 0) / c.target) * 100)) : 0;
                            return (
                              <div key={idx} className={`complexity-page-node ${c.key}`}>
                                <div className="c-text-header">
                                  <span className="c-label">{c.label}</span>
                                  <span className="c-pages-val">
                                    <strong>{c.actual || 0}</strong> / {c.target || 0} pages
                                  </span>
                                </div>
                                {c.target > 0 && (
                                  <div className="c-progress-bar">
                                    <div className="c-progress-fill" style={{ width: `${progress}%` }}></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Weekly Target Performance */}
                    <div className="drawer-section weekly-targets-section">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <h4 className="section-title" style={{ margin: 0 }}>Weekly Target Performance</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.88rem', color: '#ef4444', fontWeight: '700', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 12px' }}>
                            Incomplete Book: <strong style={{ color: '#dc2626' }}>{selectedProjectDetail.actualIncompleteBooks || 0}</strong>
                          </span>
                          <span style={{ fontSize: '0.88rem', color: '#ef4444', fontWeight: '700', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 12px' }}>
                            Incomplete page: <strong style={{ color: '#dc2626' }}>{selectedProjectDetail.actualIncompletePages || 0}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="weekly-stats-list">
                        {(() => {
                          const targets = [
                            selectedProjectDetail.targetPagesWeek1,
                            selectedProjectDetail.targetPagesWeek2,
                            selectedProjectDetail.targetPagesWeek3,
                            selectedProjectDetail.targetPagesWeek4
                          ];
                          const actuals = [
                            selectedProjectDetail.actualPagesWeek1,
                            selectedProjectDetail.actualPagesWeek2,
                            selectedProjectDetail.actualPagesWeek3,
                            (selectedProjectDetail.actualPagesWeek4 || 0) + (selectedProjectDetail.actualPagesWeek5 || 0)
                          ];
                          return [0, 1, 2, 3].map((idx) => {
                            const target = targets[idx] || 0;
                            const actual = actuals[idx] || 0;
                            const hasTarget = target > 0;
                            const truePercent = hasTarget ? Math.round((actual / target) * 100) : 0;
                            const fillPercent = Math.min(100, truePercent);
                            const isMet = hasTarget && actual >= target;
                            const statusClass = hasTarget ? (isMet ? 'status-met' : 'status-behind') : 'status-unset';
                            const wk = weeks[idx];
                            return (
                              <div
                                key={idx}
                                className={`weekly-stat-row ${statusClass} ${selectedWeek === idx + 1 ? 'active-filter' : ''}`}
                                onClick={() => setSelectedWeek(prev => prev === idx + 1 ? null : idx + 1)}
                              >
                                <div className="week-label-header">
                                  <span className="wk-name">
                                    Week {idx + 1}
                                    {wk && <span className="wk-date-range"> ({wk.range})</span>}
                                  </span>
                                  <span className="wk-vals">
                                    Completed <strong>{actual}</strong> / {hasTarget ? target : 'Unset'} pages
                                  </span>
                                </div>
                                {hasTarget ? (
                                  <div className="wk-progress-bar-wrapper">
                                    <div className="wk-progress-bar-track">
                                      <div
                                        className={`wk-progress-bar-fill ${getProgressColor(truePercent)}`}
                                        style={{ width: `${fillPercent}%` }}
                                      ></div>
                                    </div>
                                    <span className="wk-progress-percent">{truePercent}%</span>
                                  </div>
                                ) : (
                                  <span className="wk-no-target-hint">No target set for this week</span>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Section 4: Page Output Registry */}
                    <div className="drawer-section books-registry-section">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <h4 className="section-title" style={{ margin: 0 }}>Page Output Registry</h4>
                          <span style={{ fontSize: '0.85rem', color: '#1e3a8a', fontWeight: '700', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                            {selectedWeek !== null ? (
                              <span>Week {selectedWeek} Book / Article: <strong style={{ color: '#1d4ed8' }}>{getWeekJobsCount(selectedWeek)}</strong></span>
                            ) : (
                              <span>Monthly Book / Article: <strong style={{ color: '#1d4ed8' }}>{selectedProjectDetail.jobs ? selectedProjectDetail.jobs.length : 0}</strong></span>
                            )}
                          </span>
                        </div>

                        {/* Right Date Badge (Removed absolute centering to avoid overlaps) */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600', background: '#f1f5f9', padding: '4px 12px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e1' }}>
                            <span style={{ color: '#0d9488', fontWeight: '800' }}>📅</span>
                            {selectedWeek !== null ? (
                              <span>Week {selectedWeek} Dates: <strong style={{ color: '#0d9488' }}>{weeks[selectedWeek - 1]?.range || '—'}</strong></span>
                            ) : (
                              <span> <strong style={{ color: '#0d9488' }}>{fmt(cycleStart)} - {fmt(cycleEnd)}</strong></span>
                            )}
                          </span>
                        </div>

                        {selectedWeek !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="mini-badge badge-progress" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                              Week {selectedWeek} Active Filter
                            </span>
                            <button
                              onClick={() => setSelectedWeek(null)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              Clear Filter
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="tab-toolbar">
                        <div className="mini-search-wrapper">
                          <Search size={14} className="mini-search-icon" />
                          <input
                            type="text"
                            placeholder="Search by Title or Job ID..."
                            className="mini-search-input"
                            value={bookSearchQuery}
                            onChange={(e) => setBookSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      {(() => {
                        const filteredJobs = (selectedProjectDetail.jobs || []).filter(job => {
                          const q = bookSearchQuery.toLowerCase();
                          const matchesSearch = (job.titleName || '').toLowerCase().includes(q) ||
                            (job.jobIdCode || '').toLowerCase().includes(q);
                          if (!matchesSearch) return false;

                          if (selectedWeek !== null) {
                            const jobWeek = getJobWeek(
                              job,
                              selectedProjectDetail.billingCycleStartDate,
                              selectedProjectDetail.billingCycleEndDate
                            );
                            if (selectedWeek === 4) {
                              return jobWeek === 4 || jobWeek === 5;
                            }
                            return jobWeek === selectedWeek;
                          }
                          return true;
                        });

                        return filteredJobs.length > 0 ? (
                          <div className="drawer-table-container">
                            <table className="drawer-jobs-table registry-table-compact">
                              <thead>
                                <tr>
                                  <th>Assigned Employee</th>
                                  <th>No. Employee</th>
                                  <th>Receive Date</th>
                                  <th>Job ID</th>
                                  <th>ISBN</th>
                                  <th>Title / Article</th>
                                  <th>Pages</th>
                                  <th>Complexity</th>
                                  <th>Commenced Date</th>
                                  <th>Uploaded Date</th>
                                  <th>No. of Days</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredJobs.map((job) => {
                                  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                                  return (
                                    <tr key={job.id}>
                                      <td style={{ textAlign: 'left', minWidth: '180px' }}>
                                        <div className="employee-box-container">
                                          {job.employeeNames && (
                                            <div className="employee-box prod-box">
                                              <span className="employee-icon-prod">👤</span>
                                              <span className="employee-names-list" title={job.employeeNames}>
                                                {job.employeeNames.split(',').map(s => s.trim()).filter(Boolean).join(' | ')}
                                              </span>
                                            </div>
                                          )}
                                          {job.qcEmployeeNames && (
                                            <div className="employee-box qc-box">
                                              <span className="employee-icon-qc">👤</span>
                                              <span className="employee-names-list" title={job.qcEmployeeNames}>
                                                {job.qcEmployeeNames.split(',').map(s => s.trim()).filter(Boolean).join(' | ')}
                                              </span>
                                            </div>
                                          )}
                                          {!job.employeeNames && !job.qcEmployeeNames && '—'}
                                        </div>
                                      </td>
                                      <td style={{ fontWeight: '700', color: '#0d9488' }}>
                                        {(() => {
                                          const emps = new Set();
                                          if (job.employeeNames) {
                                            job.employeeNames.split(',').forEach(s => {
                                              const name = s.trim();
                                              if (name) emps.add(name.toLowerCase());
                                            });
                                          }
                                          if (job.qcEmployeeNames) {
                                            job.qcEmployeeNames.split(',').forEach(s => {
                                              const name = s.trim();
                                              if (name) emps.add(name.toLowerCase());
                                            });
                                          }
                                          return emps.size;
                                        })()}
                                      </td>
                                      <td className="job-date">{fmt(job.receiveDate)}</td>
                                      <td className="job-id-code" style={{ fontWeight: '600' }}>{job.jobIdCode || '—'}</td>
                                      <td className="job-isbn-code">{job.xmlIsbn || '—'}</td>
                                      <td className="job-title" title={job.titleName}>{job.titleName}</td>
                                      <td className="job-pages">{job.pageCount || '—'}</td>
                                      <td>
                                        <span className={`complexity-mini-tag ${(job.complexity || '').toLowerCase().replace(/\s+/g, '-')}`}>
                                          {job.complexity || '—'}
                                        </span>
                                      </td>
                                      <td className="job-date">{fmt(job.startMonth)}</td>
                                      <td className="job-date">{fmt(job.uploadDate)}</td>
                                      <td className="job-days">{job.noOfDays > 0 ? `${job.noOfDays}d` : '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="empty-tab-state">
                            <p>
                              {selectedWeek !== null
                                ? `No uploaded jobs with production dates in Week ${selectedWeek} of this billing cycle.`
                                : "No uploaded jobs with production dates in this billing cycle."}
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              );
            })() : (
              <div className="drawer-error">
                <AlertCircle size={28} />
                <p>Failed to retrieve project detail.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyTargets;





















