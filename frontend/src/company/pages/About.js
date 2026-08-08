import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './About.css';

/* ── useScrollReveal ─────────────────────────────────────── */
function useScrollReveal() {
    useEffect(() => {
        const t = setTimeout(() => {
            const els = document.querySelectorAll('.rv, .rv-l, .rv-r, .rv-s');
            const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
            const obs = new IntersectionObserver(
                entries => entries.forEach(e => {
                    if (e.isIntersecting) {
                        if (e.target.classList.contains('reveal') || e.target.classList.contains('reveal-left') || e.target.classList.contains('reveal-right')) {
                            e.target.classList.add('visible');
                        } else {
                            e.target.classList.add('vis');
                        }
                        obs.unobserve(e.target);
                    }
                }),
                { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
            );
            els.forEach(el => obs.observe(el));
            revealEls.forEach(el => obs.observe(el));
            return () => obs.disconnect();
        }, 80);
        return () => clearTimeout(t);
    }, []);
}

/* ── Animated counter ────────────────────────────────────── */
function Counter({ target, suffix = '', duration = 1800 }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const fired = useRef(false);

    useEffect(() => {
        const el = ref.current;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !fired.current) {
                fired.current = true;
                const start = performance.now();
                const tick = now => {
                    const p = Math.min((now - start) / duration, 1);
                    setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
                    if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
                obs.disconnect();
            }
        }, { threshold: 0.1 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [target, duration]);

    return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Data ─────────────────────────────────────────────────── */
const MILESTONES = [
    { year: '2008', title: 'Founded', desc: 'Arrow Data Tech established in Villupuram, Tamil Nadu with a vision to be the #1 E-publishing company globally.' },
    { year: '2011', title: 'XML Division', desc: 'Launched dedicated XML tagging division handling JATS, BITS and DTBook schemas for STM publishers worldwide.' },
    { year: '2014', title: 'ePub Centre', desc: 'Opened full ePub 2 & 3 conversion centre serving leading academic publishers including Higher-Ed and STM books.' },
    { year: '2017', title: '50+ Clients', desc: 'Crossed the milestone of global clients and expanded team to 30+ skilled professionals.' },
    { year: '2020', title: 'Digital Wing', desc: 'Added Digital Services, eLearning, Mobile Learning and App Development to our growing portfolio.' },
    { year: '2024', title: 'Global Recognition', desc: '3+ clients, 99.7% accuracy, serving publishers on every continent with end-to-end content solutions.' },
];

const VALUES = [
    { icon: '🎯', color: '#E92E68', bg: 'rgba(233,46,104,0.09)', title: 'Quality First', desc: 'Every process, every line, every tag is subjected to our 5C standard — Clear, Correct, Concise, Comprehensible, Consistent.' },
    { icon: '🤝', color: '#08AFC4', bg: 'rgba(8,175,196,0.09)', title: 'Client Partnership', desc: 'We treat every vendor\'s project as our own. Full co-operation, full accountability, on time every time.' },
    { icon: '💡', color: '#6B7280', bg: 'rgba(107, 114, 128,0.10)', title: 'Innovation', desc: 'Technology-driven solutions that keep pace with a rapidly changing publishing landscape — from print to ePub to HTML5.' },
    { icon: '🌍', color: '#7F878D', bg: 'rgba(127,135,141,0.10)', title: 'Inclusion', desc: 'Developing global leaders from within. Maintaining highest standards of diversity and inclusivity at every level.' },
    { icon: '🛡️', color: '#C91F57', bg: 'rgba(201,31,87,0.09)', title: 'Integrity', desc: 'Transparent pricing, fair returns for all stakeholders, and a commitment to social responsibility in everything we do.' },
    { icon: '⚡', color: '#08AFC4', bg: 'rgba(8,175,196,0.09)', title: 'Speed & Scale', desc: '100Mbps fibre internet, Airtel optical connectivity and 30+ nodes ensure zero-breakage delivery at any volume.' },
];

const TEAM_STATS = [
    { n: 3, s: '+', label: 'Global Clients', color: '#E92E68' },
    { n: 99, s: '.7%', label: 'Accuracy Rate', color: '#08AFC4' },
    { n: 30, s: '+', label: 'Expert Professionals', color: '#E92E68' },
    { n: 12, s: '+', label: 'Years in Publishing', color: '#08AFC4' },
];
/*
const FACILITIES = [
    { icon: '🖥️', text: 'Intel Core i5 Server, 16 GB RAM, 2 TB HDD' },
    { icon: '💻', text: '30 workstation nodes — i5/i7 Dual Core, 8 GB RAM' },
    { icon: '🌐', text: 'Airtel 100 Mbps fibre optical internet' },
    { icon: '🔒', text: 'High data security & enterprise-grade firewall' },
    { icon: '⚡', text: 'Online UPS with 300-min backup + Generator' },
    { icon: '📁', text: 'File transfer via FTP, E-Mail, DVD & USB' },
];
*/

const INDUSTRIES = [
    { name: 'STM Publishing', icon: '🔬' },
    { name: 'Higher Education', icon: '🎓' },
    { name: 'Trade Publishing', icon: '📚' },
    { name: 'E-Learning', icon: '💻' },
    { name: 'Healthcare', icon: '🏥' },
    { name: 'Legal & Compliance', icon: '⚖️' },
    { name: 'Government', icon: '🏛️' },
    { name: 'Corporate Training', icon: '🏢' },
];

/* ── Component ───────────────────────────────────────────── */
export default function About() {
    useScrollReveal();

    return (
        <main id="main-content" className="about-page" tabIndex="-1">

            {/* ══════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════ */}
            <section className="ab-hero">
                <div className="ab-hero__bg" />
                <div className="ab-hero__grid" />
                <div className="container">
                    <div className="ab-hero__inner">
                        <div className="ab-hero__left">
                            <div className="ab-hero__eyebrow">
                                <span className="ab-hero__dot" />
                                About Arrow Data Tech
                            </div>
                            <h1 className="ab-hero__title">
                                Innovations<br />
                                <span className="ab-hero__accent">Behind your Success</span>
                            </h1>
                            <p className="ab-hero__desc">
                                An E-publishing company with unmatched expertise in content
                                processing and digital production — serving global publishers
                                with end-to-end solutions since 2008.
                            </p>
                            <div className="ab-hero__badges">
                                <span className="ab-badge ab-badge--blue">E-Publishing</span>
                                <span className="ab-badge ab-badge--teal">XML & ePub</span>
                                <span className="ab-badge ab-badge--purple">Digital Services</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════ */}
            <div className="ab-stats">
                {TEAM_STATS.map(s => (
                    <div className="ab-stats__item" key={s.label}>
                        <div className="ab-stats__val" style={{ color: s.color }}>
                            <Counter target={s.n} suffix={s.s} />
                        </div>
                        <div className="ab-stats__lbl">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════
          WHO WE ARE
      ══════════════════════════════════════════════════ */}
            <section className="ab-section ab-about">
                <div className="container">
                    <div className="ab-about__grid">
                        <div className="ab-about__left rv-l">
                            <span className="section-label">Who we are</span>
                            <h2 className="ab-section__title">
                                End-to-End Publishing<br />Expertise, Delivered.
                            </h2>
                            <p className="ab-body">
                                Arrow Data Tech is an E-publishing company that focuses on the fundamental
                                requirements of publishers and content owners worldwide. With a highly skilled
                                team, we deliver every project within the agreed timeline — treating it as our own.
                            </p>
                            <p className="ab-body">
                                We have unmatched expertise in content processing and digital production, combining
                                technology-driven workflows with meticulous human review to achieve accuracy levels
                                that consistently exceed 99.4%.
                            </p>
                            <div className="ab-about__chips">
                                <span className="ab-chip">STM & HSS Publishing</span>
                                <span className="ab-chip">Higher Education</span>
                                <span className="ab-chip">Trade Books</span>
                                <span className="ab-chip">Digital Content</span>
                            </div>
                        </div>
                        <div className="ab-about__right rv-r">
                            <div className="ab-quote-card">
                                <div className="ab-quote-card__mark">"</div>
                                <p className="ab-quote-card__text">
                                    End-to-end publishing services from Arrow Data Tech — content you can trust, timelines you can rely on.
                                </p>
                                <div className="ab-quote-card__footer">
                                    <div className="ab-quote-card__avatar">ADT</div>
                                    <div>
                                        <div className="ab-quote-card__name">Arrow Data Tech</div>
                                        <div className="ab-quote-card__role">Villupuram, Tamil Nadu · est. 2008</div>
                                    </div>
                                </div>
                            </div>
                            <div className="ab-about__cert-row">
                                {['ISO Quality', '5C Standard', 'JATS Certified', 'ePub Validated'].map(c => (
                                    <div className="ab-cert" key={c}>
                                        <span>✓</span>{c}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          MISSION & VISION (navy band)
      ══════════════════════════════════════════════════ */}
            <section className="ab-mv">
                <div className="container">
                    <div className="ab-mv__grid">
                        <div className="ab-mv__card rv">
                            <div className="ab-mv__icon">🚀</div>
                            <h3 className="ab-mv__heading">Our Mission</h3>
                            <p className="ab-mv__body">
                                We are a global organisation serving customers who need to publish knowledge,
                                information, or content. We optimise the total cost of publishing by offering
                                high quality, reliable, innovative, technology-driven solutions through a team
                                of positive thinking, joyful and empowered professionals. We deliver stakeholder
                                satisfaction while being a socially responsible organisation.
                            </p>
                        </div>
                        <div className="ab-mv__divider" />
                        <div className="ab-mv__card rv">
                            <div className="ab-mv__icon">👁️</div>
                            <h3 className="ab-mv__heading">Our Vision</h3>
                            <p className="ab-mv__body">
                                To be the number one company globally in our space — the trusted, preferred
                                partner for our customers through sustained customer delight. We shall be an
                                employer of choice, developing global leaders from within and maintaining the
                                highest standards of diversity and inclusivity. We will enhance stakeholder
                                satisfaction by delivering fair returns, while being a leader in Corporate
                                Social Responsibility.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          CORE VALUES
      ══════════════════════════════════════════════════ */}
            <section className="ab-section ab-values">
                <div className="container">
                    <div className="ab-section__header rv">
                        <span className="section-label">What drives us</span>
                        <h2 className="ab-section__title">Core Values</h2>
                        <p className="ab-section__sub">
                            Six principles that shape every project, every relationship, every result.
                        </p>
                    </div>
                    <div className="ab-values__grid stagger">
                        {VALUES.map((v, i) => (
                            <div className="ab-value-card rv" key={v.title} style={{ '--i': i }}>
                                <div className="ab-value-card__icon" style={{ background: v.bg, color: v.color }}>
                                    {v.icon}
                                </div>
                                <div className="ab-value-card__title">{v.title}</div>
                                <div className="ab-value-card__desc">{v.desc}</div>
                                <div className="ab-value-card__line" style={{ background: v.color }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          COMPANY MILESTONES (timeline)
      ══════════════════════════════════════════════════ */}
            <section className="ab-section ab-timeline-sec">
                <div className="container">
                    <div className="ab-section__header rv">
                        <span className="section-label">Our journey</span>
                        <h2 className="ab-section__title">Company Milestones</h2>
                    </div>
                    <div className="ab-timeline">
                        <div className="ab-timeline__line" />
                        {MILESTONES.map((m, i) => (
                            <div
                                key={m.year}
                                className={`ab-timeline__item rv${i % 2 === 0 ? '-l' : '-r'}`}
                                style={{ '--i': i }}
                            >
                                <div className="ab-timeline__dot">
                                    <span>{m.year}</span>
                                </div>
                                <div className="ab-timeline__card">
                                    <div className="ab-timeline__year-label">{m.year}</div>
                                    <div className="ab-timeline__title">{m.title}</div>
                                    <div className="ab-timeline__desc">{m.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          QUALITY ASSURANCE
      ══════════════════════════════════════════════════ */}
            <section className="ab-section ab-qa">
                <div className="container">
                    <div className="ab-qa__grid">
                        <div className="rv-l">
                            <span className="section-label">Quality assurance</span>
                            <h2 className="ab-section__title">99.997% Perfection<br />— Our Commitment</h2>
                            <p className="ab-body">
                                We implement Quality Assurance across every phase of our development cycle.
                                Arrow Data Tech has built its own QA and quality team to verify compatibility
                                and perfection of every deliverable.
                            </p>
                            <div className="ab-qa__pillars">
                                {[
                                    { icon: '🔗', text: 'Quality associated with every production line' },
                                    { icon: '🎓', text: 'Training and service excellence embedded in workflow' },
                                    { icon: '🛡️', text: 'Prevention-first and excellence-oriented methodology' },
                                    { icon: '📋', text: 'Appropriate procedures, techniques and documentation' },
                                ].map(p => (
                                    <div className="ab-qa__pillar" key={p.text}>
                                        <span className="ab-qa__pillar-icon">{p.icon}</span>
                                        <span>{p.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rv-r">
                            <div className="ab-qa__scorecard">
                                <div className="ab-qa__scorecard-title">Quality scorecard</div>
                                {[
                                    { label: 'XML Accuracy', pct: 99, color: '#E92E68' },
                                    { label: 'ePub Validation', pct: 98, color: '#08AFC4' },
                                    { label: 'On-time Delivery', pct: 97, color: '#6B7280' },
                                    { label: 'Client Satisfaction', pct: 96, color: '#7F878D' },
                                ].map(b => (
                                    <div className="ab-qa__bar-row" key={b.label}>
                                        <div className="ab-qa__bar-top">
                                            <span>{b.label}</span>
                                            <span style={{ color: b.color, fontWeight: 600 }}>{b.pct}%</span>
                                        </div>
                                        <div className="ab-qa__bar-track">
                                            <div
                                                className="ab-qa__bar-fill"
                                                style={{ width: `${b.pct}%`, background: b.color }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div className="ab-qa__badge">
                                    <span>🏆</span> Accuracy up to 99.997%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          INFRASTRUCTURE
      ══════════════════════════════════════════════════ */}
            {/* <section className="ab-section ab-infra">
                <div className="container">
                    <div className="ab-section__header rv">
                        <span className="section-label">Infrastructure</span>
                        <h2 className="ab-section__title">Built for reliability,<br />designed for scale</h2>
                    </div>
                    <div className="ab-infra__grid">
                        {FACILITIES.map((f, i) => (
                            <div className="ab-infra__item rv" key={i} style={{ '--i': i }}>
                                <div className="ab-infra__icon">{f.icon}</div>
                                <div className="ab-infra__text">{f.text}</div>
                            </div>
                        ))}
                    </div>
                    <div className="ab-infra__table-wrap rv">
                        <table className="ab-infra__table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Specification</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Server', 'Intel Core i5, 16 GB RAM, 2 TB HDD', '1'],
                                    ['Workstation Nodes', 'i5/i7 Dual Core 3GHz, 8 GB RAM, 5000 GB HDD', '30'],
                                    ['Operating System', 'Windows 10 / Latest Edition', '—'],
                                    ['Network', 'CAT 6 cabling throughout', '—'],
                                    ['Human Resource', 'Operators & QA Professionals', '30+'],
                                    ['UPS Backup', '300 Minutes of continuous backup', '—'],
                                    ['Internet', 'Airtel 100 Mbps Fibre Optical', '—'],
                                    ['File Transfer', 'FTP, E-Mail, DVD, USB', '—'],
                                ].map(([d, s, q]) => (
                                    <tr key={d}>
                                        <td>{d}</td>
                                        <td>{s}</td>
                                        <td className="ab-infra__qty">{q}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section> */}

            {/* ══════════════════════════════════════════════════
          INDUSTRIES SERVED
      ══════════════════════════════════════════════════ */}
            <section className="ab-section ab-industries">
                <div className="container">
                    <div className="ab-section__header rv">
                        <span className="section-label">Industries served</span>
                        <h2 className="ab-section__title">Trusted Across Every Vertical</h2>
                    </div>
                    <div className="ab-industries__grid stagger">
                        {INDUSTRIES.map((ind, i) => (
                            <div className="ab-industry-card rv" key={ind.name} style={{ '--i': i }}>
                                <span className="ab-industry-card__icon">{ind.icon}</span>
                                <span className="ab-industry-card__name">{ind.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          CONTACT / CTA
      ══════════════════════════════════════════════════ */}
            <section className="ab-cta">
                <div className="container">
                    <div className="ab-cta__inner rv">
                        <div className="ab-cta__left">
                            <h2 className="ab-cta__title">Ready to Work with Us?</h2>
                            <p className="ab-cta__sub">
                                Reach our team in Villupuram, Tamil Nadu — or start a project conversation online today.
                            </p>
                            <div className="ab-cta__details">
                                <div className="ab-cta__detail">
                                    <span>📍</span>
                                    <span>#07, M.G. Road, Near Roundana, Kottakuppam,<br />Vanur Taluk, Villupuram, Tamil Nadu – 605 104</span>
                                </div>
                                <div className="ab-cta__detail">
                                    <span>📞</span>
                                    <a href="tel:+919894562152">+91 9894562152</a>
                                </div>
                                <div className="ab-cta__detail">
                                    <span>✉️</span>
                                    <a href="mailto:usen@arrowdatatech.com">usen@arrowdatatech.com</a>
                                </div>
                                <div className="ab-cta__detail">
                                    <span>🌐</span>
                                    <a href="https://arrowdatatech.com" target="_blank" rel="noreferrer">www.arrowdatatech.com</a>
                                </div>
                            </div>
                        </div>
                        <div className="ab-cta__right">
                            <Link to="/contact" className="btn-primary ab-cta__btn">Book a free consultation →</Link>
                            <Link to="/services" className="btn-ghost ab-cta__btn-ghost">Explore our services</Link>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}




