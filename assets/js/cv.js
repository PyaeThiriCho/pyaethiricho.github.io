/* Printable CV: fills cv.html from data/profile.json (same data as the site). */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const filled = (value) => typeof value === 'string' && value.trim() !== '';
  const asList = (value) => (Array.isArray(value) ? value : []);
  const shortUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  function el(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function entry({ title, date, place, details, points, tags, link }) {
    const box = el('div', 'cv-entry');
    const head = el('div', 'cv-entry-head');
    head.append(el('h3', '', title));
    if (filled(date)) head.append(el('span', 'cv-date', date));
    box.append(head);
    if (filled(place)) box.append(el('p', 'cv-place', place));
    if (filled(details)) box.append(el('p', '', details));
    const list = asList(points).filter(filled);
    if (list.length) {
      const ul = el('ul');
      list.forEach((point) => ul.append(el('li', '', point)));
      box.append(ul);
    }
    if (asList(tags).length) box.append(el('p', 'cv-tags', asList(tags).join(' · ')));
    if (filled(link)) {
      const a = el('a', 'cv-link', shortUrl(link));
      a.href = link;
      box.append(a);
    }
    return box;
  }

  // Fill a section and hide it if there is nothing to show
  function fill(name, container, items, render) {
    const nodes = items.map(render);
    container.replaceChildren(...nodes);
    document.querySelector(`[data-cv="${name}"]`).hidden = nodes.length === 0;
  }

  function render(profile) {
    $('#sampleBanner').hidden = !profile.isSampleData;

    if (filled(profile.summary)) {
      $('#cvSummary').textContent = profile.summary;
      $('#cvSummary').hidden = false;
    }
    if (filled(profile.location)) {
      $('#cvLocation').textContent = profile.location;
      $('#cvLocation').closest('li').hidden = false;
    }
    if (filled(profile.linkedin)) {
      const link = $('#cvLinkedin');
      link.href = profile.linkedin;
      link.textContent = shortUrl(profile.linkedin);
      link.closest('li').hidden = false;
    }

    const titled = (key) => (item) => item && filled(item[key]);

    fill('experience', $('#cvExperience'), asList(profile.experience).filter(titled('title')),
      (x) => entry({ title: x.title, date: x.years, place: x.place, details: x.details, points: x.points }));
    fill('projects', $('#cvProjects'), asList(profile.projects).filter(titled('title')),
      (x) => entry({ title: x.title, details: x.description, tags: x.tags, link: x.demo || x.code }));
    fill('education', $('#cvEducation'), asList(profile.education).filter(titled('title')),
      (x) => entry({ title: x.title, date: x.years, place: x.place, details: x.details, points: x.points }));

    fill('skills', $('#cvSkills'), asList(profile.skills).filter(titled('name')), (x) => el('li', '', x.name));
    fill('languages', $('#cvLanguages'), asList(profile.languages).filter(titled('name')), (x) => {
      const li = el('li', '', x.name);
      if (filled(x.level)) li.append(el('span', '', x.level));
      return li;
    });
    fill('certificates', $('#cvCertificates'), asList(profile.certificates).filter(titled('name')), (x) => {
      const li = el('li', '', x.name);
      const sub = [x.provider, x.year].filter(filled).join(', ');
      if (sub) li.append(el('span', '', sub));
      return li;
    });
  }

  $('#printButton').addEventListener('click', () => window.print());

  fetch('data/profile.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(render)
    .catch((error) => {
      console.error('Could not load data/profile.json:', error);
      const box = $('#cvError');
      box.textContent = location.protocol === 'file:'
        ? 'The CV loads its details from data/profile.json, which needs a web server (GitHub Pages or a local preview server).'
        : 'The CV details could not be loaded. Please try again later.';
      box.hidden = false;
    });
})();
