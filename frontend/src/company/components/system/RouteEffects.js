import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_META = {
  '/': {
    title: 'Arrow Data Tech | Publishing, XML and Digital Transformation',
    description: 'Enterprise publishing production, XML conversion, accessible eBooks, automation, web development and digital operations services.',
  },
  '/services': {
    title: 'Digital Services | Arrow Data Tech',
    description: 'Explore Arrow Data Tech services for ePub, XML, publishing production, web development, automation, data entry and digital marketing.',
  },
  '/about': {
    title: 'About Arrow Data Tech',
    description: 'Learn about Arrow Data Tech, its production capabilities, quality approach and digital delivery expertise.',
  },
  '/contact': {
    title: 'Contact Arrow Data Tech',
    description: 'Discuss a publishing, conversion, automation or digital development project with Arrow Data Tech.',
  },
  '/careers': {
    title: 'Careers at Arrow Data Tech',
    description: 'Explore open roles and career opportunities at Arrow Data Tech.',
  },
  '/sitemap': {
    title: 'HTML Sitemap | Arrow Data Tech',
    description: 'Browse the public pages and service routes available on the Arrow Data Tech website.',
  },
};

function getMeta(pathname) {
  if (pathname.startsWith('/services/')) {
    return {
      title: 'Service Details | Arrow Data Tech',
      description: 'Review service deliverables, process, tools and engagement options from Arrow Data Tech.',
    };
  }
  return ROUTE_META[pathname] || {
    title: 'Page Not Found | Arrow Data Tech',
    description: 'The requested Arrow Data Tech page could not be found.',
  };
}

function upsertMeta(name, content) {
  let element = document.head.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertProperty(property, content) {
  let element = document.head.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonical(pathname) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', `${window.location.origin}${pathname}`);
}

function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = getMeta(pathname);
    document.title = meta.title;
    upsertMeta('description', meta.description);
    upsertProperty('og:title', meta.title);
    upsertProperty('og:description', meta.description);
    upsertProperty('og:url', `${window.location.origin}${pathname}`);
    upsertMeta('twitter:title', meta.title);
    upsertMeta('twitter:description', meta.description);
    upsertCanonical(pathname);

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const main = document.getElementById('main-content');
    if (main) {
      main.setAttribute('tabindex', '-1');
      window.requestAnimationFrame(() => main.focus({ preventScroll: true }));
    }
  }, [pathname]);

  return null;
}

export default RouteEffects;
