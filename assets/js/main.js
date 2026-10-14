/* ==========================================================================
   Pyae Thiri Cho — Portfolio scripts
   1. Config   2. Accessibility helpers   3. Tab navigation
   4. Contact panel   5. Contact form   6. Image fallbacks   7. Footer year
   8. Profile data (data/profile.json)
   ========================================================================== */
(() => {
  'use strict';

  /* 1. Config ------------------------------------------------------------ */
  // The EmailJS public key is meant to be public. Protect the account with the
  // domain allowlist and reCAPTCHA in the EmailJS dashboard.
  const EMAILJS = {
    publicKey: 'j-9bE_TbKfGGegy8f',
    serviceId: 'service_xih6si8',
    templateId: 'template_uxw3e7b',
  };
  const CONTACT_EMAIL = 'pyaethiricho4@gmail.com';
  const TABS = ['home', 'skills', 'projects', 'resume'];
  const SITE_TITLE = 'Pyae Thiri Cho | Portfolio';
  const TAB_TITLES = {
    home: SITE_TITLE,
    skills: 'Skills | Pyae Thiri Cho',
    projects: 'Projects | Pyae Thiri Cho',
    resume: 'Resume | Pyae Thiri Cho',
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* 2. Accessibility helpers ------------------------------------------- */
  // Added here so index.html stays clean.
  // Icons are decoration, so screen readers should skip them.
  $$('i[class*="fa-"]').forEach((icon) => icon.setAttribute('aria-hidden', 'true'));

  // Links that open a new tab: add safe rel and a note for screen readers.
  $$('a[target="_blank"]').forEach((link) => {
    link.rel = 'noopener noreferrer';
    const note = document.createElement('span');
    note.className = 'visually-hidden';
    note.textContent = ' (opens in a new tab)';
    link.append(note);
  });

  /* 3. Tab navigation ---------------------------------------------------- */
  // Each tab has its own URL (#home, #skills, #projects), so links can be
  // shared, refreshed and navigated with the browser back button.
  const sections = $$('.page-section');
  const tabLinks = $$('.site-header a[href^="#"]');
  sections.forEach((section) => { section.tabIndex = -1; });   // lets focus move to a tab

  function currentTab() {
    const id = location.hash.slice(1);
    return TABS.includes(id) ? id : 'home';
  }

  function showTab(id, { moveFocus = false, scroll = true } = {}) {
    sections.forEach((section) => { section.hidden = section.id !== id; });
    tabLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = TAB_TITLES[id];
    if (scroll) window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    // Move keyboard / screen-reader focus to the new content
    if (moveFocus) $(`#${id}`).focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', () => showTab(currentTab(), { moveFocus: true }));

  // Clicking the tab you are already on just scrolls back to the top
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.getAttribute('href') === `#${currentTab()}`) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  });

  showTab(currentTab(), { scroll: false });
  // Opening a link like /#projects should start at the top of that tab
  window.addEventListener('load', () => window.scrollTo(0, 0));

  /* 4. Contact panel ----------------------------------------------------- */
  const modal = $('#contactModal');
  const panel = $('.contact-panel', modal);
  let lastFocused = null;

  const focusableIn = (root) =>
    $$('a[href], button:not([disabled]), input:not([tabindex="-1"]), textarea', root)
      .filter((el) => el.offsetParent !== null);

  function openContact() {
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    $('#contactName').focus({ preventScroll: true });
  }

  function closeContact() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lastFocused) lastFocused.focus();
  }

  $$('[data-open-contact]').forEach((btn) => btn.addEventListener('click', openContact));
  $$('[data-close-contact]').forEach((btn) => btn.addEventListener('click', closeContact));

  // Click on the dimmed background closes the panel
  modal.addEventListener('click', (event) => { if (event.target === modal) closeContact(); });

  // Escape closes; Tab stays inside the panel while it is open
  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('open')) return;
    if (event.key === 'Escape') { closeContact(); return; }
    if (event.key !== 'Tab') return;

    const items = focusableIn(panel);
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  /* 5. Contact form ------------------------------------------------------ */
  const form = $('#contactForm');
  const status = $('#contactStatus');
  const submitBtn = $('#contactSubmit');
  const submitLabel = $('.btn-label', submitBtn);

  if (window.emailjs) window.emailjs.init({ publicKey: EMAILJS.publicKey });

  function setStatus(message, type = '') {
    status.textContent = message;
    status.className = `form-status${type ? ` is-${type}` : ''}`;
  }

  function setSending(isSending) {
    submitBtn.disabled = isSending;
    submitLabel.textContent = isSending ? 'Sending…' : 'Send message';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Bots fill the hidden field; pretend it worked and send nothing
    if (form.elements.website.value) {
      form.reset();
      setStatus('Message sent successfully! Thank you for contacting me. ♡', 'success');
      return;
    }

    const data = {
      from_name: form.elements.name.value.trim(),
      reply_to: form.elements.email.value.trim(),
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim(),
    };

    if (!form.checkValidity() || Object.values(data).some((value) => !value)) {
      setStatus('Please fill in every field with a valid email address.', 'error');
      form.reportValidity();
      return;
    }

    if (!window.emailjs) {
      setStatus(`The form could not load. Please email ${CONTACT_EMAIL} directly.`, 'error');
      return;
    }

    setSending(true);
    setStatus('Sending your message…');
    try {
      await window.emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, data);
      form.reset();
      setStatus('Message sent successfully! Thank you for contacting me. ♡', 'success');
    } catch (error) {
      console.error('EmailJS error:', error);
      setStatus(`Sorry, the message could not be sent. Please try again or email ${CONTACT_EMAIL} directly.`, 'error');
    } finally {
      setSending(false);
    }
  });

  /* 6. Image fallbacks --------------------------------------------------- */
  // A missing image is hidden; photo frames show initials, project cards a soft gradient.
  function handleBrokenImage(img) {
    img.closest('.has-fallback')?.classList.add('img-missing');
  }

  $$('img').forEach((img) => {
    img.addEventListener('error', () => handleBrokenImage(img));
    // The image may have failed before this script ran
    if (img.complete && img.naturalWidth === 0) handleBrokenImage(img);
  });

  /* 7. Footer year ------------------------------------------------------- */
  $('#year').textContent = new Date().getFullYear();

  /* 8. Profile data (data/profile.json) -------------------------------- */
  // Location, links, education, experience, certificates and languages are
  // read from data/profile.json, so they can be updated without editing HTML.
  // Empty values hide their part of the page.
  const filled = (value) => typeof value === 'string' && value.trim() !== '';
  const asList = (value) => (Array.isArray(value) ? value : []);

  function el(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function timelineItem(entry) {
    const item = el('li', 'timeline-item');
    if (filled(entry.years)) item.append(el('p', 'timeline-date', entry.years));
    item.append(el('h4', '', entry.title));
    if (filled(entry.place)) item.append(el('p', 'timeline-place', entry.place));
    if (filled(entry.details)) item.append(el('p', '', entry.details));
    const points = asList(entry.points).filter(filled);
    if (points.length) {
      const list = el('ul', 'timeline-points');
      points.forEach((point) => list.append(el('li', '', point)));
      item.append(list);
    }
    return item;
  }

  function certificateCard(cert) {
    const card = el('article', 'card info-card');
    if (filled(cert.year)) card.append(el('p', 'timeline-date', cert.year));
    const heading = el('h4');
    if (filled(cert.link)) {
      const link = el('a', '', cert.name);
      link.href = cert.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.append(el('span', 'visually-hidden', ' (opens in a new tab)'));
      heading.append(link);
    } else {
      heading.textContent = cert.name;
    }
    card.append(heading);
    if (filled(cert.provider)) card.append(el('p', '', cert.provider));
    return card;
  }

  function languageChip(language) {
    const chip = el('li');
    chip.append(el('strong', '', language.name));
    if (filled(language.level)) chip.append(` ${language.level}`);
    return chip;
  }

  // Fill a list and show its block only when it has entries
  function fillBlock(name, container, entries, titleKey, render) {
    const valid = asList(entries).filter((entry) => entry && filled(entry[titleKey]));
    container.replaceChildren(...valid.map(render));
    $$(`[data-block="${name}"]`).forEach((block) => { block.hidden = valid.length === 0; });
  }

  // Point every [data-link=name] at the URL, or hide them all if it is empty
  function setLink(name, url) {
    const show = filled(url);
    $$(`[data-link="${name}"]`).forEach((link) => {
      link.hidden = !show;
      if (!show) return;
      link.href = url;
      if (link.hasAttribute('data-show-url')) {
        link.prepend(url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''));
      }
    });
    $$(`[data-block="${name}"]`).forEach((block) => { block.hidden = !show; });
  }

  function renderProfile(profile) {
    $$('[data-field]').forEach((node) => {
      const value = profile[node.dataset.field];
      node.textContent = filled(value) ? value : '';
      node.closest('li').hidden = !filled(value);
    });
    setLink('linkedin', profile.linkedin);
    setLink('cv', profile.cv);
    fillBlock('education', $('#educationList'), profile.education, 'title', timelineItem);
    fillBlock('experience', $('#experienceList'), profile.experience, 'title', timelineItem);
    fillBlock('certificates', $('#certificateList'), profile.certificates, 'name', certificateCard);
    fillBlock('languages', $('#languageList'), profile.languages, 'name', languageChip);

    if (profile.isSampleData) {
      console.warn('data/profile.json still holds sample data. Replace it and set "isSampleData" to false before publishing.');
    }
  }

  function showProfileError(error) {
    console.error('Could not load data/profile.json:', error);
    const box = $('#profileError');
    box.textContent = location.protocol === 'file:'
      ? 'Resume details only load when the site runs on a web server, such as GitHub Pages or a local preview server.'
      : 'Resume details could not be loaded right now. Please try again later.';
    box.hidden = false;
  }

  fetch('data/profile.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();   // throws if the JSON has a typo
    })
    .then(renderProfile)
    .catch(showProfileError);
})();
