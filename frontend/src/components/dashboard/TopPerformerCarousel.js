import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../utils/api';
import './TopPerformerCarousel.css';

const FALLBACK_GIF = 'https://media.giphy.com/media/26tOZbfHHHJB92VU4/giphy.gif';

const resolveMediaUrl = (url, fallback = '') => {
  if (!url) return fallback;
  const cleanUrl = url.split('#')[0];
  if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:') || cleanUrl.startsWith('/static')) {
    return cleanUrl;
  }
  return `${API_BASE}${cleanUrl}`;
};

const TopPerformerCarousel = ({ settings, performers = [], onPhotoClick }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoError, setPhotoError] = useState(false);

  const slides = useMemo(() => {
    if (Array.isArray(settings?.entries) && settings.entries.length > 0) {
      return settings.entries.map(entry => ({
        id: entry.id || entry.userId || `${entry.name}-${entry.criteria}`,
        userId: entry.userId || '',
        userCode: entry.userCode || '',
        name: entry.name || 'Employee Name',
        role: entry.role || entry.userCode || '',
        criteria: entry.criteria || settings?.criteria || 'Monthly',
        purpose: entry.purpose || settings?.purpose || '',
        photoUrl: entry.photoUrl || '',
        gifUrl: entry.gifUrl || settings?.gifUrl || '',
        emoji: entry.emoji || '⭐',
      }));
    }

    const list = Array.isArray(performers) ? performers.filter(Boolean) : [];
    if (list.length > 0) {
      return list.map(person => ({
        id: person.id || person.userId || person.email || person.fullName,
        userId: person.id || person.userId || '',
        userCode: person.userCode || '',
        name: person.fullName || person.name || person.userCode || settings?.name || 'Employee Name',
        role: person.role || person.userCode || '',
        criteria: settings?.criteria || 'Monthly',
        purpose: settings?.purpose || '',
        photoUrl: person.profilePhotoUrl || person.photoUrl || settings?.photoUrl || '',
        gifUrl: settings?.gifUrl || '',
        emoji: settings?.emoji || '⭐',
      }));
    }

    if (!settings?.name) return [];
    return [{
      id: settings.name,
      userId: settings.userId || '',
      userCode: settings.userCode || '',
      name: settings.name,
      role: '',
      criteria: settings.criteria || 'Monthly',
      purpose: settings.purpose || '',
      photoUrl: settings.photoUrl || '',
      gifUrl: settings.gifUrl || '',
      emoji: settings.emoji || '⭐',
    }];
  }, [performers, settings]);

  const totalSlides = slides.length;
  const hasMultiple = totalSlides > 1;
  const activeSlide = slides[activeIndex] || slides[0];

  useEffect(() => {
    if (activeIndex >= totalSlides) {
      setActiveIndex(0);
    }
  }, [activeIndex, totalSlides]);

  useEffect(() => {
    if (!hasMultiple) return undefined;
    const timer = setInterval(() => {
      setActiveIndex(index => (index + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(timer);
  }, [hasMultiple, totalSlides]);

  useEffect(() => {
    setPhotoError(false);
  }, [activeSlide?.id, activeSlide?.photoUrl]);

  if (!settings?.enableTopPerformerBanner || !activeSlide) return null;

  const goToPrevious = () => {
    setActiveIndex(index => (index - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setActiveIndex(index => (index + 1) % totalSlides);
  };

  const photoSrc = resolveMediaUrl(activeSlide.photoUrl);
  const gifSrc = activeSlide.gifUrl
    ? (activeSlide.gifUrl.startsWith('http') || activeSlide.gifUrl.startsWith('data:') || activeSlide.gifUrl.startsWith('/static')
      ? activeSlide.gifUrl
      : FALLBACK_GIF)
    : '';

  return (
    <div className="top-performer-card">
      <div className="top-performer-header">
        <div className="top-performer-tag">
          <span className="trophy-icon" aria-hidden="true">🏆</span>
          <span className="top-performer-tag-text">
            <span className="top-performer-tag-title">Top Performer</span>
            <span className="top-performer-tag-criteria">{activeSlide.criteria || 'Monthly'}</span>
          </span>
        </div>
        {hasMultiple && (
          <div className="top-performer-slide-count">
            {activeIndex + 1}/{totalSlides}
          </div>
        )}
      </div>

      <div className="top-performer-body top-performer-carousel-body">
        {hasMultiple && (
          <button
            type="button"
            className="top-performer-nav top-performer-nav-left"
            onClick={goToPrevious}
            aria-label="Previous top performer"
            title="Previous"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="top-performer-profile-panel">
          <div className="top-performer-avatar-wrapper">
            {photoSrc && !photoError ? (
              <img
                src={photoSrc}
                alt={activeSlide.name}
                className="top-performer-avatar"
                onError={() => setPhotoError(true)}
                onClick={() => onPhotoClick?.(photoSrc)}
              />
            ) : (
              <div className="top-performer-avatar top-performer-avatar--emoji" role="img" aria-label="Default employee profile">
                👤
              </div>
            )}
            <span className="star-badge" aria-hidden="true">{activeSlide.emoji || '⭐'}</span>
          </div>
          <h4 className="top-performer-name">{activeSlide.name}</h4>
          {activeSlide.role && <p className="top-performer-role">{activeSlide.role}</p>}
          {activeSlide.userCode && (
            <p className="top-performer-employee-id">Emp ID: {activeSlide.userCode}</p>
          )}
        </div>

        <div className="top-performer-info">
          <p className="top-performer-purpose">
            {activeSlide.purpose || 'Outstanding contribution and consistent performance.'}
          </p>
        </div>

        {gifSrc && (
          <div className="top-performer-award-panel">
            <img
              src={gifSrc}
              alt="Celebration"
              className="top-performer-gif"
            />
          </div>
        )}

        {hasMultiple && (
          <button
            type="button"
            className="top-performer-nav top-performer-nav-right"
            onClick={goToNext}
            aria-label="Next top performer"
            title="Next"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TopPerformerCarousel;
