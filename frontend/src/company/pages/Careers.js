import React, { useEffect, useId, useState } from 'react';
import './Careers.css';
import '../pages/Home.css';
import { useDialog } from '../hooks/useDialog';
import { useScrollReveal } from '../hooks/useScrollReveal';

/* ── FAQ Accordion Item ── */
function CareerFaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  return (
    <div className={`career-faq-item ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="career-faq-item__question"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((value) => !value)}
      >
        {faq.q}
        <span className="career-faq-item__icon" aria-hidden="true">+</span>
      </button>
      <div id={answerId} className="career-faq-item__answer" role="region" aria-hidden={!open}>
        <div className="career-faq-item__answer-inner">{faq.a}</div>
      </div>
    </div>
  );
}

/* ── DATA DEFINITIONS ── */
const CULTURES_PERKS = [
  { icon: '💼', title: 'Competitive Rewards', desc: 'Industry-leading compensation packages with performance bonuses and annual appraisals.', color: 'rgba(233,46,104,0.08)' },
  { icon: '🚀', title: 'Career Growth', desc: 'Structured learning paths, technical certifications sponsorship, and internal promotion tracks.', color: 'rgba(8,175,196,0.08)' },
  { icon: '🏡', title: 'Hybrid Flexibility', desc: 'Work from our state-of-the-art Villupuram hub or collaborate seamlessly in hybrid modes.', color: 'rgba(8,175,196,0.10)' },
  { icon: '⚡', title: 'Modern Tech Stack', desc: 'Work with React, Next.js, Python, AWS, and advanced JATS/BITS XML processing tools.', color: 'rgba(127,135,141,0.10)' },
  { icon: '🌍', title: 'Global Exposure', desc: 'Partner directly with Tier-1 publishers, university presses, and enterprises worldwide.', color: 'rgba(112,120,127,0.10)' },
  { icon: '❤️', title: 'Wellness & Community', desc: 'Comprehensive health benefits, team outings, cultural events, and work-life balance.', color: 'rgba(201,31,87,0.08)' },
];

const FALLBACK_JOBS = [
  {
    id: 'job-1', title: 'Senior Full-Stack Engineer (React / Node)',
    department: 'Engineering', location: 'Villupuram / Hybrid', jobType: 'Full-Time',
    experience: '4+ Years',
    description: 'Lead the architecture and engineering of high-throughput web portals and client dashboards using React, TypeScript, and Node.js REST APIs.',
    tags: ['React', 'Node.js', 'TypeScript', 'REST API'],
  },
  {
    id: 'job-2', title: 'JATS / BITS XML Specialist & QA Lead',
    department: 'Editorial & XML', location: 'Villupuram Hub', jobType: 'Full-Time',
    experience: '2+ Years',
    description: 'Oversee structured journal and textbook tagging workflows.',
    tags: ['JATS XML', 'BITS', 'oXygen', 'Schematron'],
  },
];

const HIRING_STEPS = [
  { step: '01', title: 'Application Review', desc: 'Our talent team evaluates your resume, portfolio, and technical background.' },
  { step: '02', title: 'Technical Scoping', desc: 'A hands-on discussion or coding/editing exercise tailored to your specialized domain.' },
  { step: '03', title: 'Culture & Team Fit', desc: 'Meet your prospective teammates and department leads to discuss career goals.' },
  { step: '04', title: 'Offer & Onboarding', desc: 'Receive a competitive offer and structured orientation to kickstart your journey.' },
];

const CAREER_FAQS = [
  { q: 'Where is the main working location?', a: 'Our primary delivery center is located at #07, M.G. Road, Kottakuppam, Villupuram, Tamil Nadu. Depending on the role, we offer full on-site, hybrid, or remote arrangements.' },
  { q: 'What is the typical interview timeline?', a: 'Our hiring process is swift and transparent, usually completing within 7 to 14 days from initial application review to offer rollout.' },
  { q: 'Do you provide training for specialized publishing schemas?', a: 'Yes! While relevant experience is valuable, we provide intensive onboarding programs covering advanced JATS/BITS XML structures, EpubCheck tools, and proprietary automation frameworks.' },
  { q: 'Can I apply spontaneously if my ideal role is not listed?', a: 'Absolutely. You can click the "Spontaneous Application" option in our listings section to submit your resume for future upcoming vacancies.' },
];

function Careers() {
  const [selectedDept, setSelectedDept] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [appliedJob, setAppliedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useScrollReveal([jobs, jobsLoading]);

  /* Load job openings from API */
  useEffect(() => {
    const apiBase = process.env.REACT_APP_API_URL || '';
    fetch(`${apiBase}/public/careers/openings`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(json => setJobs(json.data && Array.isArray(json.data) ? json.data : FALLBACK_JOBS))
      .catch(() => setJobs(FALLBACK_JOBS))
      .finally(() => setJobsLoading(false));
  }, []);
  /* Filter Jobs from API data */
  const filteredJobs = selectedDept === 'All'
    ? jobs
    : jobs.filter(j => j.department === selectedDept);

  /* Modal Form State */
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    portfolio: '',
    coverNote: '',
    fileName: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const handleOpenModal = (job) => {
    setAppliedJob(job);
    setFormSubmitted(false);
    setSubmitError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setAppliedJob(null);
    setResumeFile(null);
    setSubmitError('');
  };

  const dialogRef = useDialog(modalOpen, handleCloseModal);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCandidateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setSubmitError('');
      setCandidateForm(prev => ({ ...prev, fileName: file.name }));
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setSubmitError('Attach a PDF, DOC, or DOCX resume before submitting.');
      return;
    }

    const payload = new FormData();
    payload.append('name',       candidateForm.name);
    payload.append('email',      candidateForm.email);
    payload.append('phone',      candidateForm.phone);
    payload.append('portfolio',  candidateForm.portfolio);
    payload.append('coverNote',  candidateForm.coverNote);
    payload.append('role',       appliedJob?.title || 'General application');
    payload.append('department', appliedJob?.department || 'General');
    payload.append('resume',     resumeFile);

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const apiBase = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiBase}/public/careers/apply`, { method: 'POST', body: payload });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      setFormSubmitted(true);
    } catch (error) {
      console.error('Career application failed:', error);
      setSubmitError('We could not submit the application. Please try again or email your resume directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = ['All', ...new Set(jobs.map(j => j.department))];

  return (
    <main id="main-content" className="careers-page" tabIndex="-1">
      {/* ── HERO BANNER ── */}
      <section className="careers-hero">
        <div className="container">
          <div className="careers-hero__content">
            <div className="careers-hero__eyebrow">Join Arrow Data Tech</div>
            <h1 className="careers-hero__title">Engineer the Future of Digital Content</h1>
            <p className="careers-hero__desc">
              We combine cutting-edge software engineering with high-precision digital publishing.
              Explore opportunities to grow your career alongside passionate problem solvers in Tamil Nadu and beyond.
            </p>
            <div className="careers-hero__actions">
              <a href="#openings" className="btn-primary">View Open Positions ↓</a>
              <a href="#culture" className="btn-ghost">Our Culture & Benefits</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CULTURE & PERKS ── */}
      <section className="careers-culture" id="culture">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-label">Why join us</span>
            <h2 className="section-header__title">Built for Innovation & Growth</h2>
            <p className="section-header__desc">
              We empower our team with the resources, flexibility, and support needed to produce world-class engineering and publishing solutions.
            </p>
          </div>

          <div className="perks-grid stagger">
            {CULTURES_PERKS.map((perk, i) => (
              <div className="perk-card reveal" key={perk.title} style={{ '--i': i }}>
                <div className="perk-card__icon" style={{ background: perk.color }}>{perk.icon}</div>
                <h3 className="perk-card__title">{perk.title}</h3>
                <p className="perk-card__desc">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOB OPENINGS ── */}
      <section className="careers-openings" id="openings">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-label">Current opportunities</span>
            <h2 className="section-header__title">Explore Open Roles</h2>
            <p className="section-header__desc">
              Find your next role across engineering, publishing operations, automation, or project management.
            </p>
          </div>

          {/* Department Filter Pills */}
          <div className="dept-filters reveal">
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                className={`dept-pill ${selectedDept === dept ? 'active' : ''}`}
                aria-pressed={selectedDept === dept}
                onClick={() => setSelectedDept(dept)}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Jobs List */}
          <div className="jobs-grid stagger">
            {jobsLoading ? (
              <div className="no-jobs-msg reveal"><p>Loading openings...</p></div>
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map((job, i) => (
                <div className="job-card reveal" key={job.id} style={{ '--i': i }}>
                  <div className="job-card__header">
                    <div>
                      <span className="job-card__dept">{job.department}</span>
                      <h3 className="job-card__title">{job.title}</h3>
                    </div>
                    <button
                      type="button"
                      className="btn-apply-card"
                      onClick={() => handleOpenModal(job)}
                    >
                      Apply Now →
                    </button>
                  </div>

                  <div className="job-card__meta">
                    <span className="meta-item">📍 {job.location}</span>
                    <span className="meta-item">⏱️ {job.jobType || job.type}</span>
                    <span className="meta-item">🎓 {job.experience}</span>
                  </div>

                  <p className="job-card__desc">{job.description || job.desc}</p>

                  <div className="job-card__tags">
                    {(job.tags || []).map(t => (
                      <span key={t} className="job-tag">{t}</span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-jobs-msg reveal">
                <p>No open positions in this department right now.</p>
                <button type="button" className="btn-outline-primary" onClick={() => handleOpenModal({ title: 'Spontaneous Candidate Application', department: 'General' })}>
                  Submit Spontaneous Resume →
                </button>
              </div>
            )}
          </div>

          <div className="spontaneous-banner reveal">
            <div className="spontaneous-banner__inner">
              <div>
                <h4 className="spontaneous-banner__title">Don't see the exact role you're looking for?</h4>
                <p className="spontaneous-banner__desc">We are always searching for top-tier talent. Send us your profile for upcoming vacancies.</p>
              </div>
              <button
                type="button"
                className="btn-white"
                onClick={() => handleOpenModal({ title: 'Spontaneous Application', department: 'General Talent Pool' })}
              >
                Submit Open Profile
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── HIRING PROCESS ── */}
      <section className="careers-process">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-label">How we hire</span>
            <h2 className="section-header__title">Our Transparent Hiring Workflow</h2>
            <p className="section-header__desc">
              A straightforward 4-step process designed to respect your time and evaluate mutual fit.
            </p>
          </div>

          <div className="process-grid stagger">
            {HIRING_STEPS.map((step, i) => (
              <div className="process-card reveal" key={step.step} style={{ '--i': i }}>
                <div className="process-card__step">{step.step}</div>
                <h3 className="process-card__title">{step.title}</h3>
                <p className="process-card__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQS ── */}
      <section className="careers-faq">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-label">Questions</span>
            <h2 className="section-header__title">Candidate FAQs</h2>
            <p className="section-header__desc">
              Everything you need to know about applying and interviewing at Arrow Data Tech.
            </p>
          </div>

          <div className="faq-list reveal">
            {CAREER_FAQS.map((faq) => (
              <CareerFaqItem key={faq.q} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ── APPLICATION MODAL ── */}
      {modalOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={handleCloseModal}>
          <div ref={dialogRef} className="modal-container" role="dialog" aria-modal="true" aria-labelledby="career-dialog-title" tabIndex="-1" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={handleCloseModal} aria-label="Close modal">✕</button>

            {formSubmitted ? (
              <div className="modal-success">
                <div className="modal-success__icon">✓</div>
                <h3 id="career-dialog-title" className="modal-success__title">Application sent</h3>
                <p className="modal-success__desc">
                  Thank you for applying for <strong>{appliedJob?.title}</strong>. The recruiting team will review the information and contact you if your profile matches an active requirement.
                </p>
                <button type="button" className="btn-modal-close" onClick={handleCloseModal}>Done</button>
              </div>
            ) : (
              <div className="modal-body">
                <div className="modal-header">
                  <span className="modal-badge">{appliedJob?.department || 'Career Application'}</span>
                  <h3 id="career-dialog-title" className="modal-title">Apply for {appliedJob?.title}</h3>
                  <p className="modal-subtitle">Fill in your details below to submit your application directly to our talent acquisition lead.</p>
                </div>

                <form onSubmit={handleApplySubmit} className="modal-form">
                  <div className="modal-form-row">
                    <div className="modal-group">
                      <label htmlFor="modal-name">Full Name *</label>
                      <input
                        type="text"
                        id="modal-name"
                        name="name"
                        autoComplete="name"
                        required
                        value={candidateForm.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="modal-group">
                      <label htmlFor="modal-email">Email Address *</label>
                      <input
                        type="email"
                        id="modal-email"
                        name="email"
                        autoComplete="email"
                        required
                        value={candidateForm.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="modal-form-row">
                    <div className="modal-group">
                      <label htmlFor="modal-phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="modal-phone"
                        name="phone"
                        autoComplete="tel"
                        required
                        value={candidateForm.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="modal-group">
                      <label htmlFor="modal-portfolio">LinkedIn or Portfolio URL</label>
                      <input
                        type="url"
                        id="modal-portfolio"
                        name="portfolio"
                        autoComplete="url"
                        value={candidateForm.portfolio}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>

                  <div className="modal-group">
                    <label htmlFor="modal-file">Resume / CV (PDF or DOCX) *</label>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        id="modal-file"
                        accept=".pdf,.docx,.doc"
                        required
                        aria-describedby={submitError ? 'career-submit-error' : undefined}
                        onChange={handleFileChange}
                        className="file-input-hidden"
                      />
                      <label htmlFor="modal-file" className="file-input-label">
                        📁 {candidateForm.fileName || 'Click to select resume file...'}
                      </label>
                    </div>
                  </div>

                  <div className="modal-group">
                    <label htmlFor="modal-cover">Brief Cover Note / Pitch</label>
                    <textarea
                      id="modal-cover"
                      name="coverNote"
                      rows="3"
                      value={candidateForm.coverNote}
                      onChange={handleInputChange}
                      placeholder="Tell us briefly why you are interested in this position..."
                    />
                  </div>

                  {submitError && <div id="career-submit-error" className="modal-submit-error" role="alert">{submitError}</div>}

                  <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting Application...' : 'Submit Application →'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default Careers;
