import React, { useEffect, useId, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Contact.css';
import '../pages/Home.css';
import { useScrollReveal } from '../hooks/useScrollReveal';

/* ── FAQ Accordion Item ── */
function ContactFaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  return (
    <div className={`contact-faq-item ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="contact-faq-item__question"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((value) => !value)}
      >
        {faq.q}
        <span className="contact-faq-item__icon" aria-hidden="true">+</span>
      </button>
      <div id={answerId} className="contact-faq-item__answer" role="region" aria-hidden={!open}>
        <div className="contact-faq-item__answer-inner">{faq.a}</div>
      </div>
    </div>
  );
}

const SERVICES_OPTIONS = [
  { label: 'ePub Conversion', value: 'epub' },
  { label: 'XML Tagging', value: 'xml' },
  { label: 'Web Development', value: 'web' },
  { label: 'Automation & RPA', value: 'automation' },
  { label: 'Data Entry Services', value: 'data-entry' },
  { label: 'Digital Marketing', value: 'marketing' },
  { label: 'STM/HSS Books & Journals', value: 'stm-hss' },
  { label: 'College Textbooks', value: 'college-textbooks' },
  { label: 'Book Publishing Services', value: 'publishing-services' },
];

function Contact() {
  const location = useLocation();

  useScrollReveal([]);

  /* ── 1. Contact Form State ── */
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /* Auto-select service from query parameters (?service=epub) */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const serviceParam = params.get('service') || params.get('type');
    if (serviceParam) {
      const matched = SERVICES_OPTIONS.find(s => s.value === serviceParam.toLowerCase());
      if (matched) {
        setFormData(prev => ({ ...prev, service: matched.value }));
      }
    }
  }, [location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError('');
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.message.trim()) errors.message = 'Message cannot be empty';
    return errors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitError('Please correct the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const apiBase = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiBase}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', company: '', service: '', message: '' });
    } catch (error) {
      console.error('Contact submission failed:', error);
      setSubmitError('We could not submit the request. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };





  const CONTACT_FAQS = [
    { q: 'What is your standard turnaround time for inquiries?', a: 'Sales and scoping requests are prioritized during business days. Contractual response times and support coverage are documented in each project proposal or client SLA.' },
    { q: 'Can we sign an NDA before scoping our document conversion?', a: 'Absolutely. We maintain strict confidentiality. We can sign our standard mutual Non-Disclosure Agreement (NDA) or review and sign your organization\'s NDA template before you share any manuscripts or schemas.' },
    { q: 'How do you structure custom project scoping?', a: 'We begin with a short scoping call to understand source formats, deliverables, validation rules, volume, and timeline. Any pilot scope, pricing, and acceptance criteria are confirmed in writing before work begins.' },
    { q: 'Where are your data rooms and servers located?', a: 'Storage regions, access controls, retention periods, encryption requirements, and NDA terms are documented during onboarding. Request the current security pack before sharing production data.' },
  ];

  return (
    <main id="main-content" className="contact-page" tabIndex="-1">
      {/* ── HERO BANNER ── */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero__content">
            <div className="contact-hero__eyebrow">Connect with us</div>
            <h1 className="contact-hero__title">Let's build something remarkable</h1>
            <p className="contact-hero__desc">
              Reach our team in Villupuram, Tamil Nadu — or start a project conversation online today.
            </p>
          </div>
        </div>
      </section>

      {/* ── CORE CONTACT SPLIT SECTION ── */}
      <section className="contact-core">
        <div className="container">
          <div className="contact-grid">

            {/* ── Left Column: Contact details & Scheduler ── */}
            <div className="contact-info-col reveal-left">
              <span className="section-label">Contact info</span>
              <h2 className="contact-info-col__title">Direct Channels</h2>

              <div className="contact-cards">
                <div className="contact-info-card">
                  <div className="contact-info-card__icon">✉️</div>
                  <div>
                    <div className="contact-info-card__label">Email Us</div>
                    <a href="mailto:usen@arrowdatatech.com" className="contact-info-card__link">usen@arrowdatatech.com</a>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-card__icon">📞</div>
                  <div>
                    <div className="contact-info-card__label">Call Our Office</div>
                    <a href="tel:+919894562152" className="contact-info-card__link">+91 9894562152</a>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-card__icon">🌐</div>
                  <div>
                    <div className="contact-info-card__label">Visit Our Website</div>
                    <a href="https://www.arrowdatatech.com" target="_blank" rel="noopener noreferrer" className="contact-info-card__link">www.arrowdatatech.com</a>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-card__icon">🕒</div>
                  <div>
                    <div className="contact-info-card__label">Business Hours</div>
                    <div className="contact-info-card__text">Monday – Friday · India Standard Time</div>
                    <div className="contact-info-card__text contact-info-card__text--sub">Support coverage is defined in each client SLA</div>
                  </div>
                </div>
              </div>


            </div>

            {/* ── Right Column: Contact form ── */}
            <div className="contact-form-col reveal-right">
              <div className="contact-form-card">
                <span className="section-label">Inquiry form</span>
                <h3 className="contact-form-card__title">Request a Custom Proposal</h3>
                <p className="contact-form-card__desc">Fill out your project specifications and our engineers will calculate a tailored estimate.</p>

                {submitSuccess ? (
                  <div className="form-success-overlay animate-fade-in" role="status" aria-live="polite">
                    <div className="form-success-overlay__circle">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h4 className="form-success-overlay__title">Proposal request sent</h4>
                    <p className="form-success-overlay__desc">
                      Thank you for contacting Arrow Data Tech. The team will review the information and respond using the contact details you provided.
                    </p>
                    <button
                      type="button"
                      className="btn-form-reset"
                      onClick={() => setSubmitSuccess(false)}
                    >
                      Send another request
                    </button>
                  </div>
                ) : (
                  <form className="contact-form-el" onSubmit={handleFormSubmit} noValidate>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name">Full Name <span className="req">*</span></label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          autoComplete="name"
                          required
                          aria-invalid={Boolean(formErrors.name)}
                          aria-describedby={formErrors.name ? 'name-error' : undefined}
                          className={formErrors.name ? 'input-err' : ''}
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., John Doe"
                        />
                        {formErrors.name && <span id="name-error" className="field-err" role="alert">{formErrors.name}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email Address <span className="req">*</span></label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          autoComplete="email"
                          required
                          aria-invalid={Boolean(formErrors.email)}
                          aria-describedby={formErrors.email ? 'email-error' : undefined}
                          className={formErrors.email ? 'input-err' : ''}
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="e.g., john@company.com"
                        />
                        {formErrors.email && <span id="email-error" className="field-err" role="alert">{formErrors.email}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="e.g., +1 (555) 123-4567"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="company">Company / Organization</label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          autoComplete="organization"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="e.g., Acme Corp"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="service">Interested Service</label>
                      <div className="select-wrapper">
                        <select
                          id="service"
                          name="service"
                          value={formData.service}
                          onChange={handleInputChange}
                        >
                          <option value="">-- Select a Service --</option>
                          {SERVICES_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Project Description / Message <span className="req">*</span></label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        aria-invalid={Boolean(formErrors.message)}
                        aria-describedby={formErrors.message ? 'message-error' : undefined}
                        className={formErrors.message ? 'input-err' : ''}
                        rows="5"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us about your project volume, schemas, timelines, or specifications..."
                      />
                      {formErrors.message && <span id="message-error" className="field-err" role="alert">{formErrors.message}</span>}
                    </div>

                    {submitError && (
                      <div className="form-submit-error" role="alert">{submitError}</div>
                    )}

                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="spinner-wrap">
                          <span className="btn-spinner"></span>
                          Submitting Scoping Request...
                        </span>
                      ) : (
                        'Submit Scoping Request →'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── OFFICE LOCATION & INTERACTIVE MAP ── */}
      <section className="contact-map">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-label">Office location</span>
            <h2 className="section-header__title">Our Headquarters</h2>
            <p className="section-header__desc">
              Reach our team in Villupuram, Tamil Nadu. Drop by our office or mail physical media to:
              <br />
              <strong>#07, M.G. Road, Near Roundana, Kottakuppam, Vanur Taluk, Villupuram, Tamil Nadu – 605 104</strong>
            </p>
          </div>

          <div className="map-frame reveal">
            {/* Styled iframe using OpenStreetMap */}
            <iframe
              title="ADT Headquarters Map"
              width="100%"
              height="450"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src="https://www.openstreetmap.org/export/embed.html?bbox=79.82%2C11.97%2C79.86%2C12.01&amp;layer=mapnik&amp;marker=11.99139%2C79.84139"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="map-frame__embed"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="contact-faq">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-label">Questions</span>
            <h2 className="section-header__title">Onboarding & Scoping FAQs</h2>
            <p className="section-header__desc">
              Find quick answers regarding our onboarding processes, pilot trials, security setups, and contract scopes.
            </p>
          </div>

          <div className="faq-list reveal">
            {CONTACT_FAQS.map((faq) => (
              <ContactFaqItem key={faq.q} faq={faq} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Contact;
