// src/pages/admin/Setting.js

import React, { useState, useEffect } from 'react';
import './Setting.css';
import { apiCall, API_BASE, getAccessToken } from '../../utils/api';
import congratulationsGif from '../../assets/images/congratulations.gif';
import performerImage from '../../assets/images/performer.jpg';
import TopPerformerCarousel from '../../components/dashboard/TopPerformerCarousel';
import '../../components/dashboard/TopPerformerCarousel.css';
import { Award, ImagePlus, Plus, Trash2, UserRound } from 'lucide-react';

/* ─── Default state ─────────────────────── */
const DEFAULT = {
  /* Login Page */
  portalName: 'ADT - Production Login Portal',
  welcomeMessage: '👋 Welcome Back! Please Login to Continue 🚀 😊',
  enableThirukkural: true,
  thirukkuralTranslation: 'all',
  loginQuotes: [
    'Success is not final, failure is not fatal: It is the courage to continue that counts.',
    'The only way to do great work is to love what you do.',
    'Believe you can and you\'re halfway there.',
  ],

  /* Company Information */
  companyName: 'Arrow Data-Tech',
  streetAddress: '07 M.G Road Near Rouridana',
  city: 'Kottakuppam , Villupuram District',
  stateProvince: 'Tamil Nadu',
  zipCode: '605104',
  country: 'India',
  companyLocation: 'Puducherry',
  phone: '+91 08849SE (12)',
  email: 'eachinnusen@outlook.com',

  /* Theme */
  primaryColor: '#cd1996',
  secondaryColor: '#13979c',

  /* Feature Toggles */
  topPerformerBanner: true,
  topPerformerUserId: '',
  topPerformerName: '',
  topPerformerCriteria: 'Monthly',
  topPerformerPurpose: '',
  topPerformerPhotoUrl: '',
  topPerformerGifUrl: 'https://media.giphy.com/media/26tOZbfHHHJB92VU4/giphy.gif',
  topPerformerCriteriaOptions: ['Monthly', 'Weekly', 'Hardworker'],
  topPerformerPurposeOptions: [],
  topPerformerEntries: [],

  /* System */
  sessionTimeout: 479,
  maxFileSize: 10,
  allowedTypes: 'jpg,jpeg,png,pdf,doc,docx',
  announcement: '',
  isCelebration: false,
  celebrationText: '',
  celebrationPhotoUrl: '',
};

const createTopPerformerEntry = (values = {}) => ({
  id: values.id || `performer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  userId: values.userId || '',
  userCode: values.userCode || '',
  role: values.role || '',
  name: values.name || '',
  criteria: values.criteria || 'Monthly',
  purpose: (values.purpose || '').startsWith('Thank you for your perfect attendance today!') ? '' : (values.purpose || ''),
  photoUrl: values.photoUrl || '',
  gifUrl: values.gifUrl || '',
  emoji: values.emoji || '⭐',
});

/* ─── Modal ──────────────────────────────── */
const Modal = ({ onClose, children }) => (
  <div className="st-modal-overlay" onClick={onClose}>
    <div className="st-modal-box" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

/* ─── Quote Manager Modal ────────────────── */
const QuoteModal = ({ quotes, onClose, onSave }) => {
  const [list, setList] = useState([...quotes]);
  const [newQ, setNewQ] = useState('');

  const addQuote = () => { if (newQ.trim()) { setList(p => [...p, newQ.trim()]); setNewQ(''); } };
  const removeQuote = (i) => setList(p => p.filter((_, idx) => idx !== i));
  const editQuote = (i, val) => setList(p => p.map((q, idx) => idx === i ? val : q));

  return (
    <Modal onClose={onClose}>
      <h2 className="st-modal-title">Manage Login Quotes</h2>
      <p className="st-modal-sub">These quotes rotate on the login page to inspire users.</p>

      <div className="st-quote-list">
        {list.map((q, i) => (
          <div key={i} className="st-quote-item">
            <textarea
              className="st-quote-textarea"
              value={q}
              rows={2}
              onChange={e => editQuote(i, e.target.value)}
            />
            <button className="st-quote-del" title="Remove" onClick={() => removeQuote(i)}>✕</button>
          </div>
        ))}
      </div>

      <div className="st-quote-add-row">
        <textarea
          className="st-quote-new"
          placeholder="Add a new motivational quote..."
          value={newQ}
          rows={2}
          onChange={e => setNewQ(e.target.value)}
        />
        <button className="st-quote-add-btn" onClick={addQuote}>＋ Add</button>
      </div>

      <div className="st-modal-actions">
        <button className="st-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="st-btn-primary" onClick={() => { onSave(list); onClose(); }}>Save Quotes</button>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const FALLBACK_KURALS = [
  {
    number: 1,
    chapter: "கடவுள் வாழ்த்து",
    section: "அறத்துப்பால்",
    kural: ["அகர முதல எழுத்தெல்லாம் ஆதி", "பகவன் முதற்றே உலகு."],
    meaning: {
      ta_mu_va: "எழுத்துக்கள் எல்லாம் அகரத்தை அடிப்படையாக கொண்டிருக்கின்றன. அதுபோல உலகம் கடவுளை அடிப்படையாக கொண்டிருக்கிறது.",
      ta_salamon: "எழுத்துக்கள் எல்லாம் அகரத்தில் தொடங்குகின்றன; (அது போல) உலகம் கடவுளில் தொடங்குகிறது.",
      ta_kalaignar: "அகரம் எழுத்துக்களுக்கு முதன்மை; ஆதிபகவன், உலகில் வாழும் உயிர்களுக்கு முதன்மை",
      en: "As the letter A is the first of all letters, so the eternal God is first in the world."
    }
  },
  {
    number: 391,
    chapter: "கல்வி",
    section: "பொருட்பால்",
    kural: ["கற்க கசடறக் கற்பவை கற்றபின்", "நிற்க அதற்குத் தக."],
    meaning: {
      ta_mu_va: "கற்கத் தகுந்த நூல்களைக் குற்றம் இல்லாமல் கற்க வேண்டும்; அவ்வாறு கற்ற பிறகு கற்ற கல்விக்குத் தக்கவாறு நெறியில் நிற்க வேண்டும்.",
      ta_salamon: "கற்க வேண்டியவைகளைக் குற்றம் இல்லாமல் கற்க வேண்டும்; கற்ற பிறகு, கற்ற கல்விக்கு ஏற்ப நல்ல வழிகளில் நடக்க வேண்டும்.",
      ta_kalaignar: "படிக்க வேண்டியவைகளைத் தங்கு தடையின்றிக் கற்றுக்கொள்ள வேண்டும்; கற்ற பிறகு அதன்படி நடக்கவும் வேண்டும்",
      en: "Let a man learn thoroughly those things which he ought to learn, and let him afterwards stand in his way."
    }
  }
];

const getKuralMeaningForTranslation = (kural, translationMode) => {
  if (!kural || !kural.meaning) return '';
  switch (translationMode) {
    case 'en':
      return kural.meaning.en || '';
    case 'ta_mu_va':
      return kural.meaning.ta_mu_va || '';
    case 'ta_salamon':
      return kural.meaning.ta_salamon || '';
    case 'ta_kalaignar':
      return kural.meaning.ta_kalaignar || '';
    case 'all':
    default:
      const ta = kural.meaning.ta_mu_va || kural.meaning.ta_salamon || kural.meaning.ta_kalaignar || '';
      const en = kural.meaning.en || '';
      return (
        <div>
          <p style={{ margin: '0 0 6px 0', fontWeight: '500', color: '#1f2937' }}>{ta}</p>
          <p style={{ margin: 0, color: '#4b5563', borderTop: '1px dashed #e5e7eb', paddingTop: '4px' }}>{en}</p>
        </div>
      );
  }
};

const Setting = () => {
  const [form, setForm] = useState({ ...DEFAULT });
  const [saved, setSaved] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [thirukkuralPreview, setThirukkuralPreview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [topPerformerUserIds, setTopPerformerUserIds] = useState([]);
  const [originalTopPerformerUserIds, setOriginalTopPerformerUserIds] = useState([]);
  const [showAddCriteriaModal, setShowAddCriteriaModal] = useState(false);
  const [newCriteriaInput, setNewCriteriaInput] = useState('');
  const [criteriaTargetEntryId, setCriteriaTargetEntryId] = useState(null);
  const [showAddPurposeModal, setShowAddPurposeModal] = useState(false);
  const [purposeTargetEntryId, setPurposeTargetEntryId] = useState(null);
  const [newPurposeInput, setNewPurposeInput] = useState('');

  // Lightbox States
  const [lightboxImg, setLightboxImg] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Card Preview Zoom (Settings only — initialised from saved URL hash)
  const getZoomFromUrl = (url) => {
    const hash = (url || '').split('#')[1] || '';
    const parts = hash.split(':');
    const z = parseFloat(parts[1]);
    return (!isNaN(z) && z >= 100 && z <= 300) ? z / 100 : 1;
  };
  const [cardZoom, setCardZoom] = useState(() => getZoomFromUrl(form.celebrationPhotoUrl));

  // Helper: build URL with current fit + zoom encoded in hash
  const buildUrl = (baseUrl, fit, zoom) => `${baseUrl}#${fit}:${Math.round(zoom * 100)}`;

  const openLightbox = (url) => {
    setLightboxImg(url);
    setZoomLevel(1);
    setRotation(0);
  };

  const closeLightbox = () => {
    setLightboxImg(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    };
    if (lightboxImg) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxImg]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const fetchSettingsAndUsers = async () => {
      try {
        const [data, usersData] = await Promise.all([
          apiCall('/settings').catch(() => null),
          apiCall('/users').catch(() => [])
        ]);
        if (usersData && Array.isArray(usersData)) {
          setUsersList(usersData);
          const performerIds = usersData
            .filter(u => u.isTopPerformer)
            .map(u => String(u.id));
          setTopPerformerUserIds(performerIds);
          setOriginalTopPerformerUserIds(performerIds);
        }
        if (data) {
          setForm({
            portalName: data.portalName || '',
            welcomeMessage: data.welcomeMessage || '',
            loginQuotes: data.loginQuotes || [],
            enableThirukkural: data.enableThirukkural ?? true,
            thirukkuralTranslation: data.thirukkuralTranslation || 'all',
            companyName: data.companyName || '',
            streetAddress: data.streetAddress || '',
            city: data.city || '',
            stateProvince: data.state || '',
            zipCode: data.zipCode || '',
            country: data.country || '',
            companyLocation: data.companyLocation || '',
            phone: data.phone || '',
            email: data.email || '',
            primaryColor: data.primaryColor || '#c28595',
            secondaryColor: data.secondaryColor || '#f0979c',
            topPerformerBanner: data.enableTopPerformerBanner ?? true,
            sessionTimeout: data.sessionTimeout ?? 480,
            maxFileSize: data.maxFileSize ?? 10,
            allowedTypes: data.allowedTypes || 'jpg,jpeg,png,pdf,doc,docx',
            announcement: data.announcement || '',
            isCelebration: data.isCelebration ?? false,
            celebrationText: data.celebrationText || '',
            celebrationPhotoUrl: data.celebrationPhotoUrl || '',
            topPerformerUserId: data.topPerformerUserId || '',
            topPerformerName: data.topPerformerName || '',
            topPerformerCriteria: data.topPerformerCriteria || 'Monthly',
            topPerformerPurpose: data.topPerformerPurpose || '',
            topPerformerPhotoUrl: data.topPerformerPhotoUrl || '',
            topPerformerGifUrl: data.topPerformerGifUrl || '',
            topPerformerCriteriaOptions: data.topPerformerCriteriaOptions || ['Monthly', 'Weekly', 'Hardworker'],
            topPerformerPurposeOptions: Array.isArray(data.topPerformerPurposeOptions) && data.topPerformerPurposeOptions.length > 0
              ? data.topPerformerPurposeOptions
              : [...new Set((data.topPerformerEntries || []).map(entry => entry.purpose).filter(Boolean))],
            topPerformerEntries: Array.isArray(data.topPerformerEntries) && data.topPerformerEntries.length > 0
              ? data.topPerformerEntries.map(entry => {
                const employee = (usersData || []).find(user => String(user.id) === String(entry.userId));
                return createTopPerformerEntry({
                  ...entry,
                  userCode: entry.userCode || employee?.userCode || '',
                });
              })
              : [createTopPerformerEntry({
                userId: data.topPerformerUserId || '',
                userCode: (usersData || []).find(user => String(user.id) === String(data.topPerformerUserId))?.userCode || '',
                name: data.topPerformerName || '',
                criteria: data.topPerformerCriteria || 'Monthly',
                purpose: data.topPerformerPurpose || '',
                photoUrl: data.topPerformerPhotoUrl || '',
                gifUrl: data.topPerformerGifUrl || '',
              })],
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettingsAndUsers();
  }, []);

  useEffect(() => {
    // Load daily Kural preview when enabled
    if (form.enableThirukkural) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      fetch("https://tamil-kural-api.vercel.app/api/daily", { signal: controller.signal })
        .then(res => {
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data && data.number) {
            setThirukkuralPreview(data);
          } else {
            throw new Error("Invalid response");
          }
        })
        .catch(err => {
          console.warn("Failed to fetch daily Thirukkural preview:", err);
          const today = new Date();
          const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
          const fallbackIndex = dayOfYear % FALLBACK_KURALS.length;
          setThirukkuralPreview(FALLBACK_KURALS[fallbackIndex]);
        });
    }
  }, [form.enableThirukkural]);

  const handleSave = async () => {
    try {
      const validTopPerformerEntries = (form.topPerformerEntries || [])
        .filter(entry => entry.userId)
        .map(entry => ({ ...entry }));
      const primaryPerformer = validTopPerformerEntries[0] || {};
      const payload = {
        portalName: form.portalName,
        welcomeMessage: form.welcomeMessage,
        loginQuotes: form.loginQuotes,
        enableThirukkural: form.enableThirukkural,
        thirukkuralTranslation: form.thirukkuralTranslation,
        companyName: form.companyName,
        streetAddress: form.streetAddress,
        city: form.city,
        state: form.stateProvince,
        zipCode: form.zipCode,
        country: form.country,
        companyLocation: form.companyLocation,
        phone: form.phone,
        email: form.email,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        enableTopPerformerBanner: form.topPerformerBanner,
        sessionTimeout: parseInt(form.sessionTimeout, 10) || 480,
        maxFileSize: parseInt(form.maxFileSize, 10) || 10,
        allowedTypes: form.allowedTypes,
        announcement: form.announcement || '',
        isCelebration: form.isCelebration ?? false,
        celebrationText: form.celebrationText || '',
        celebrationPhotoUrl: form.celebrationPhotoUrl || '',
        topPerformerUserId: primaryPerformer.userId || null,
        topPerformerName: primaryPerformer.name || '',
        topPerformerCriteria: primaryPerformer.criteria || 'Monthly',
        topPerformerPurpose: primaryPerformer.purpose || '',
        topPerformerPhotoUrl: primaryPerformer.photoUrl || '',
        topPerformerGifUrl: primaryPerformer.gifUrl || '',
        topPerformerCriteriaOptions: form.topPerformerCriteriaOptions || ['Monthly', 'Weekly', 'Hardworker'],
        topPerformerPurposeOptions: form.topPerformerPurposeOptions || [],
        topPerformerEntries: validTopPerformerEntries,
      };

      await apiCall('/settings', 'PUT', payload);

      const selectedIds = new Set(validTopPerformerEntries.map(entry => String(entry.userId)));
      const originalIds = new Set(originalTopPerformerUserIds.map(String));
      const changedUsers = usersList.filter(user => {
        const id = String(user.id);
        return selectedIds.has(id) !== originalIds.has(id);
      });

      if (changedUsers.length > 0) {
        await Promise.all(changedUsers.map(user => apiCall(`/users/${user.id}`, 'PUT', {
          isTopPerformer: selectedIds.has(String(user.id)),
        })));
        setOriginalTopPerformerUserIds([...selectedIds]);
        setUsersList(prev => prev.map(user => ({
          ...user,
          isTopPerformer: selectedIds.has(String(user.id)),
        })));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings: ' + err.message);
    }
  };

  const toggleTopPerformerUser = (userId) => {
    const id = String(userId);
    setTopPerformerUserIds(prev => (
      prev.includes(id)
        ? prev.filter(existingId => existingId !== id)
        : [...prev, id]
    ));
  };

  const addTopPerformerEntry = () => {
    set('topPerformerEntries', [
      ...(form.topPerformerEntries || []),
      createTopPerformerEntry({
        criteria: (form.topPerformerCriteriaOptions || [])[0] || 'Monthly',
        gifUrl: performerImage,
      }),
    ]);
  };

  const removeTopPerformerEntry = (entryId) => {
    set('topPerformerEntries', (form.topPerformerEntries || []).filter(entry => entry.id !== entryId));
  };

  const updateTopPerformerEntry = (entryId, key, value) => {
    set('topPerformerEntries', (form.topPerformerEntries || []).map(entry => (
      entry.id === entryId ? { ...entry, [key]: value } : entry
    )));
  };

  const selectTopPerformerEmployee = (entryId, userId) => {
    const employee = usersList.find(user => String(user.id) === String(userId));
    setForm(previous => ({
      ...previous,
      topPerformerEntries: (previous.topPerformerEntries || []).map(entry => (
        entry.id === entryId
          ? {
            ...entry,
            userId,
            userCode: employee?.userCode || '',
            role: employee?.role || '',
            name: employee ? (employee.fullName || employee.userCode || '') : '',
            photoUrl: employee ? (employee.profilePhotoUrl || '') : '',
          }
          : entry
      )),
    }));
  };

  const uploadTopPerformerPhoto = async (entryId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'TopPerformer');
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: formData,
      });
      const result = await response.json();
      if (result.success && result.data?.url) {
        updateTopPerformerEntry(entryId, 'photoUrl', result.data.url);
      } else {
        alert('Upload failed: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  /* Active quote (rotate for preview) */
  const previewQuote = (form.loginQuotes && form.loginQuotes[0]) || 'No quotes set yet.';

  if (loading) {
    return (
      <div className="st-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: 'rgba(255,255,255,0.6)' }}>
        <div>Loading settings from server...</div>
      </div>
    );
  }

  return (
    <div className="st-container">

      {/* ── Page Header ── */}
      <div className="st-page-header">
        <div className="st-page-title">
          <span className="st-page-icon">⚙️</span>
          <h2>Settings</h2>
        </div>
        <button className="st-save-btn" onClick={handleSave}>
          {saved ? '✓ Saved!' : '💾 Save Settings'}
        </button>
      </div>

      <div className="st-grid">

        {/* ══════════════════════════════════
            LEFT COLUMN
        ══════════════════════════════════ */}
        <div className="st-col">

          {/* ── Login Page Settings ── */}
          <div className="st-card">
            <h3 className="st-card-title">🔐 Login Page Settings</h3>

            {/* Thirukkural Toggle */}
            <div className="st-toggle-item" style={{ marginBottom: '14px' }}>
              <div className="st-toggle-info">
                <label className="st-toggle-label">
                  <input
                    type="checkbox"
                    className="st-checkbox"
                    checked={form.enableThirukkural}
                    onChange={e => set('enableThirukkural', e.target.checked)}
                  />
                  Enable Thirukkural of the Day
                </label>
                <p className="st-hint">Replace motivational quotes with a daily Thirukkural on the login page.</p>
              </div>
            </div>

            {form.enableThirukkural ? (
              <div className="st-thirukkural-settings" style={{ marginBottom: '14px' }}>
                <div className="st-form-group" style={{ marginBottom: '12px' }}>
                  <label className="st-label">Translation/Explanation Source</label>
                  <select
                    className="st-input"
                    value={form.thirukkuralTranslation}
                    onChange={e => set('thirukkuralTranslation', e.target.value)}
                    style={{ cursor: 'pointer', padding: '8px 12px' }}
                  >
                    <option value="all">Tamil Meaning + English Translation</option>
                    <option value="ta_mu_va">Tamil Meaning (Mu. Varadarajan)</option>
                    <option value="ta_salamon">Tamil Meaning (Solomon Pappaiah)</option>
                    <option value="ta_kalaignar">Tamil Meaning (Kalaignar)</option>
                    <option value="en">English Translation Only</option>
                  </select>
                </div>

                {/* Thirukkural Preview */}
                <div className="st-quote-preview" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(59, 130, 246, 0.06) 100%)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  <div className="st-quote-preview-label">Thirukkural Preview</div>
                  {thirukkuralPreview ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        குறள் {thirukkuralPreview.number} - {typeof thirukkuralPreview.chapter === 'object' ? thirukkuralPreview.chapter?.names?.ta || "" : (thirukkuralPreview.chapter || "")} ({typeof thirukkuralPreview.section === 'object' ? thirukkuralPreview.section?.names?.ta || "" : (thirukkuralPreview.section || "")})
                      </div>
                      <blockquote className="st-quote-preview-text" style={{ borderLeftColor: '#10b981', margin: 0, paddingLeft: '12px', fontStyle: 'normal' }}>
                        <p style={{ margin: '0 0 6px 0', fontWeight: '700', color: '#10b981', fontSize: '14.5px', fontFamily: 'inherit', textAlign: 'center', textShadow: '0 0 8px rgba(16, 185, 129, 0.7), 0 0 16px rgba(16, 185, 129, 0.35)' }}>{thirukkuralPreview.kural?.[0]}</p>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '700', color: '#10b981', fontSize: '14.5px', fontFamily: 'inherit', textAlign: 'center', textShadow: '0 0 8px rgba(16, 185, 129, 0.7), 0 0 16px rgba(16, 185, 129, 0.35)' }}>{thirukkuralPreview.kural?.[1]}</p>
                        <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                          {getKuralMeaningForTranslation(thirukkuralPreview, form.thirukkuralTranslation)}
                        </div>
                      </blockquote>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Loading daily Thirukkural preview...</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '14px' }}>
                <div className="st-section-label">Motivational Quotes</div>
                <p className="st-hint" style={{ marginBottom: '10px' }}>
                  These quotes display on the login page to inspire and motivate users. They rotate on each page load.
                </p>

                {/* Preview */}
                <div className="st-quote-preview">
                  <div className="st-quote-preview-label">Preview (first quote)</div>
                  <blockquote className="st-quote-preview-text">
                    "{previewQuote}"
                  </blockquote>
                  <div className="st-quote-count">
                    {form.loginQuotes.length} quote{form.loginQuotes.length !== 1 ? 's' : ''} configured
                  </div>
                </div>

                <button className="st-manage-quotes-btn" onClick={() => setShowQuotes(true)}>
                  ✏️ Manage Quotes ({form.loginQuotes.length})
                </button>
              </div>
            )}

            <div className="st-divider" />

            {/* Portal Name */}
            <div className="st-form-group">
              <label className="st-label">Portal Name</label>
              <input
                className="st-input"
                value={form.portalName}
                onChange={e => set('portalName', e.target.value)}
              />
            </div>

            {/* Welcome Message */}
            <div className="st-form-group">
              <label className="st-label">Welcome Message</label>
              <input
                className="st-input"
                value={form.welcomeMessage}
                onChange={e => set('welcomeMessage', e.target.value)}
              />
            </div>

            {/* Announcement */}
            <div className="st-form-group">
              <label className="st-label">Dashboard Announcement</label>
              <textarea
                className="st-input"
                value={form.announcement || ''}
                onChange={e => set('announcement', e.target.value)}
                rows={3}
                placeholder="Type global announcement here..."
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {/* Celebration Option */}
            <div className="st-form-group" style={{ marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label className="st-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.isCelebration || false}
                  onChange={e => set('isCelebration', e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                🎉 Enable Celebration Banner
              </label>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 12px 24px' }}>
                Show a special celebration banner with a photo and dedication above the announcement text.
              </p>

              {form.isCelebration && (
                <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Upload Photo */}
                  <div className="st-sub-group">
                    <label className="st-label" style={{ fontSize: '0.82rem', marginBottom: '6px' }}>Celebration Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                          const file = e.target.files[0];
                          if (!file) return;

                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('entityType', 'Celebration');

                          try {
                            setLoading(true);
                            const token = getAccessToken();
                            const response = await fetch(`${API_BASE}/media/upload`, {
                              method: 'POST',
                              headers: {
                                'Authorization': token ? `Bearer ${token}` : ''
                              },
                              body: formData
                            });
                            const result = await response.json();
                            if (result.success && result.data && result.data.url) {
                              set('celebrationPhotoUrl', `${result.data.url}#contain:100`);
                              setCardZoom(1);
                            } else {
                              alert('Upload failed: ' + (result.message || 'Unknown error'));
                            }
                          } catch (err) {
                            alert('Upload failed: ' + err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        style={{ fontSize: '0.8rem' }}
                      />
                      {form.celebrationPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => set('celebrationPhotoUrl', '')}
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          ✕ Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Celebration Text */}
                  <div className="st-sub-group">
                    <label className="st-label" style={{ fontSize: '0.82rem', marginBottom: '6px' }}>Celebration Dedication / Message</label>
                    <textarea
                      className="st-input"
                      value={form.celebrationText || ''}
                      onChange={e => set('celebrationText', e.target.value)}
                      rows={2}
                      placeholder="e.g. Wishing Jane Doe a very Happy Birthday! 🎂✨"
                      style={{ fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  {/* Real-time Live Preview Card */}
                  <div style={{ marginTop: '10px' }}>
                    <label className="st-label" style={{ fontSize: '0.82rem', marginBottom: '6px' }}>Live Card Preview (Click photo to test Lightbox)</label>
                    {(() => {
                      const rawUrl = form.celebrationPhotoUrl || '';
                      const hash = rawUrl.split('#')[1] || '';
                      const hashParts = hash.split(':');
                      const fitMode = hashParts[0] === 'cover' ? 'cover' : 'contain';
                      const cleanUrl = rawUrl.split('#')[0];
                      return (
                        <div className="celebration-card" style={{ maxWidth: '520px', margin: '0 auto 10px auto' }}>
                          <div className="celebration-content-wrapper">
                            <div className="celebration-content">
                              {form.celebrationPhotoUrl ? (
                                <div
                                  className="celebration-photo-container"
                                  title="Click to view full screen"
                                >
                                  <img
                                    src={`${API_BASE}${cleanUrl}`}
                                    alt="Celebration Preview"
                                    className="celebration-img"
                                    style={{
                                      objectFit: fitMode,
                                      width: fitMode === 'cover' ? '100%' : 'auto',
                                      height: '460px',
                                      transform: `scale(${cardZoom})`,
                                      transformOrigin: 'center center',
                                      transition: 'transform 0.2s ease'
                                    }}
                                    onClick={() => openLightbox(`${API_BASE}${cleanUrl}`)}
                                  />
                                  <div className="celebration-photo-overlay" onClick={() => openLightbox(`${API_BASE}${cleanUrl}`)}>
                                    <span className="celebration-zoom-icon">🔍</span>
                                  </div>
                                  <button
                                    className="celebration-fit-toggle"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const nextMode = fitMode === 'contain' ? 'cover' : 'contain';
                                      set('celebrationPhotoUrl', buildUrl(cleanUrl, nextMode, cardZoom));
                                    }}
                                    title={fitMode === 'contain' ? "Adjust to Fill card" : "Adjust to Fit in card"}
                                  >
                                    {fitMode === 'contain' ? '↔️ Fill' : '🖼️ Fit'}
                                  </button>
                                </div>
                              ) : (
                                <div style={{ padding: '20px', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', background: 'rgba(255,255,255,0.5)', border: '1px dashed #cbd5e1', borderRadius: '8px', width: '90%', boxSizing: 'border-box' }}>
                                  No Photo Uploaded
                                </div>
                              )}

                              {/* In-card Zoom Controls */}
                              {form.celebrationPhotoUrl && (() => {
                                const rawUrl2 = form.celebrationPhotoUrl || '';
                                const hash2 = rawUrl2.split('#')[1] || '';
                                const fitMode2 = hash2.split(':')[0] === 'cover' ? 'cover' : 'contain';
                                const cleanUrl2 = rawUrl2.split('#')[0];
                                return (
                                  <div className="card-zoom-controls">
                                    <button
                                      className="card-zoom-btn"
                                      onClick={() => {
                                        const next = Math.max(1, parseFloat((cardZoom - 0.25).toFixed(2)));
                                        setCardZoom(next);
                                        set('celebrationPhotoUrl', buildUrl(cleanUrl2, fitMode2, next));
                                      }}
                                      disabled={cardZoom <= 1}
                                      title="Zoom Out"
                                    >➖</button>
                                    <input
                                      type="range"
                                      className="card-zoom-slider"
                                      min={1}
                                      max={3}
                                      step={0.1}
                                      value={cardZoom}
                                      onChange={e => {
                                        const next = parseFloat(e.target.value);
                                        setCardZoom(next);
                                        set('celebrationPhotoUrl', buildUrl(cleanUrl2, fitMode2, next));
                                      }}
                                    />
                                    <button
                                      className="card-zoom-btn"
                                      onClick={() => {
                                        const next = Math.min(3, parseFloat((cardZoom + 0.25).toFixed(2)));
                                        setCardZoom(next);
                                        set('celebrationPhotoUrl', buildUrl(cleanUrl2, fitMode2, next));
                                      }}
                                      disabled={cardZoom >= 3}
                                      title="Zoom In"
                                    >➕</button>
                                    <span className="card-zoom-label">{Math.round(cardZoom * 100)}%</span>
                                    {cardZoom !== 1 && (
                                      <button
                                        className="card-zoom-reset"
                                        onClick={() => {
                                          setCardZoom(1);
                                          set('celebrationPhotoUrl', buildUrl(cleanUrl2, fitMode2, 1));
                                        }}
                                        title="Reset Zoom"
                                      >↩ Reset</button>
                                    )}
                                  </div>
                                );
                              })()}

                              {form.celebrationText ? (
                                <div className="celebration-text-box">
                                  {form.celebrationText}
                                </div>
                              ) : (
                                <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', background: 'rgba(255,255,255,0.5)', border: '1px dashed #cbd5e1', borderRadius: '8px', width: '90%', boxSizing: 'border-box' }}>
                                  No message set.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* ── Top Performer Banner Settings ── */}
            <section className="performer-builder">
              <div className="performer-builder__header">
                <label className="performer-builder__toggle">
                  <input type="checkbox" checked={form.topPerformerBanner ?? true} onChange={e => set('topPerformerBanner', e.target.checked)} />
                  <Award size={19} aria-hidden="true" />
                  <span>Enable Top Performer Banner</span>
                </label>
                <button type="button" className="performer-builder__add" onClick={addTopPerformerEntry}>
                  <Plus size={16} aria-hidden="true" />
                  Add New Card
                </button>
              </div>
              <p className="performer-builder__description">Create one separate recognition form for every employee and achievement.</p>

              {form.topPerformerBanner && (
                <div className="performer-builder__forms">
                  {(form.topPerformerEntries || []).length === 0 ? (
                    <div className="performer-builder__empty">
                      <Award size={30} aria-hidden="true" />
                      <strong>No performer cards configured</strong>
                      <span>Add a card, then choose the employee and recognition details.</span>
                      <button type="button" className="performer-builder__add" onClick={addTopPerformerEntry}>
                        <Plus size={16} aria-hidden="true" /> Add First Card
                      </button>
                    </div>
                  ) : (
                    (form.topPerformerEntries || []).map((entry, index) => (
                      <article className="performer-form" key={entry.id}>
                        <div className="performer-form__header">
                          <div className="performer-form__title">
                            <span className="performer-form__number">{index + 1}</span>
                            <div>
                              <h4>Top Performer Card {index + 1}</h4>
                              <p>{entry.name || 'Choose an employee to configure this card'}</p>
                            </div>
                          </div>
                          <button type="button" className="performer-form__delete" onClick={() => removeTopPerformerEntry(entry.id)} title="Delete this performer card" aria-label={`Delete performer card ${index + 1}`}>
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>

                        <div className="performer-form__grid">
                          <div className="performer-form__field performer-form__field--wide">
                            <div className="performer-form__label-row">
                              <label htmlFor={`performer-criteria-${entry.id}`}>Recognition Criteria / Category</label>
                              <button type="button" className="performer-form__criteria-add" onClick={() => { setCriteriaTargetEntryId(entry.id); setShowAddCriteriaModal(true); }}>
                                <Plus size={14} aria-hidden="true" /> Add Criteria
                              </button>
                            </div>
                            <select id={`performer-criteria-${entry.id}`} value={entry.criteria || 'Monthly'} onChange={e => updateTopPerformerEntry(entry.id, 'criteria', e.target.value)}>
                              {(form.topPerformerCriteriaOptions || ['Monthly', 'Weekly', 'Hardworker']).map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                          </div>

                          <div className="performer-form__field performer-form__field--wide">
                            <label htmlFor={`performer-user-${entry.id}`}>Select Employee / User</label>
                            <select id={`performer-user-${entry.id}`} value={entry.userId || ''} onChange={e => selectTopPerformerEmployee(entry.id, e.target.value)}>
                              <option value="">Choose employee...</option>
                              {usersList.map(user => (
                                <option key={user.id} value={user.id}>{user.fullName || user.userCode || 'Unnamed User'}{user.userCode ? ` (${user.userCode})` : ''}</option>
                              ))}
                            </select>
                            <div className="performer-form__identity">
                              <UserRound size={14} aria-hidden="true" />
                              <span>Emp ID: <strong>{entry.userCode || 'Not available'}</strong></span>
                            </div>
                          </div>

                          <div className="performer-form__field performer-form__field--wide">
                            <label htmlFor={`performer-name-${entry.id}`}>Top Performer Display Name</label>
                            <input id={`performer-name-${entry.id}`} value={entry.name || ''} onChange={e => updateTopPerformerEntry(entry.id, 'name', e.target.value)} placeholder="Employee display name" />
                          </div>

                          <div className="performer-form__field performer-form__field--wide">
                            <div className="performer-form__label-row">
                              <label htmlFor={`performer-purpose-${entry.id}`}>Purpose / Achievement Dedication</label>
                              <button
                                type="button"
                                className="performer-form__criteria-add"
                                onClick={() => {
                                  setPurposeTargetEntryId(entry.id);
                                  setNewPurposeInput('');
                                  setShowAddPurposeModal(true);
                                }}
                              >
                                <Plus size={14} aria-hidden="true" /> Add New
                              </button>
                            </div>
                            <select
                              id={`performer-purpose-${entry.id}`}
                              value={entry.purpose || ''}
                              onChange={e => updateTopPerformerEntry(entry.id, 'purpose', e.target.value)}
                            >
                              <option value="">Choose a dedication...</option>
                              {entry.purpose && !(form.topPerformerPurposeOptions || []).includes(entry.purpose) && (
                                <option value={entry.purpose}>{entry.purpose}</option>
                              )}
                              {(form.topPerformerPurposeOptions || []).map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>

                          <div className="performer-form__field">
                            <label htmlFor={`performer-photo-${entry.id}`}>Employee Photo</label>
                            <label className="performer-form__upload" htmlFor={`performer-photo-${entry.id}`}>
                              <ImagePlus size={18} aria-hidden="true" />
                              <span>{entry.photoUrl ? 'Change photo' : 'Choose photo'}</span>
                            </label>
                            <input id={`performer-photo-${entry.id}`} className="performer-form__file-input" type="file" accept="image/*" onChange={e => uploadTopPerformerPhoto(entry.id, e.target.files?.[0])} />
                            <span className="performer-form__hint">Employee profile photo is used automatically. Without one, the 👤 placeholder is shown.</span>
                          </div>

                          <div className="performer-form__field">
                            <label htmlFor={`performer-emoji-${entry.id}`}>Default Badge Emoji</label>
                            <select id={`performer-emoji-${entry.id}`} value={entry.emoji || '⭐'} onChange={e => updateTopPerformerEntry(entry.id, 'emoji', e.target.value)}>
                              <option value="⭐">⭐ Star</option>
                              <option value="🏆">🏆 Trophy</option>
                              <option value="🎖️">🎖️ Medal</option>
                              <option value="👏">👏 Appreciation</option>
                              <option value="💎">💎 Excellence</option>
                            </select>
                          </div>

                          <div className="performer-form__field">
                            <label htmlFor={`performer-award-${entry.id}`}>Professional Award Animation</label>
                            <select
                              id={`performer-award-${entry.id}`}
                              value={[
                                '',
                                performerImage,
                                congratulationsGif,
                                'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2dsbW12YWczbWV1cTR0YnR3Zjc5b3J6eWZ4N3k4bWo5bXNrMzNlbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KY5niCDWQnZg7cD1oK/giphy.gif',
                                'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDdrZTZwNmFsZWk2b3E4aGFjNXM0OXZjM2k2ZTBvNDY3bGwzYTRyaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SSELvbsJ8ok34MSTYq/giphy.gif',
                              ].includes(entry.gifUrl || '') ? (entry.gifUrl || '') : 'custom'}
                              onChange={e => e.target.value !== 'custom' && updateTopPerformerEntry(entry.id, 'gifUrl', e.target.value)}
                            >
                              <option value="">No animation</option>
                              <option value={performerImage}>Professional Top Performer Award</option>
                              <option value={congratulationsGif}>Congratulations Award Animation</option>
                              <option value="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2dsbW12YWczbWV1cTR0YnR3Zjc5b3J6eWZ4N3k4bWo5bXNrMzNlbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KY5niCDWQnZg7cD1oK/giphy.gif">Achievement Celebration</option>
                              <option value="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDdrZTZwNmFsZWk2b3E4aGFjNXM0OXZjM2k2ZTBvNDY3bGwzYTRyaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SSELvbsJ8ok34MSTYq/giphy.gif">Recognition Award</option>
                              <option value="custom">Custom URL</option>
                            </select>
                          </div>

                          <div className="performer-form__field">
                            <label htmlFor={`performer-gif-url-${entry.id}`}>Award Image / GIF URL</label>
                            <input
                              id={`performer-gif-url-${entry.id}`}
                              value={entry.gifUrl || ''}
                              onChange={e => updateTopPerformerEntry(entry.id, 'gifUrl', e.target.value)}
                              placeholder="https://example.com/award.gif"
                            />
                            <span className="performer-form__hint">Paste a direct image or GIF URL.</span>
                          </div>
                        </div>

                      </article>
                    ))
                  )}

                  <div className="performer-builder__preview">
                    <span className="performer-form__preview-label">Live Preview</span>
                    {(form.topPerformerEntries || []).some(entry => entry.userId) ? (
                      <TopPerformerCarousel
                        settings={{
                          enableTopPerformerBanner: true,
                          entries: (form.topPerformerEntries || []).filter(entry => entry.userId),
                        }}
                        performers={[]}
                      />
                    ) : (
                      <div className="performer-form__preview-empty">Select an employee to see the Top Performer preview.</div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <div className="st-form-group" style={{ display: 'none', marginTop: '16px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', padding: '18px', borderRadius: '12px', border: '1.5px solid #f59e0b', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)' }}>
              <label className="st-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, color: '#92400e', fontSize: '1rem' }}>
                <input type="checkbox" checked={form.topPerformerBanner ?? true} onChange={e => set('topPerformerBanner', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#d97706' }} />
                🏆 Enable Top Performer Banner
              </label>
              <p style={{ fontSize: '0.8rem', color: '#b45309', margin: '4px 0 14px 26px', lineHeight: '1.4' }}>
                Add one performer card at a time. Choose criteria, choose employee, add purpose, image and animation, then preview and add the card.
              </p>
              {form.topPerformerBanner && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <label className="st-label" style={{ margin: 0, fontSize: '0.82rem', color: '#78350f', fontWeight: 800 }}>Recognition Criteria / Category</label>
                      <button type="button" onClick={() => setShowAddCriteriaModal(true)} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}>+ Add New Field</button>
                    </div>
                    <select className="st-input" value={form.topPerformerCriteria || 'Monthly'} onChange={e => set('topPerformerCriteria', e.target.value)} style={{ borderColor: '#f59e0b', fontWeight: 700 }}>
                      {(form.topPerformerCriteriaOptions || ['Monthly', 'Weekly', 'Hardworker']).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="st-label" style={{ fontSize: '0.82rem', color: '#78350f', marginBottom: '6px', fontWeight: 800 }}>Select Employee / User</label>
                    <select className="st-input" value={form.topPerformerUserId || ''} onChange={e => {
                      const uid = e.target.value;
                      const found = usersList.find(u => String(u.id) === String(uid));
                      set('topPerformerUserId', uid);
                      set('topPerformerName', found ? (found.fullName || found.userCode || '') : '');
                      set('topPerformerPhotoUrl', found ? (found.profilePhotoUrl || '') : '');
                    }} style={{ borderColor: '#f59e0b', fontWeight: 700 }}>
                      <option value="">Choose employee...</option>
                      {usersList.map(u => <option key={u.id} value={u.id}>{u.fullName || u.userCode || 'Unnamed User'} {u.userCode ? `(${u.userCode})` : ''}</option>)}
                    </select>
                    <div style={{ marginTop: '5px', fontSize: '0.72rem', color: '#92400e' }}>Employee ID: {form.topPerformerUserId || 'Not selected'}</div>
                  </div>
                  <div>
                    <label className="st-label" style={{ fontSize: '0.82rem', color: '#78350f', marginBottom: '6px', fontWeight: 800 }}>Top Performer Display Name</label>
                    <input className="st-input" value={form.topPerformerName || ''} onChange={e => set('topPerformerName', e.target.value)} placeholder="Employee display name" style={{ borderColor: '#f59e0b' }} />
                  </div>
                  <div>
                    <label className="st-label" style={{ fontSize: '0.82rem', color: '#78350f', marginBottom: '6px', fontWeight: 800 }}>Purpose / Achievement Dedication</label>
                    <textarea className="st-input" value={form.topPerformerPurpose || ''} onChange={e => set('topPerformerPurpose', e.target.value)} rows={3} placeholder="Write the appreciation or achievement message..." style={{ borderColor: '#f59e0b', resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label className="st-label" style={{ fontSize: '0.82rem', color: '#78350f', marginBottom: '6px', fontWeight: 800 }}>Upload Photo Option</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('entityType', 'TopPerformer');
                          try {
                            setLoading(true);
                            const token = getAccessToken();
                            const response = await fetch(`${API_BASE}/media/upload`, { method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '' }, body: formData });
                            const result = await response.json();
                            if (result.success && result.data && result.data.url) set('topPerformerPhotoUrl', result.data.url);
                            else alert('Upload failed: ' + (result.message || 'Unknown error'));
                          } catch (err) {
                            alert('Upload failed: ' + err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        style={{ fontSize: '0.8rem' }}
                      />
                      {form.topPerformerPhotoUrl && (
                        <button type="button" onClick={() => set('topPerformerPhotoUrl', '')} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', padding: '6px 10px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}>
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="st-label" style={{ fontSize: '0.82rem', color: '#78350f', marginBottom: '6px', fontWeight: 800 }}>Professional Award Animation</label>
                    <select className="st-input" value={form.topPerformerGifUrl || ''} onChange={e => set('topPerformerGifUrl', e.target.value)} style={{ borderColor: '#f59e0b', fontWeight: 700 }}>
                      <option value="">No Animation</option>
                      <option value="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2dsbW12YWczbWV1cTR0YnR3Zjc5b3J6eWZ4N3k4bWo5bXNrMzNlbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KY5niCDWQnZg7cD1oK/giphy.gif">Professional Achievement Celebration</option>
                      <option value="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDdrZTZwNmFsZWk2b3E4aGFjNXM0OXZjM2k2ZTBvNDY3bGwzYTRyaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SSELvbsJ8ok34MSTYq/giphy.gif">Professional Recognition Award</option>
                      <option value={congratulationsGif}>Congratulations Award Animation</option>
                      <option value={performerImage}>Professional Top Performer Award</option>
                    </select>
                  </div>
                  <div>
                    <label className="st-label" style={{ fontSize: '0.82rem', color: '#78350f', marginBottom: '6px', fontWeight: 800 }}>Live Card Preview</label>
                    <TopPerformerCarousel settings={{ enableTopPerformerBanner: form.topPerformerBanner, userId: form.topPerformerUserId, name: form.topPerformerName, criteria: form.topPerformerCriteria, purpose: form.topPerformerPurpose, photoUrl: form.topPerformerPhotoUrl, gifUrl: form.topPerformerGifUrl, entries: [] }} performers={[]} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={addTopPerformerEntry} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '7px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer' }}>+ Add This Employee Card</button>
                  </div>
                  {(form.topPerformerEntries || []).length > 0 && (
                    <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#7c2d12', marginBottom: '8px' }}>Added Performer Cards ({(form.topPerformerEntries || []).length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(form.topPerformerEntries || []).map(entry => (
                          <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center', background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '7px', padding: '8px' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1f2937' }}>{entry.name || 'Employee Name'} - {entry.criteria || 'Monthly'}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', overflowWrap: 'anywhere' }}>ID: {entry.userId || 'No employee selected'}</div>
                            </div>
                            <button type="button" onClick={() => removeTopPerformerEntry(entry.id)} style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', padding: '5px 9px', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer' }}>Delete</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="st-form-group" style={{ display: 'none', marginTop: '16px', background: 'linear-gradient(135deg, #fffbebf5 0%, #fef3c7f5 100%)', padding: '18px', borderRadius: '12px', border: '1.5px solid #f59e0b', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)' }}>
              <label className="st-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, color: '#92400e', fontSize: '1rem' }}>
                <input
                  type="checkbox"
                  checked={form.topPerformerBanner ?? true}
                  onChange={e => set('topPerformerBanner', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#d97706' }}
                />
                🏆 Enable Top Performer Banner
              </label>
              <p style={{ fontSize: '0.8rem', color: '#b45309', margin: '4px 0 14px 26px', lineHeight: '1.4' }}>
                Show an interactive Top Performer card with user details, recognition criteria, photo, purpose message, and celebration GIF on all dashboards.
              </p>

              {form.topPerformerBanner && (
                <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'none', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.92rem', marginBottom: '4px' }}>
                      Create OP Performer Card
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.76rem', lineHeight: 1.45 }}>
                      Select an employee, choose the recognition criteria, write the purpose, choose media, then add it as a dashboard card.
                    </div>
                  </div>

                  {/* Recognition Criteria Dropdown with + button */}
                  <div className="st-sub-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="st-label" style={{ fontSize: '0.85rem', color: '#78350f', margin: 0, fontWeight: '600' }}>Recognition Criteria / Category</label>
                      <button
                        type="button"
                        onClick={() => setShowAddCriteriaModal(true)}
                        style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)' }}
                        title="Add New Criteria Field (+)"
                      >
                        ➕ Add New Field
                      </button>
                    </div>
                    <select
                      className="st-input"
                      value={form.topPerformerCriteria || 'Monthly'}
                      onChange={e => set('topPerformerCriteria', e.target.value)}
                      style={{ fontSize: '0.88rem', fontWeight: '600', borderColor: '#fcd34d', cursor: 'pointer' }}
                    >
                      {(form.topPerformerCriteriaOptions || ['Monthly', 'Weekly', 'Hardworker']).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Employee Dropdown */}
                  <div className="st-sub-group" style={{ display: 'none' }}>
                    <label className="st-label" style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '6px', fontWeight: '600' }}>Select Employee / User</label>
                    <select
                      className="st-input"
                      value={form.topPerformerUserId || ''}
                      onChange={e => {
                        const uid = e.target.value;
                        set('topPerformerUserId', uid);
                        const found = usersList.find(u => String(u.id) === String(uid));
                        if (found) {
                          set('topPerformerName', found.fullName || found.userCode || '');
                          set('topPerformerPhotoUrl', found.profilePhotoUrl || '');
                        } else {
                          set('topPerformerName', '');
                          set('topPerformerPhotoUrl', '');
                        }
                      }}
                      style={{ fontSize: '0.88rem', borderColor: '#fcd34d', cursor: 'pointer' }}
                    >
                      <option value="">-- Choose User / Employee --</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.userCode || u.role || 'User'})
                        </option>
                      ))}
                    </select>
                    <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#92400e' }}>
                      Selected employee ID: {form.topPerformerUserId || 'Choose an employee to attach the card to a real user.'}
                    </p>
                  </div>

                  {/* Multiple Top Performer Slideshow Employees */}
                  <div className="st-sub-group">
                    <label className="st-label" style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '6px', fontWeight: '600' }}>
                      Slideshow Employees
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '8px',
                      maxHeight: '210px',
                      overflowY: 'auto',
                      padding: '10px',
                      background: '#fff7ed',
                      border: '1px solid #fcd34d',
                      borderRadius: '8px'
                    }}>
                      {usersList.map(u => {
                        const id = String(u.id);
                        return (
                          <label
                            key={u.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px',
                              background: topPerformerUserIds.includes(id) ? '#fef3c7' : '#ffffff',
                              border: `1px solid ${topPerformerUserIds.includes(id) ? '#f59e0b' : '#fed7aa'}`,
                              borderRadius: '7px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              color: '#78350f',
                              fontWeight: topPerformerUserIds.includes(id) ? 700 : 500
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={topPerformerUserIds.includes(id)}
                              onChange={() => toggleTopPerformerUser(id)}
                              style={{ accentColor: '#d97706' }}
                            />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.fullName || u.userCode || 'Unnamed User'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#92400e' }}>
                      Selected employees will rotate on dashboards every 2 seconds with forward and backward buttons.
                    </p>
                  </div>

                  {/* Top Performer Name Input */}
                  <div className="st-sub-group">
                    <label className="st-label" style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '6px', fontWeight: '600' }}>Top Performer Display Name</label>
                    <input
                      className="st-input"
                      value={form.topPerformerName || ''}
                      onChange={e => set('topPerformerName', e.target.value)}
                      placeholder="e.g. Jane Doe"
                      style={{ fontSize: '0.88rem', borderColor: '#fcd34d' }}
                    />
                  </div>

                  {/* Purpose / Achievement Reason */}
                  <div className="st-sub-group">
                    <label className="st-label" style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '6px', fontWeight: '600' }}>Purpose / Achievement Dedication</label>
                    <textarea
                      className="st-input"
                      value={form.topPerformerPurpose || ''}
                      onChange={e => set('topPerformerPurpose', e.target.value)}
                      rows={2}
                      placeholder="e.g. Exceptional hard work, zero defect deliverables, and stellar team collaboration!"
                      style={{ fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit', borderColor: '#fcd34d' }}
                    />
                  </div>

                  <div className="st-sub-group" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ color: '#065f46', fontSize: '0.78rem', lineHeight: '1.45' }}>
                      Build one recognition card per employee and criteria. You can edit each card below after adding it.
                    </div>
                    <button
                      type="button"
                      onClick={addTopPerformerEntry}
                      style={{ background: '#047857', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Add Recognition Card
                    </button>
                  </div>

                  {false && (form.topPerformerEntries || []).length > 0 && (
                    <div className="st-sub-group">
                      <label className="st-label" style={{ fontSize: '0.9rem', color: '#0f172a', marginBottom: '8px', fontWeight: '800' }}>Configured OP Performer Cards</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(form.topPerformerEntries || []).map(entry => (
                          <div key={entry.id} style={{ background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: '10px', padding: '14px', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                              <img
                                src={entry.photoUrl ? (entry.photoUrl.startsWith('http') ? entry.photoUrl : `${API_BASE}${entry.photoUrl.split('#')[0]}`) : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                alt={entry.name || 'OP Performer'}
                                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38bdf8', background: '#f8fafc' }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                                    {entry.name || 'Employee Name'}
                                  </span>
                                  <span style={{ background: '#e0f2fe', color: '#075985', border: '1px solid #7dd3fc', borderRadius: '999px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 900 }}>
                                    {entry.criteria || 'Monthly'}
                                  </span>
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.72rem', overflowWrap: 'anywhere', marginTop: '3px' }}>
                                  Employee ID: {entry.userId || 'No employee ID'}
                                  {entry.userCode ? ` | Code: ${entry.userCode}` : ''}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeTopPerformerEntry(entry.id)}
                                style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                              <div>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155' }}>Criteria for this employee</label>
                                <select
                                  className="st-input"
                                  value={entry.criteria || 'Monthly'}
                                  onChange={e => updateTopPerformerEntry(entry.id, 'criteria', e.target.value)}
                                  style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }}
                                >
                                  {(form.topPerformerCriteriaOptions || ['Monthly', 'Weekly', 'Hardworker']).map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155' }}>Display name</label>
                                <input
                                  className="st-input"
                                  value={entry.name || ''}
                                  onChange={e => updateTopPerformerEntry(entry.id, 'name', e.target.value)}
                                  style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }}
                                />
                              </div>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155', margin: 0 }}>Purpose / Achievement Dedication</label>
                                <button
                                  type="button"
                                  onClick={() => updateTopPerformerEntry(entry.id, 'purpose', '')}
                                  style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                                >
                                  Use Attendance Message
                                </button>
                              </div>
                              <textarea
                                className="st-input"
                                value={entry.purpose || ''}
                                onChange={e => updateTopPerformerEntry(entry.id, 'purpose', e.target.value)}
                                rows={3}
                                placeholder="Write the exact recognition message for this employee."
                                style={{ fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit', borderColor: '#cbd5e1' }}
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                              <div>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155' }}>Profile photo URL</label>
                                <input
                                  className="st-input"
                                  value={entry.photoUrl || ''}
                                  onChange={e => updateTopPerformerEntry(entry.id, 'photoUrl', e.target.value)}
                                  placeholder="Blank uses default avatar"
                                  style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }}
                                />
                              </div>
                              <div>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155' }}>Professional GIF / award URL</label>
                                <input
                                  className="st-input"
                                  value={entry.gifUrl || ''}
                                  onChange={e => updateTopPerformerEntry(entry.id, 'gifUrl', e.target.value)}
                                  placeholder="Blank uses no animation"
                                  style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Photo */}
                  <div className="st-sub-group">
                    <label className="st-label" style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '6px', fontWeight: '600' }}>Upload Photo Option</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                          const file = e.target.files[0];
                          if (!file) return;

                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('entityType', 'TopPerformer');

                          try {
                            setLoading(true);
                            const token = getAccessToken();
                            const response = await fetch(`${API_BASE}/media/upload`, {
                              method: 'POST',
                              headers: {
                                'Authorization': token ? `Bearer ${token}` : ''
                              },
                              body: formData
                            });
                            const result = await response.json();
                            if (result.success && result.data && result.data.url) {
                              set('topPerformerPhotoUrl', result.data.url);
                            } else {
                              alert('Upload failed: ' + (result.message || 'Unknown error'));
                            }
                          } catch (err) {
                            alert('Upload failed: ' + err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        style={{ fontSize: '0.8rem' }}
                      />
                      {form.topPerformerPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => set('topPerformerPhotoUrl', '')}
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          ✕ Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Celebration GIF Selection */}
                  <div className="st-sub-group">
                    <label className="st-label" style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '6px', fontWeight: '600' }}>Professional Award Animation</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <select
                        className="st-input"
                        value={form.topPerformerGifUrl || ''}
                        onChange={e => set('topPerformerGifUrl', e.target.value)}
                        style={{ fontSize: '0.88rem', borderColor: '#fcd34d', cursor: 'pointer' }}
                      >
                        <option value="">No Animation</option>
                        <option value="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2dsbW12YWczbWV1cTR0YnR3Zjc5b3J6eWZ4N3k4bWo5bXNrMzNlbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KY5niCDWQnZg7cD1oK/giphy.gif">Professional Achievement Celebration</option>
                        <option value="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDdrZTZwNmFsZWk2b3E4aGFjNXM0OXZjM2k2ZTBvNDY3bGwzYTRyaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SSELvbsJ8ok34MSTYq/giphy.gif">Professional Recognition Award</option>
                        <option value={congratulationsGif}>Congratulations Award Animation</option>
                        <option value={performerImage}>Professional Top Performer Award</option><option value="custom">Custom GIF URL...</option>
                      </select>

                      {form.topPerformerGifUrl === 'custom' && (
                        <input
                          className="st-input"
                          placeholder="Enter custom GIF URL (https://...)"
                          onChange={e => set('topPerformerGifUrl', e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        />
                      )}
                      {form.topPerformerGifUrl && form.topPerformerGifUrl !== 'custom' && (
                        <div style={{ fontSize: '0.72rem', color: '#92400e', wordBreak: 'break-all' }}>
                          URL: {form.topPerformerGifUrl}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="st-sub-group" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ color: '#166534', fontSize: '0.78rem', lineHeight: '1.45' }}>
                      Finished this employee configuration? Add it as a new OP Performer card. Each add creates one separate performer card.
                    </div>
                    <button
                      type="button"
                      onClick={addTopPerformerEntry}
                      style={{ background: '#047857', color: 'white', border: 'none', borderRadius: '7px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: '900', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Add This Employee Card
                    </button>
                  </div>

                  <div className="st-sub-group" style={{ display: 'none', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>Added OP Performer Cards</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Each card is one employee recognition. Edit or delete saved cards here.</div>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 800 }}>
                        {(form.topPerformerEntries || []).length} cards
                      </div>
                    </div>

                    {(form.topPerformerEntries || []).length === 0 ? (
                      <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '14px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem', background: '#ffffff' }}>
                        No OP Performer cards yet. Fill the employee details above and click Add New OP Card.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(form.topPerformerEntries || []).map(entry => (
                          <div key={entry.id} style={{ background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: '10px', padding: '14px', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                              <img
                                src={entry.photoUrl ? (entry.photoUrl.startsWith('http') ? entry.photoUrl : `${API_BASE}${entry.photoUrl.split('#')[0]}`) : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                alt={entry.name || 'OP Performer'}
                                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38bdf8', background: '#f8fafc' }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>{entry.name || 'Employee Name'}</span>
                                  <span style={{ background: '#e0f2fe', color: '#075985', border: '1px solid #7dd3fc', borderRadius: '999px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 900 }}>{entry.criteria || 'Monthly'}</span>
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.72rem', overflowWrap: 'anywhere', marginTop: '3px' }}>
                                  Employee ID: {entry.userId || 'No employee ID'}{entry.userCode ? ` | Code: ${entry.userCode}` : ''}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeTopPerformerEntry(entry.id)}
                                style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', borderRadius: '6px', padding: '6px 10px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                              <div>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155' }}>Criteria</label>
                                <select className="st-input" value={entry.criteria || 'Monthly'} onChange={e => updateTopPerformerEntry(entry.id, 'criteria', e.target.value)} style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }}>
                                  {(form.topPerformerCriteriaOptions || ['Monthly', 'Weekly', 'Hardworker']).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155' }}>Display name</label>
                                <input className="st-input" value={entry.name || ''} onChange={e => updateTopPerformerEntry(entry.id, 'name', e.target.value)} style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }} />
                              </div>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155', margin: 0 }}>Purpose / Achievement Dedication</label>
                                <button type="button" onClick={() => updateTopPerformerEntry(entry.id, 'purpose', '')} style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}>
                                  Use Attendance Message
                                </button>
                              </div>
                              <textarea className="st-input" value={entry.purpose || ''} onChange={e => updateTopPerformerEntry(entry.id, 'purpose', e.target.value)} rows={3} placeholder="Write the recognition message for this employee." style={{ fontSize: '0.82rem', resize: 'vertical', fontFamily: 'inherit', borderColor: '#cbd5e1' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                              <div>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155' }}>Profile photo URL</label>
                                <input className="st-input" value={entry.photoUrl || ''} onChange={e => updateTopPerformerEntry(entry.id, 'photoUrl', e.target.value)} placeholder="Blank uses default avatar" style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }} />
                              </div>
                              <div>
                                <label className="st-label" style={{ fontSize: '0.76rem', color: '#334155' }}>Professional GIF / award URL</label>
                                <input className="st-input" value={entry.gifUrl || ''} onChange={e => updateTopPerformerEntry(entry.id, 'gifUrl', e.target.value)} placeholder="Blank uses no animation" style={{ fontSize: '0.82rem', borderColor: '#cbd5e1' }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live Top Performer Preview Box */}
                  <div style={{ marginTop: '10px' }}>
                    <label className="st-label" style={{ fontSize: '0.82rem', marginBottom: '6px', color: '#78350f' }}>Live Card Preview</label>
                    <div style={{ maxWidth: '100%' }}>
                      <TopPerformerCarousel
                        settings={{
                          enableTopPerformerBanner: form.topPerformerBanner,
                          userId: form.topPerformerUserId,
                          name: form.topPerformerName,
                          criteria: form.topPerformerCriteria,
                          purpose: form.topPerformerPurpose,
                          photoUrl: form.topPerformerPhotoUrl,
                          gifUrl: form.topPerformerGifUrl,
                          entries: [],
                        }}
                        performers={[]}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={addTopPerformerEntry}
                        style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '7px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)' }}
                      >
                        + Add This Employee Card
                      </button>
                    </div>
                    {(form.topPerformerEntries || []).length > 0 && (
                      <div style={{ marginTop: '12px', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#7c2d12', marginBottom: '8px' }}>
                          Added Performer Cards ({(form.topPerformerEntries || []).length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(form.topPerformerEntries || []).map(entry => (
                            <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center', background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '7px', padding: '8px' }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#1f2937' }}>
                                  {entry.name || 'Employee Name'} - {entry.criteria || 'Monthly'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', overflowWrap: 'anywhere' }}>
                                  ID: {entry.userId || 'No employee selected'}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeTopPerformerEntry(entry.id)}
                                style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', padding: '5px 9px', fontSize: '0.72rem', fontWeight: 900, cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="top-performer-card-preview" style={{
                      display: 'none',
                      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                      borderRadius: '14px',
                      padding: '16px',
                      color: 'white',
                      boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
                      border: '2px solid #38bdf8',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.15)',
                        paddingBottom: '10px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.4rem' }}>🏆</span>
                          <span style={{
                            background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                            color: '#0f172a',
                            fontWeight: '800',
                            fontSize: '0.75rem',
                            padding: '3px 10px',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Top Performer — {form.topPerformerCriteria || 'Monthly'}
                          </span>
                        </div>
                        {form.topPerformerGifUrl && form.topPerformerGifUrl !== 'custom' && (
                          <img
                            src={form.topPerformerGifUrl}
                            alt="GIF animation"
                            style={{ height: '75px', maxWidth: '140px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid rgba(245, 158, 11, 0.6)' }}
                            onError={e => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img
                            src={form.topPerformerPhotoUrl ? (form.topPerformerPhotoUrl.startsWith('http') ? form.topPerformerPhotoUrl : `${API_BASE}${form.topPerformerPhotoUrl.split('#')[0]}`) : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                            alt="Top Performer Avatar"
                            style={{
                              width: '110px',
                              height: '110px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '4px solid #38bdf8',
                              boxShadow: '0 0 20px rgba(245, 158, 11, 0.7)'
                            }}
                          />
                          <span style={{ position: 'absolute', bottom: '0px', right: '0px', fontSize: '1.6rem' }}>⭐</span>
                        </div>

                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.45rem', fontWeight: '800', color: '#fef08a' }}>
                            {form.topPerformerName || 'Employee Name'}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: '#e0e7ff', lineHeight: '1.5', fontStyle: form.topPerformerPurpose ? 'normal' : 'italic' }}>
                            {form.topPerformerPurpose || 'Purpose / achievement message will appear here.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* ── Theme Colors ── */}
          <div className="st-card">
            <h3 className="st-card-title">🎨 Theme Colors</h3>

            <div className="st-form-group">
              <label className="st-label">Primary Color</label>
              <div className="st-color-row">
                <input
                  type="color"
                  className="st-color-picker"
                  value={form.primaryColor}
                  onChange={e => set('primaryColor', e.target.value)}
                />
                <input
                  className="st-input"
                  value={form.primaryColor}
                  onChange={e => set('primaryColor', e.target.value)}
                />
              </div>
            </div>

            <div className="st-form-group">
              <label className="st-label">Secondary Color</label>
              <div className="st-color-row">
                <input
                  type="color"
                  className="st-color-picker"
                  value={form.secondaryColor}
                  onChange={e => set('secondaryColor', e.target.value)}
                />
                <input
                  className="st-input"
                  value={form.secondaryColor}
                  onChange={e => set('secondaryColor', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── System Settings ── */}
          <div className="st-card">
            <h3 className="st-card-title">🖥️ System Settings</h3>

            <div className="st-form-group">
              <label className="st-label">Session Timeout (minutes)</label>
              <input
                className="st-input"
                type="number"
                min="1"
                value={form.sessionTimeout}
                onChange={e => set('sessionTimeout', e.target.value)}
              />
              <p className="st-hint">Default 480 minutes (8 hours)</p>
            </div>

            <div className="st-form-group">
              <label className="st-label">Max File Upload Size (MB)</label>
              <input
                className="st-input"
                type="number"
                min="1"
                value={form.maxFileSize}
                onChange={e => set('maxFileSize', e.target.value)}
              />
            </div>

            <div className="st-form-group">
              <label className="st-label">Allowed File Types</label>
              <input
                className="st-input"
                value={form.allowedTypes}
                onChange={e => set('allowedTypes', e.target.value)}
              />
              <p className="st-hint">Comma-separated list of file extensions</p>
            </div>
          </div>

        </div>{/* end left col */}

        {/* ══════════════════════════════════
            RIGHT COLUMN
        ══════════════════════════════════ */}
        <div className="st-col">

          {/* ── Company Information ── */}
          <div className="st-card">
            <h3 className="st-card-title">🏢 Company Information</h3>

            <div className="st-form-group">
              <label className="st-label">Company Name <span className="st-req">*</span></label>
              <input className="st-input" value={form.companyName}
                onChange={e => set('companyName', e.target.value)} />
            </div>

            <div className="st-form-group">
              <label className="st-label">Street Address</label>
              <input className="st-input" value={form.streetAddress}
                onChange={e => set('streetAddress', e.target.value)} />
            </div>

            <div className="st-form-row">
              <div className="st-form-group">
                <label className="st-label">City</label>
                <input className="st-input" value={form.city}
                  onChange={e => set('city', e.target.value)} />
              </div>
              <div className="st-form-group">
                <label className="st-label">State / Province</label>
                <input className="st-input" value={form.stateProvince}
                  onChange={e => set('stateProvince', e.target.value)} />
              </div>
            </div>

            <div className="st-form-row">
              <div className="st-form-group">
                <label className="st-label">Zip / Postal Code</label>
                <input className="st-input" value={form.zipCode}
                  onChange={e => set('zipCode', e.target.value)} />
              </div>
              <div className="st-form-group">
                <label className="st-label">Country</label>
                <input className="st-input" value={form.country}
                  onChange={e => set('country', e.target.value)} />
              </div>
            </div>

            <div className="st-form-group">
              <label className="st-label">Company Location (Legacy)</label>
              <input className="st-input" value={form.companyLocation}
                onChange={e => set('companyLocation', e.target.value)} />
              <p className="st-hint">
                This field is kept for backward compatibility. Use the address fields above for detailed information.
              </p>
            </div>

            <div className="st-form-row">
              <div className="st-form-group">
                <label className="st-label">Phone Number</label>
                <input className="st-input" value={form.phone}
                  onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="st-form-group">
                <label className="st-label">Email Address</label>
                <input className="st-input" value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Feature Toggles ── */}
          <div className="st-card">
            <h3 className="st-card-title">🔧 Feature Toggles</h3>

            <div className="st-toggle-item">
              <div className="st-toggle-info">
                <label className="st-toggle-label">
                  <input
                    type="checkbox"
                    className="st-checkbox"
                    checked={form.topPerformerBanner}
                    onChange={e => set('topPerformerBanner', e.target.checked)}
                  />
                  Enable Top Performer Banner
                </label>
                <p className="st-hint">Show top performers carousel on the login page.</p>
              </div>
            </div>
          </div>

        </div>{/* end right col */}

      </div>{/* end grid */}

      {/* ── Quotes Modal ── */}
      {showQuotes && (
        <QuoteModal
          quotes={form.loginQuotes}
          onClose={() => setShowQuotes(false)}
          onSave={(updated) => set('loginQuotes', updated)}
        />
      )}

      {/* ── Add Criteria Modal (+) ── */}
      {showAddCriteriaModal && (
        <Modal onClose={() => setShowAddCriteriaModal(false)}>
          <h2 className="st-modal-title">➕ Add New Criteria Field</h2>
          <p className="st-modal-sub">Create a custom recognition category for top performers (e.g. Quarterly MVP, Star Developer).</p>

          <div className="st-form-group" style={{ marginTop: '14px' }}>
            <label className="st-label">Criteria Name</label>
            <input
              className="st-input"
              placeholder="e.g. Quarterly MVP, Star Developer, Best Team Player..."
              value={newCriteriaInput}
              onChange={e => setNewCriteriaInput(e.target.value)}
              autoFocus
            />
          </div>

          <div className="st-modal-actions" style={{ marginTop: '20px' }}>
            <button className="st-btn-cancel" onClick={() => setShowAddCriteriaModal(false)}>Cancel</button>
            <button
              className="st-btn-primary"
              onClick={() => {
                if (newCriteriaInput.trim()) {
                  const newOpt = newCriteriaInput.trim();
                  const currentOpts = form.topPerformerCriteriaOptions || ['Monthly', 'Weekly', 'Hardworker'];
                  if (!currentOpts.includes(newOpt)) {
                    const updatedOpts = [...currentOpts, newOpt];
                    set('topPerformerCriteriaOptions', updatedOpts);
                  }
                  if (criteriaTargetEntryId) {
                    updateTopPerformerEntry(criteriaTargetEntryId, 'criteria', newOpt);
                  } else {
                    set('topPerformerCriteria', newOpt);
                  }
                  setNewCriteriaInput('');
                  setCriteriaTargetEntryId(null);
                  setShowAddCriteriaModal(false);
                }
              }}
            >
              Save & Select Field
            </button>
          </div>
        </Modal>
      )}

      {showAddPurposeModal && (
        <Modal onClose={() => {
          setShowAddPurposeModal(false);
          setPurposeTargetEntryId(null);
          setNewPurposeInput('');
        }}>
          <h2 className="st-modal-title">Add Achievement Dedication</h2>
          <p className="st-modal-sub">Write the recognition message for this employee card.</p>

          <div className="st-form-group" style={{ marginTop: '14px' }}>
            <label className="st-label" htmlFor="new-performer-purpose">Purpose / Achievement Dedication</label>
            <textarea
              id="new-performer-purpose"
              className="st-input"
              rows={5}
              placeholder="Describe the employee's achievement, contribution, or dedication..."
              value={newPurposeInput}
              onChange={e => setNewPurposeInput(e.target.value)}
              autoFocus
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div className="st-modal-actions" style={{ marginTop: '20px' }}>
            <button
              className="st-btn-cancel"
              onClick={() => {
                setShowAddPurposeModal(false);
                setPurposeTargetEntryId(null);
                setNewPurposeInput('');
              }}
            >
              Cancel
            </button>
            <button
              className="st-btn-primary"
              disabled={!newPurposeInput.trim()}
              onClick={() => {
                if (!newPurposeInput.trim() || !purposeTargetEntryId) return;
                const purpose = newPurposeInput.trim();
                setForm(previous => ({
                  ...previous,
                  topPerformerPurposeOptions: (previous.topPerformerPurposeOptions || []).includes(purpose)
                    ? previous.topPerformerPurposeOptions
                    : [...(previous.topPerformerPurposeOptions || []), purpose],
                  topPerformerEntries: (previous.topPerformerEntries || []).map(entry => (
                    entry.id === purposeTargetEntryId ? { ...entry, purpose } : entry
                  )),
                }));
                setShowAddPurposeModal(false);
                setPurposeTargetEntryId(null);
                setNewPurposeInput('');
              }}
            >
              Save Dedication
            </button>
          </div>
        </Modal>
      )}

      {/* Lightbox Modal Overlay */}
      {lightboxImg && (
        <div className="celebration-lightbox" onClick={closeLightbox}>
          <button className="lightbox-close-btn" onClick={closeLightbox} title="Close (Esc)">
            ✕
          </button>

          <div className="lightbox-content-box" onClick={(e) => e.stopPropagation()}>
            <div
              className="lightbox-img-wrapper"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
              }}
            >
              <img
                src={lightboxImg}
                alt="Celebration Enlarged"
                className="lightbox-img-element"
              />
            </div>
          </div>

          {/* Controls Panel */}
          <div className="lightbox-controls-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-ctrl-btn"
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}
              disabled={zoomLevel <= 1}
              title="Zoom Out"
            >
              ➖
            </button>
            <span className="lightbox-info-tag">{Math.round(zoomLevel * 100)}%</span>
            <button
              className="lightbox-ctrl-btn"
              onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
              disabled={zoomLevel >= 3}
              title="Zoom In"
            >
              ➕
            </button>
            <div className="lightbox-ctrl-divider" />
            <button
              className="lightbox-ctrl-btn"
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              title="Rotate 90° Clockwise"
            >
              🔄
            </button>
            <div className="lightbox-ctrl-divider" />
            <button
              className="lightbox-ctrl-btn"
              onClick={() => {
                setZoomLevel(1);
                setRotation(0);
              }}
              title="Reset Adjustments"
            >
              ↩️
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default Setting;

