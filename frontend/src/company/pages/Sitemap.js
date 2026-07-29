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
    title: 'Core services',
    links: [
      ['All services', '/services'],
      ['ePub conversion', '/services/epub'],
      ['XML tagging', '/services/xml'],
      ['Web development', '/services/web'],
      ['Automation and RPA', '/services/automation'],
      ['Data entry services', '/services/data-entry'],
      ['Digital marketing', '/services/marketing'],
    ],
  },
  {
    title: 'Publishing services',
    links: [
      ['STM/HSS books and journals', '/services/stm-hss'],
      ['College textbooks', '/services/college-textbooks'],
      ['Book publishing services', '/services/publishing-services'],
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
