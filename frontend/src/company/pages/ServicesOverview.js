import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/Services.css';
import '../pages/Home.css';
import { SERVICES_LIST } from '../data/servicesData';
import { useScrollReveal } from '../hooks/useScrollReveal';

function ServicesOverview() {
  useScrollReveal([]);

  return (
    <main id="main-content" className="services-page" tabIndex="-1">
      {/* Hero */}
      <section className="services-hero">
        <div className="container">
          <div className="services-hero__content">
            <div className="services-hero__eyebrow">What we do</div>
            <h1 className="services-hero__title">
              Digital services. One trusted partner.
            </h1>
            <p className="services-hero__desc">
              From ePub conversion and XML tagging to web development, automation,
              data entry, and digital marketing — we deliver precision digital
              services that reduce cost, improve speed, and scale with your business.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="services-overview">
        <div className="container">
          <div className="reveal">
            <span className="section-label">Our services</span>
            <h2 className="services-overview__title">Everything you need to go digital</h2>
            <p className="services-overview__sub">
              Select any service below to see full details, deliverables, and client results.
            </p>
          </div>

          <div className="services-cards-grid stagger">
            {SERVICES_LIST.map((svc, i) => (
              <Link
                to={`/services/${svc.slug}`}
                className={`service-overview-card reveal ${svc.category}`}
                key={svc.slug}
                style={{ '--i': i }}
              >
                <div
                  className="service-overview-card__icon"
                  style={{ background: svc.iconBg }}
                >
                  {svc.icon}
                </div>
                <div className="service-overview-card__name">{svc.name}</div>
                <div className="service-overview-card__desc">{svc.tagline}</div>
                <span className="service-overview-card__arrow">
                  Explore service →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="service-cta">
        <div className="container">
          <div className="service-cta__inner reveal">
            <h2 className="service-cta__title">
              Not sure which service you need?
            </h2>
            <p className="service-cta__desc">
              Book a free 30-minute consultation and we'll recommend the right
              solution for your workflow and budget.
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

export default ServicesOverview;