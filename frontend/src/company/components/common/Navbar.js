import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandMark from './BrandMark';
import './Navbar.css';

const SERVICES_NAV = [
  { slug: 'epub', icon: '📄', label: 'ePub Conversion', desc: 'Standards-compliant ePub 2 and 3 production.', color: 'color-blue' },
  { slug: 'xml', icon: '🏷️', label: 'XML Tagging', desc: 'JATS, BITS, DTBook and custom structured content.', color: 'color-teal' },
  { slug: 'web', icon: '🌐', label: 'Web Development', desc: 'Accessible websites and custom web applications.', color: 'color-sky' },
  { slug: 'automation', icon: '⚙️', label: 'Automation', desc: 'Workflow automation, integrations and RPA systems.', color: 'color-amber' },
  { slug: 'data-entry', icon: '📊', label: 'Data Entry', desc: 'Validated high-volume digitisation and indexing.', color: 'color-coral' },
  { slug: 'marketing', icon: '📣', label: 'Digital Marketing', desc: 'SEO, paid acquisition and analytics-led growth.', color: 'color-purple' },
  { slug: 'stm-hss', icon: '📚', label: 'STM/HSS Publishing', desc: 'Scholarly XML, composition and editorial production.', color: 'color-navy-blue' },
  { slug: 'college-textbooks', icon: '📖', label: 'College Textbooks', desc: 'Accessible, interactive educational publishing.', color: 'color-emerald' },
  { slug: 'publishing-services', icon: '✍️', label: 'Book Publishing', desc: 'Editing, design, conversion and distribution support.', color: 'color-indigo' },
];

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const servicesItemRef = useRef(null);
  const hamburgerRef = useRef(null);
  const mobileNavRef = useRef(null);
  const location = useLocation();

  const closeMenus = useCallback(() => {
    setIsDesktopMenuOpen(false);
    setIsMobileServicesOpen(false);
    setIsMobileOpen(false);
  }, []);

  useEffect(() => {
    closeMenus();
  }, [location.pathname, closeMenus]);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setIsScrolled(window.scrollY > 16);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 992) {
        setIsMobileOpen(false);
        setIsMobileServicesOpen(false);
      } else {
        setIsDesktopMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isDesktopMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (!servicesItemRef.current?.contains(event.target)) setIsDesktopMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDesktopMenuOpen(false);
        servicesItemRef.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isDesktopMenuOpen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (!isMobileOpen) return undefined;

    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => mobileNavRef.current?.querySelector('a, button')?.focus());

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setIsMobileOpen(false);
      window.requestAnimationFrame(() => hamburgerRef.current?.focus());
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  const toggleMobile = () => {
    setIsMobileOpen((open) => !open);
    setIsDesktopMenuOpen(false);
  };

  return (
    <header className={`navbar ${isScrolled ? 'navbar--scrolled' : ''} ${isMobileOpen ? 'navbar--mobile-open' : ''}`}>
      <div className="container navbar__container">
        <Link to="/" className="navbar__logo" aria-label="Arrow Data Tech home" onClick={closeMenus}>
          <BrandMark />
        </Link>

        <nav className="navbar__desktop" aria-label="Primary navigation">
          <ul className="navbar__links">
            <li><NavLink to="/" end className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>Home</NavLink></li>
            <li className="navbar__item--dropdown" ref={servicesItemRef}>
              <div className="navbar__services-trigger">
                <NavLink to="/services" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>Services</NavLink>
                <button
                  type="button"
                  className="navbar__dropdown-toggle"
                  aria-label="Toggle services menu"
                  aria-haspopup="true"
                  aria-expanded={isDesktopMenuOpen}
                  aria-controls="desktop-services-menu"
                  onClick={() => setIsDesktopMenuOpen((open) => !open)}
                >
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                    <path d="m1 1.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div
                id="desktop-services-menu"
                className={`navbar__dropdown-menu ${isDesktopMenuOpen ? 'navbar__dropdown-menu--open' : ''}`}
                aria-hidden={!isDesktopMenuOpen}
              >
                <div className="navbar__dropdown-header">
                  <div>
                    <p className="navbar__dropdown-eyebrow">Capabilities</p>
                    <p className="navbar__dropdown-heading">Digital production and transformation</p>
                  </div>
                  <Link to="/services" className="navbar__dropdown-all" onClick={closeMenus}>View all services →</Link>
                </div>
                <div className="navbar__dropdown-grid">
                  {SERVICES_NAV.map((service) => (
                    <Link key={service.slug} to={`/services/${service.slug}`} className="navbar__dropdown-item" onClick={closeMenus}>
                      <span className={`navbar__dropdown-item-icon ${service.color}`} aria-hidden="true">{service.icon}</span>
                      <span>
                        <span className="navbar__dropdown-item-title">{service.label}</span>
                        <span className="navbar__dropdown-item-desc">{service.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </li>
            <li><NavLink to="/about" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>About</NavLink></li>
            <li><NavLink to="/careers" className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}>Careers</NavLink></li>
          </ul>
        </nav>

        <div className="navbar__actions">
          <Link to="/contact" className="btn-primary-navbar">Get a quote <span aria-hidden="true">→</span></Link>
        </div>

        <button
          ref={hamburgerRef}
          type="button"
          className={`navbar__hamburger ${isMobileOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={toggleMobile}
          aria-label={isMobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-navigation"
        >
          <span /><span /><span />
        </button>
      </div>

      <nav
        ref={mobileNavRef}
        id="mobile-navigation"
        className={`navbar__mobile-drawer ${isMobileOpen ? 'navbar__mobile-drawer--open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!isMobileOpen}
      >
        <div className="container navbar__mobile-inner">
          <ul className="navbar__mobile-links">
            <li><NavLink to="/" end className="navbar__mobile-link" onClick={closeMenus}>Home</NavLink></li>
            <li>
              <div className="navbar__mobile-services-row">
                <NavLink to="/services" className="navbar__mobile-link" onClick={closeMenus}>Services</NavLink>
                <button
                  type="button"
                  className="navbar__mobile-services-toggle"
                  aria-label="Toggle service links"
                  aria-expanded={isMobileServicesOpen}
                  aria-controls="mobile-services-menu"
                  onClick={() => setIsMobileServicesOpen((open) => !open)}
                >
                  <span aria-hidden="true">⌄</span>
                </button>
              </div>
              <ul id="mobile-services-menu" className={`navbar__mobile-submenu ${isMobileServicesOpen ? 'navbar__mobile-submenu--open' : ''}`}>
                {SERVICES_NAV.map((service) => (
                  <li key={service.slug}><Link to={`/services/${service.slug}`} onClick={closeMenus}>{service.label}</Link></li>
                ))}
              </ul>
            </li>
            <li><NavLink to="/about" className="navbar__mobile-link" onClick={closeMenus}>About Us</NavLink></li>
            <li><NavLink to="/careers" className="navbar__mobile-link" onClick={closeMenus}>Careers</NavLink></li>
          </ul>
          <Link to="/contact" className="btn-primary-navbar btn-block" onClick={closeMenus}>Get a free quote</Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

