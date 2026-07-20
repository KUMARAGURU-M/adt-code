// src/pages/admin/Setting.js

import React, { useState, useEffect } from 'react';
import './Setting.css';
import { apiCall, API_BASE, getAccessToken } from '../../utils/api';

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

  /* System */
  sessionTimeout: 479,
  maxFileSize: 10,
  allowedTypes: 'jpg,jpeg,png,pdf,doc,docx',
  announcement: '',
  isCelebration: false,
  celebrationText: '',
  celebrationPhotoUrl: '',
};

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
    const fetchSettings = async () => {
      try {
        const data = await apiCall('/settings');
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
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Load daily Kural preview when enabled
    if (form.enableThirukkural) {
      fetch('https://tamil-kural-api.vercel.app/api/daily')
        .then(res => res.json())
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
      };

      await apiCall('/settings', 'PUT', payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings: ' + err.message);
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
                        குறள் {thirukkuralPreview.number} - {thirukkuralPreview.chapter} ({thirukkuralPreview.section})
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

