import React, { useId, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import './Services.css';
import './Home.css';
import { SERVICES_DATA, SERVICES_LIST } from '../data/servicesData';
import { useScrollReveal } from '../hooks/useScrollReveal';

/* ── Accordion FAQ Item ─────────────────────────────────── */
function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="faq-item__question"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((value) => !value)}
      >
        {faq.q}
        <span className="faq-item__icon" aria-hidden="true">+</span>
      </button>
      <div id={answerId} className="faq-item__answer" role="region" aria-hidden={!open}>
        <div className="faq-item__answer-inner">{faq.a}</div>
      </div>
    </div>
  );
}

/* ── Main Service Detail Page ────────────────────────────── */
function ServiceDetail() {
  const { slug } = useParams();
  const svc = SERVICES_DATA[slug];

  useScrollReveal([slug]);

  if (!svc) return <Navigate to="/services" replace />;

  const heroStyle = {
    background: `linear-gradient(135deg, ${svc.gradientFrom} 0%, ${svc.gradientTo} 100%)`,
  };

  /* Other services for quick nav */
  const others = SERVICES_LIST.filter((s) => s.slug !== slug).slice(0, 3);

  return (
    <main id="main-content" className="service-page" tabIndex="-1">
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="service-page-hero" style={heroStyle}>
        <div className="container">
          <div className="service-page-hero__breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <Link to="/services">Services</Link>
            <span>›</span>
            {svc.name}
          </div>

          <div className="service-page-hero__eyebrow">{svc.offerLabel}</div>

          <h1 className="service-page-hero__title">{svc.heroTitle}</h1>
          <p className="service-page-hero__desc">{svc.heroDesc}</p>

          <div className="service-page-hero__actions">
            <Link to="/contact" className="btn-white">
              Book a free consultation →
            </Link>
            <Link to="/contact?type=quote" className="btn-outline-white">
              Get a quote
            </Link>
          </div>

          {/* Stats Row */}
          <div className="service-page-hero__stats">
            {svc.stats.map((s) => (
              <div key={s.lbl}>
                <div className="service-page-hero__stat-val">{s.val}</div>
                <div className="service-page-hero__stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE OFFER ─────────────────────────────────── */}
      <section className="service-offer">
        <div className="container">
          <div className="service-offer__grid">
            {/* Left: copy + deliverables */}
            <div className="reveal-left">
              <span className="service-offer__label">{svc.offerLabel}</span>
              <h2 className="service-offer__title">{svc.offerTitle}</h2>
              <p className="service-offer__desc">{svc.offerDesc}</p>

              <ul className="service-offer__deliverables">
                {svc.deliverables.map((d) => (
                  <li key={d}>
                    <span className="deliverable-check">✓</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: visual feature cards */}
            <div className="service-offer__visual reveal-right">
              {svc.visualItems.map((item) => (
                <div className="offer-visual-item" key={item.title}>
                  <div
                    className="offer-visual-item__icon"
                    style={{ background: item.bg }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="offer-visual-item__title">{item.title}</div>
                    <div className="offer-visual-item__sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SUB-SERVICES (PUBLISHING MENU) ────────────────── */}
      {svc.subServices && (
        <section className="service-subservices">
          <div className="container">
            <div className="section-header reveal">
              <div className="section-header__label">Capabilities</div>
              <h2 className="section-header__title">Our Publishing Services Menu</h2>
              <p className="section-header__desc">
                From developmental editing to digital listing and global distribution, we cover every aspect of book publishing.
              </p>
            </div>

            <div className="subservices-grid stagger">
              {svc.subServices.map((sub, i) => (
                <div className="subservice-card reveal" key={sub.name} style={{ '--i': i }}>
                  <div className="subservice-card__icon">{sub.icon}</div>
                  <div className="subservice-card__name">{sub.name}</div>
                  <div className="subservice-card__desc">{sub.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TECH STACK ────────────────────────────────────── */}
      <section className="service-tech">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-header__label">Technology</div>
            <h2 className="section-header__title">Tools & platforms we use</h2>
            <p className="section-header__desc">
              We choose the right tool for the job — industry-standard platforms
              combined with custom-built internal tooling.
            </p>
          </div>

          <div className="tech-grid stagger">
            {svc.techStack.map((t, i) => (
              <div className="tech-card reveal" key={t.name} style={{ '--i': i }}>
                <div className="tech-card__icon">{t.icon}</div>
                <div className="tech-card__name">{t.name}</div>
                <div className="tech-card__cat">{t.cat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ───────────────────────────────────────── */}
      <section className="service-process">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-header__label">How it works</div>
            <h2 className="section-header__title">Our proven 5-step process</h2>
            <p className="section-header__desc">
              A transparent, milestone-driven workflow — so you always know exactly
              where your project stands.
            </p>
          </div>

          <div className="process-steps stagger">
            {svc.process.map((step, i) => (
              <div className="process-step reveal" key={step.step} style={{ '--i': i }}>
                <div className="process-step__num">{step.step}</div>
                <div className="process-step__title">{step.title}</div>
                <div className="process-step__desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FAQS ──────────────────────────────────────────── */}
      <section className="service-faq">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-header__label">FAQs</div>
            <h2 className="section-header__title">Common questions answered</h2>
            <p className="section-header__desc">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="faq-list reveal">
            {svc.faqs.map((faq) => (
              <FaqItem faq={faq} key={faq.q} />
            ))}
          </div>
        </div>
      </section>

      {/* ── OTHER SERVICES ─────────────────────────────────── */}
      <section className="services-overview" style={{ background: '#FFFFFF', paddingTop: 60, paddingBottom: 60 }}>
        <div className="container">
          <div className="reveal" style={{ marginBottom: 36 }}>
            <span className="section-label">Explore more</span>
            <h2 className="services-overview__title" style={{ marginBottom: 0 }}>Other services you might need</h2>
          </div>
          <div className="services-cards-grid stagger" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {others.map((s, i) => (
              <Link
                to={`/services/${s.slug}`}
                className={`service-overview-card reveal ${s.category}`}
                key={s.slug}
                style={{ '--i': i }}
              >
                <div className="service-overview-card__icon" style={{ background: s.iconBg }}>{s.icon}</div>
                <div className="service-overview-card__name">{s.name}</div>
                <div className="service-overview-card__desc">{s.tagline}</div>
                <span className="service-overview-card__arrow">Explore service →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────── */}
      <section className="service-cta">
        <div className="container">
          <div className="service-cta__inner reveal">
            <h2 className="service-cta__title">
              Ready to get started with {svc.name}?
            </h2>
            <p className="service-cta__desc">
              Book a free 30-minute consultation and we'll scope your project,
              answer every question, and provide a no-obligation quote.
            </p>
            <div className="service-cta__actions">
              <Link to="/contact" className="btn-white">
                Book a free consultation →
              </Link>
              <Link to="/contact?type=quote" className="btn-outline-white">
                Get a quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ServiceDetail;
