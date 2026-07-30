import { Link } from 'react-router-dom';
import './Sitemap.css';

const SITE_GROUPS = [
  {
    title: 'Company',
    links: [
      ['Home', '/'],
      ['About Arrow Data Tech', '/about'],
      ['Careers', '/careers'],
      ['Contact', '/contact'],
    ],
  },
  {
    title: 'Digital Conversion Services',
    links: [
      ['All Services', '/services'],
      ['ePub Conversion', '/services/epub'],
      ['ePub Accessibility', '/services/epub-accessibility'],
      ['PDF Accessibility', '/services/pdf-accessibility'],
      ['XML Tagging', '/services/xml'],
      ['OCR Extraction', '/services/ocr-extraction'],
      ['Arab Language Services', '/services/arab-language'],
      ['Data Entry Services', '/services/data-entry'],
      ['Digital Marketing', '/services/marketing'],
    ],
  },
  {
    title: 'Development Services',
    links: [
      ['Web Development', '/services/web'],
      ['App Development', '/services/app-development'],
      ['Software Development', '/services/software-development'],
      ['AI Development', '/services/ai-development'],
      ['AI Agent Automation', '/services/ai-agent-automation'],
      ['Automation and RPA', '/services/automation'],
    ],
  },
  {
    title: 'Publishing Services',
    links: [
      ['STM/HSS Books and Journals', '/services/stm-hss'],
      ['College Textbooks', '/services/college-textbooks'],
      ['Book Publishing Services', '/services/publishing-services'],
    ],
  },
];

function Sitemap() {
  return (
    <main id="main-content" className="sitemap-page" tabIndex="-1">
      <section className="sitemap-hero">
        <div className="container sitemap-hero__inner">
          <p className="section-label">Site navigation</p>
          <h1>HTML sitemap</h1>
          <p>Browse every public route included in this frontend build.</p>
        </div>
      </section>
      <section className="sitemap-content">
        <div className="container sitemap-grid">
          {SITE_GROUPS.map((group) => (
            <nav key={group.title} className="sitemap-card" aria-labelledby={`sitemap-${group.title.replace(/\s+/g, '-').toLowerCase()}`}>
              <h2 id={`sitemap-${group.title.replace(/\s+/g, '-').toLowerCase()}`}>{group.title}</h2>
              <ul>
                {group.links.map(([label, to]) => (
                  <li key={to}><Link to={to}>{label}<span aria-hidden="true">→</span></Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Sitemap;
