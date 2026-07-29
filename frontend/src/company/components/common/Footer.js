import React from 'react';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';
import './Footer.css';

const SERVICE_LINKS = [
  ['ePub Conversion', '/services/epub'],
  ['XML Tagging', '/services/xml'],
  ['Web Development', '/services/web'],
  ['Automation & RPA', '/services/automation'],
  ['Data Entry Services', '/services/data-entry'],
  ['Digital Marketing', '/services/marketing'],
  ['STM/HSS Publishing', '/services/stm-hss'],
  ['College Textbooks', '/services/college-textbooks'],
  ['Book Publishing', '/services/publishing-services'],
];

const COMPANY_LINKS = [
  ['About Us', '/about'],
  ['Careers', '/careers'],
  ['Book a Meeting', '/contact'],
];

const RESOURCE_LINKS = [
  ['All Services', '/services'],
  ['HTML Sitemap', '/sitemap'],
  ['Contact the Team', '/contact'],
];

function FooterColumn({ title, links, labelledBy }) {
  return (
    <nav className="footer-box__col" aria-labelledby={labelledBy}>
      <h3 id={labelledBy} className="footer-box__col-title">{title}</h3>
      <ul className="footer-box__col-links">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className={label === 'Careers' ? 'footer-ref__link-flex' : undefined}>
              {label}
              {label === 'Careers' && <span className="badge-ref-hiring">Hiring</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Footer() {
  const scrollToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <footer className="footer-ref" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">ADT Digital footer</h2>
      <div className="container">
        <div className="footer-box reveal">
          <div className="footer-box__grid">
            <div className="footer-box__col footer-box__col--logo">
              <Link to="/" className="footer-ref__logo" aria-label="ADT Digital home">
                <BrandMark showText={false} />
              </Link>
              <p className="footer-ref__desc">
                Enterprise publishing production, XML structuring, accessible digital conversion and automated workflows.
              </p>
            </div>

            <FooterColumn title="Services" links={SERVICE_LINKS} labelledBy="footer-services" />
            <FooterColumn title="Company" links={COMPANY_LINKS} labelledBy="footer-company" />
            <FooterColumn title="Resources" links={RESOURCE_LINKS} labelledBy="footer-resources" />

            <section className="footer-box__col footer-box__col--contact" aria-labelledby="footer-contact">
              <h3 id="footer-contact" className="footer-box__col-title">Get in touch</h3>
              <address>
                <ul className="footer-box__col-links footer-box__col-links--contact">
                  <li>
                    <span className="contact-icon-ref" aria-hidden="true">✉</span>
                    <a href="mailto:usen@arrowdatatech.com">usen@arrowdatatech.com</a>
                  </li>
                  <li>
                    <span className="contact-icon-ref" aria-hidden="true">☎</span>
                    <a href="tel:+919894562152">+91 98945 62152</a>
                  </li>
                  <li>
                    <span className="contact-icon-ref" aria-hidden="true">⌖</span>
                    <span>#07, M.G. Road, Near Roundana, Kottakuppam, Vanur Taluk, Villupuram, Tamil Nadu 605104</span>
                  </li>
                </ul>
              </address>
            </section>


          </div>
        </div>

        <div className="footer-trust reveal">
          <div className="footer-trust__left" aria-label="Delivery assurances">
            <div className="footer-trust__badge">
              <div className="footer-trust__icon" aria-hidden="true">✓</div>
              <div>
                <p className="footer-trust__title">Quality-verified delivery</p>
                <p className="footer-trust__desc">Dual-key verification and human review.</p>
              </div>
            </div>
            <div className="footer-trust__badge">
              <div className="footer-trust__icon" aria-hidden="true">⌾</div>
              <div>
                <p className="footer-trust__title">Protected project workflows</p>
                <p className="footer-trust__desc">Controlled access and NDA support.</p>
              </div>
            </div>
          </div>

          <div className="footer-trust__right">
            <div className="compliance-badges" aria-label="Standards supported">
              <span className="compliance-badge">GDPR-aware workflows</span>
              <span className="compliance-badge">Accessible web standards</span>
              <span className="compliance-badge">Structured publishing standards</span>
            </div>
            <div className="footer-ref__legal-row">
              <span className="footer-ref__copyright">© {new Date().getFullYear()} ADT Digital. All rights reserved.</span>
              <span className="footer-ref__sitemap-divider" aria-hidden="true">|</span>
              <Link to="/sitemap" className="footer-ref__sitemap">HTML sitemap</Link>
              <span className="footer-ref__sitemap-divider" aria-hidden="true">|</span>
              <button type="button" onClick={scrollToTop} className="footer-ref__back-top">Back to top <span aria-hidden="true">↑</span></button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;




