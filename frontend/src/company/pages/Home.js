import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { useScrollReveal } from '../hooks/useScrollReveal';
import ImpactNumber from '../components/home/ImpactNumber';

/* ── Data ─────────────────────────────────────────────────── */
const SERVICES = [
  { icon: '📄', color: 'rgba(233,46,104,0.10)', name: 'ePub Conversion', desc: 'Transform print-ready manuscripts, PDFs, and Word documents into polished, standards-compliant ePub 2 & 3 files ready for every major platform.' },
  { icon: '🏷️', color: 'rgba(8,175,196,0.10)', name: 'XML Tagging', desc: 'Precision XML/SGML tagging for publishers, STM journals, and enterprises — JATS, BITS, DTBook, and custom schemas at scale.' },
  { icon: '🌐', color: 'rgba(8,175,196,0.12)', name: 'Web Development', desc: 'Fast, accessible, and beautifully engineered websites and web apps built with modern stacks — React, Next.js, Node, and headless CMS.' },
  { icon: '⚙️', color: 'rgba(127,135,141,0.12)', name: 'Automation', desc: 'Eliminate repetitive workflows with custom scripts, RPA bots, and API integrations that save thousands of hours annually.' },
  { icon: '📊', color: 'rgba(201,31,87,0.10)', name: 'Data Entry', desc: 'High-accuracy, high-volume data entry and digitisation services — structured, validated, and delivered in any format you need.' },
  { icon: '📣', color: 'rgba(107, 114, 128,0.12)', name: 'Digital Marketing', desc: 'SEO, paid media, content strategy, and performance analytics that grow your digital footprint and convert visitors into customers.' },
];

const CLIENTS = [
  { name: 'Elsevier', logo: '/image/publisher/elsevier.svg', className: 'publisher-logo--elsevier' },
  { name: 'Wiley', logo: '/image/publisher/wiley.svg', className: 'publisher-logo--wiley' },
  { name: 'Springer Nature', logo: '/image/publisher/springer-nature.svg', className: 'publisher-logo--springer' },
  { name: 'Oxford University Press', logo: '/image/publisher/oxford-university-press.svg', className: 'publisher-logo--oxford' },
  { name: 'McGraw Hill', logo: '/image/publisher/mcgraw-hill.svg', className: 'publisher-logo--mcgraw' },
  { name: 'Pearson', logo: '/image/publisher/pearson.svg', className: 'publisher-logo--pearson' },
  { name: 'Taylor & Francis', logo: '/image/publisher/taylor-francis.svg', className: 'publisher-logo--taylor' },
  { name: 'SAGE Publishing', logo: '/image/publisher/sage.svg', className: 'publisher-logo--sage' },
];

const WORK = [
  { wide: true, tag: 'Publishing · ePub', name: 'Global STM Publisher — 50,000 Articles Converted', desc: 'End-to-end JATS XML tagging and ePub 3 production pipeline for a Tier-1 scientific journal portfolio, reducing time-to-publish by 60%.', gradient: 'linear-gradient(135deg,#161E27 0%,#E92E68 100%)', accent: '#08AFC4', tags: ['ePub 3', 'JATS XML', 'Automation', 'Python'] },
  { tag: 'E-commerce · Web', name: 'RetailBrand — Next-Gen Storefront', desc: 'Headless commerce build on Next.js + Shopify, boosting conversion by 38% in the first quarter post-launch.', gradient: 'linear-gradient(135deg,#006f7c 0%,#08AFC4 100%)', accent: '#08AFC4', tags: ['Next.js', 'Shopify', 'UI/UX'] },
  { tag: 'Logistics · Automation', name: 'FreightCo — Invoice Processing Bot', desc: 'RPA + ML pipeline that classifies and processes 12,000 invoices/day with 99.4% accuracy, replacing a 14-person data entry team.', gradient: 'linear-gradient(135deg,#2C1A3A 0%,#6B7280 100%)', accent: '#6B7280', tags: ['RPA', 'Python', 'ML', 'API'] },
];

const TESTIMONIALS = [
  { stars: 5, quote: 'Their XML tagging accuracy is the best we\'ve encountered across five vendors. Zero re-work, tight deadlines met every time.', name: 'Sarah Chen', role: 'Production Director, Lumina Data Matics', initials: 'SC', color: '#E92E68' },
  { stars: 5, quote: 'The automation team cut our data processing time from 3 days to 4 hours. ROI was achieved within the first month.', name: 'Rajiv Menon', role: 'COO, High Horse Technology and Solutions', initials: 'RM', color: '#08AFC4' },
  { stars: 5, quote: 'Exceptional ePub conversion quality. Our titles went from 12% to under 1% reader complaints on formatting issues.', name: 'Emma Walters', role: 'Digital Publishing Lead, CodeMantra Technology', initials: 'EW', color: '#6B7280' },
];

/* ── PIPELINE steps ─────────────────────────────────────── */
const PIPELINE = [
  { icon: '📥', label: 'Upload', done: true, active: false },
  { icon: '🏷️', label: 'XML Tag', done: true, active: false },
  { icon: '📄', label: 'ePub Build', done: false, active: true },
  { icon: '✅', label: 'QA Check', done: false, active: false },
  { icon: '🚀', label: 'Deliver', done: false, active: false },
];

/* ── LEFT tool cards ────────────────────────────────────── */
const LEFT_CARDS = [
  {
    cls: 'tool-card--epub',
    delay: '0s',
    iconBg: 'rgba(233,46,104,0.10)',
    iconStroke: '#E92E68',
    iconPath: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
    label: 'ePub Conversion',
    sub: 'PDF → ePub 2 & 3',
    type: 'flow',
    flowFrom: 'PDF', flowTo: 'ePub 3', arrowColor: '#E92E68', activeColor: '#E92E68',
  },
  {
    cls: 'tool-card--xml',
    delay: '0.15s',
    iconBg: 'rgba(8,175,196,0.10)',
    iconStroke: '#08AFC4',
    iconPath: (
      <>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </>
    ),
    label: 'XML Tagging',
    sub: 'JATS · BITS · DTBook',
    type: 'tags',
    tags: [
      { text: '<article>', color: '#08AFC4', bg: 'rgba(8,175,196,0.10)' },
      { text: '<sec>', color: '#E92E68', bg: 'rgba(233,46,104,0.10)' },
      { text: '<ref>', color: '#6B7280', bg: 'rgba(107, 114, 128,0.10)' },
    ],
  },
  {
    cls: 'tool-card--data',
    delay: '0.3s',
    iconBg: 'rgba(127,135,141,0.12)',
    iconStroke: '#7F878D',
    iconPath: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </>
    ),
    label: 'Data Entry',
    sub: '99.4% accuracy',
    type: 'bar',
    barWidth: '99%', barGradient: 'linear-gradient(90deg,#7F878D,#C91F57)',
  },
];

/* ── RIGHT tool cards ───────────────────────────────────── */
const RIGHT_CARDS = [
  {
    cls: 'tool-card--auto',
    delay: '0.1s',
    iconBg: 'rgba(107, 114, 128,0.12)',
    iconStroke: '#6B7280',
    iconPath: (
      <>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </>
    ),
    label: 'Automation',
    sub: 'RPA · API · Scripts',
    type: 'flow',
    flowFrom: 'Input', flowTo: 'Output', arrowColor: '#6B7280', activeColor: '#6B7280', arrowChar: '⚙',
  },
  {
    cls: 'tool-card--web',
    delay: '0.25s',
    iconBg: 'rgba(8,175,196,0.10)',
    iconStroke: '#08AFC4',
    iconPath: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </>
    ),
    label: 'Web Development',
    sub: 'React · Next.js · Node',
    type: 'tags',
    tags: [
      { text: 'React', color: '#08AFC4', bg: 'rgba(8,175,196,0.10)' },
      { text: 'Next', color: '#08AFC4', bg: 'rgba(8,175,196,0.10)' },
      { text: 'Node', color: '#7F878D', bg: 'rgba(127,135,141,0.10)' },
    ],
  },
  {
    cls: 'tool-card--mktg',
    delay: '0.4s',
    iconBg: 'rgba(201,31,87,0.10)',
    iconStroke: '#C91F57',
    iconPath: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    label: 'Digital Marketing',
    sub: 'SEO · Ads · Analytics',
    type: 'bar',
    barWidth: '72%', barGradient: 'linear-gradient(90deg,#C91F57,#7F878D)',
  },
];

/* ── ToolCard ────────────────────────────────────────────── */
function ToolCard({ card }) {
  return (
    <div className={`tool-card ${card.cls}`} style={{ '--delay': card.delay }}>
      <div className="tool-card__icon-wrap" style={{ background: card.iconBg }}>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={card.iconStroke} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          {card.iconPath}
        </svg>
      </div>
      <div className="tool-card__label">{card.label}</div>
      <div className="tool-card__sub">{card.sub}</div>

      {card.type === 'flow' && (
        <div className="tool-card__flow">
          <span
            className="tool-card__step"
            style={{ borderColor: card.activeColor, color: card.activeColor }}
          >
            {card.flowFrom}
          </span>
          <span className="tool-card__arrow" style={{ color: card.arrowColor }}>
            {card.arrowChar || '→'}
          </span>
          <span
            className="tool-card__step tool-card__step--active"
            style={{ background: card.activeColor }}
          >
            {card.flowTo}
          </span>
        </div>
      )}

      {card.type === 'tags' && (
        <div className="tool-card__tags-row">
          {card.tags.map(t => (
            <span key={t.text} className="tc-tag" style={{ color: t.color, background: t.bg }}>
              {t.text}
            </span>
          ))}
        </div>
      )}

      {card.type === 'bar' && (
        <div className="tool-card__bar-mini">
          <div
            className="tool-card__bar-fill"
            style={{ width: card.barWidth, background: card.barGradient }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Component ───────────────────────────────────────────── */
function Home() {
  useScrollReveal([]);

  useEffect(() => {
    const t = setTimeout(() => {
      const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      targets.forEach(el => obs.observe(el));
      return () => obs.disconnect();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <main id="main-content" className="home-page" tabIndex="-1">
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__grid" />

        <div className="container hero__content">
          {/* LEFT: Text Block */}
          <div className="hero__text-block">
            <div className="hero__eyebrow">
              <span className="hero__eyebrow-dot" />
              Trusted by 3+ global clients
            </div>
            <h1 className="hero__title">
              We power your<br />
              <span className="hero__title-accent">digital future</span>
            </h1>
            <p className="hero__desc">
              From ePub conversion and XML tagging to web development,
              automation, and digital marketing — we convert complexity
              into competitive advantage.
            </p>
            <div className="hero__actions">
              <Link to="/contact" className="btn-primary">Get a free quote →</Link>
              <Link to="/services" className="btn-ghost">Explore services</Link>
            </div>
          </div>

          {/* RIGHT: Stage (laptop + cards) */}
          <div className="hero__stage">

            {/* Circular Orbit Cards */}
            <div className="hero__cards-circle">
              {LEFT_CARDS.map(c => (
                <div key={c.cls} className={`hero__card-orbit tool-card--${c.cls.replace('tool-card--', '')}-orbit`}>
                  <ToolCard card={c} />
                </div>
              ))}
              {RIGHT_CARDS.map(c => (
                <div key={c.cls} className={`hero__card-orbit tool-card--${c.cls.replace('tool-card--', '')}-orbit`}>
                  <ToolCard card={c} />
                </div>
              ))}
            </div>

            {/* CENTRE laptop */}
            <div className="hero__laptop-wrap">
              <div className="hero__laptop">
                <div className="laptop__screen">
                  <div className="laptop__notch" />
                  <div className="laptop__browser">
                    <div className="browser__bar">
                      <span className="browser__dot" style={{ background: '#FF5F57' }} />
                      <span className="browser__dot" style={{ background: '#FEBC2E' }} />
                      <span className="browser__dot" style={{ background: '#28C840' }} />
                      <div className="browser__url">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B4B2A9" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        <span>app.digicraft.io/dashboard</span>
                      </div>
                    </div>

                    <div className="dashboard">
                      <div className="dash__header">
                        <div>
                          <div className="dash__welcome">Welcome back!</div>
                          <div className="dash__sub">Your conversion pipeline</div>
                        </div>
                        <div className="dash__badge">
                          <span className="dash__badge-dot" />
                          3 active jobs
                        </div>
                      </div>

                      {/* Pipeline */}
                      <div className="pipeline">
                        {PIPELINE.map((s, i) => (
                          <div className="pipeline__step" key={i}>
                            <div className={`pipeline__dot${s.done ? ' done' : ''}${s.active ? ' active' : ''}`}>
                              {s.done ? '✓' : s.icon}
                            </div>
                            <div className="pipeline__lbl">{s.label}</div>
                            {i < PIPELINE.length - 1 && (
                              <div className={`pipeline__line${s.done ? ' done' : ''}`} />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Stats card */}
                      <div className="dash__stats">
                        <div className="dash__stat-grid">
                          {[
                            { val: '50K+', lbl: 'Documents converted', c: '#E92E68' },
                            { val: '99.4%', lbl: 'Accuracy rate', c: '#08AFC4' },
                            { val: '200+', lbl: 'Active clients', c: '#08AFC4' },
                            { val: '60%', lbl: 'Avg. cost saved', c: '#7F878D' },
                          ].map(m => (
                            <div className="dash__stat-item" key={m.lbl}>
                              <div className="dash__stat-val" style={{ color: m.c }}>{m.val}</div>
                              <div className="dash__stat-lbl">{m.lbl}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="laptop__base">
                  <div className="laptop__hinge" />
                  <div className="laptop__bottom" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="hero__scroll">
          <div className="hero__scroll-line" />
          <span>scroll</span>
        </div> */}
      </section>

      {/* ── CLIENTS MARQUEE ───────────────────────────────── */}
      <section className="clients">
        <div className="container">
          <p className="clients__label">Trusted by leading publishers & enterprises worldwide</p>
        </div>
        <div className="clients__track">
          <div className="clients__inner">
            {[...CLIENTS, ...CLIENTS].map((client, i) => (
              <div
                className={`clients__logo ${client.className}`}
                key={`${client.name}-${i}`}
                aria-label={client.name}
                title={client.name}
              >
                <img
                  className="clients__logo-image"
                  src={client.logo}
                  alt={`${client.name} logo`}
                  width="320"
                  height="88"
                  loading={i < CLIENTS.length ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPACT NUMBERS ────────────────────────────────── */}
      <section className="impact">
        <div className="container">
          <div className="impact__grid stagger">
            <ImpactNumber number={50000} suffix="+" label="Documents & articles converted" />
            <ImpactNumber number={50} suffix="+" label="Clients across 3+ countries" />
            <ImpactNumber number={99} suffix=".7%" label="Average accuracy rate" />
            <ImpactNumber number={12} suffix="+" label="Years of digital expertise" />
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────── */}
      <section className="services">
        <div className="container">
          <div className="services__header">
            <div className="reveal-left">
              <span className="section-label">What we do</span>
              <h2 className="services__title">Services that drive<br />transformation</h2>
            </div>
            <p className="services__desc reveal-right">
              We help businesses and publishers transition from legacy workflows to modern,
              scalable digital processes — reducing costs, improving speed, and creating
              better end-user experiences.
            </p>
          </div>
          <div className="services__grid stagger">
            {SERVICES.map((svc, i) => (
              <div className="service-card reveal" key={svc.name} style={{ '--i': i }}>
                <div className="service-card__icon" style={{ background: svc.color }}>{svc.icon}</div>
                <div className="service-card__name">{svc.name}</div>
                <div className="service-card__desc">{svc.desc}</div>
                {/* <span className="service-card__arrow">Learn more →</span> */}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED WORK ─────────────────────────────────── */}
      {/* <section className="work">
        <div className="container">
          <div className="work__header reveal">
            <div>
              <span className="section-label">Featured work</span>
              <h2 className="work__title">Results we're proud of</h2>
            </div>
            <Link to="/portfolio" className="btn-ghost">View all projects →</Link>
          </div>
          <div className="work__grid stagger">
            {WORK.map((w, i) => (
              <div
                className={`work-card reveal${w.wide ? ' work-card--wide' : ''}`}
                key={w.name}
                style={{ '--i': i }}
              >
                <div className="work-card__thumb">
                  <div className="work-card__thumb-bg" style={{ background: w.gradient }}>
                    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden>
                      <rect x="10" y="10" width="40" height="6" rx="3" fill={w.accent} opacity="0.4" />
                      <rect x="10" y="22" width="70" height="6" rx="3" fill={w.accent} opacity="0.2" />
                      <rect x="10" y="34" width="55" height="6" rx="3" fill={w.accent} opacity="0.2" />
                      <rect x="10" y="54" width="30" height="14" rx="6" fill={w.accent} opacity="0.6" />
                      <circle cx="96" cy="40" r="22" stroke={w.accent} strokeWidth="2" opacity="0.3" />
                      <circle cx="96" cy="40" r="12" fill={w.accent} opacity="0.2" />
                    </svg>
                  </div>
                  <span className="work-card__badge">{w.tag}</span>
                </div>
                <div className="work-card__body">
                  <div className="work-card__name">{w.name}</div>
                  <div className="work-card__desc">{w.desc}</div>
                  <div className="work-card__tags">
                    {w.tags.map(t => <span className="tag" key={t}>{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="testimonials">
        <div className="container">
          <h2 className="testimonials__title reveal">What our clients say</h2>
          <div className="testimonials__grid stagger">
            {TESTIMONIALS.map((t, i) => (
              <div className="testi-card reveal" key={t.name} style={{ '--i': i }}>
                <div className="testi-card__stars">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span className="testi-card__star" key={s}>★</span>
                  ))}
                </div>
                <p className="testi-card__quote">"{t.quote}"</p>
                <div className="testi-card__author">
                  <div
                    className="testi-card__avatar"
                    style={{ background: `linear-gradient(135deg,${t.color}cc,${t.color}66)` }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="testi-card__name">{t.name}</div>
                    <div className="testi-card__role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="container">
          <div className="cta-banner__inner reveal">
            <h2 className="cta-banner__title">Ready to go digital?<br />Let's talk.</h2>
            <p className="cta-banner__sub">
              Book a free 30-minute consultation and see exactly how we can accelerate your digital transformation.
            </p>
            <div className="cta-banner__actions">
              <Link to="/contact" className="btn-primary">Book a free consultation →</Link>
              <Link to="/services" className="btn-ghost">Explore services</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;




