#!/usr/bin/env python3
"""Refresh the search-engine and AI-readable copies of data/profile.json.

The site builds most of its content with JavaScript, which many crawlers
(Google's first pass, ChatGPT, Claude, Perplexity) don't run. This script
writes the same facts as plain HTML so every crawler can read them:

  index.html  between <!-- seo:jsonld:start/end -->    structured data (schema.org)
  index.html  between <!-- seo:summary:start/end -->   readable profile summary
  llms.txt                                              plain-text profile for AI tools

Run it after editing data/profile.json:   python3 tools/update-seo.py
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://pyaethiricho.github.io/'
NAME = 'Pyae Thiri Cho'
ALT_NAME = 'Jayanti'
ROLE = 'Junior Web Developer'
EMAIL = 'pyaethiricho4@gmail.com'
GITHUB = 'https://github.com/PyaeThiriCho'

profile = json.loads((ROOT / 'data/profile.json').read_text(encoding='utf-8'))


def filled(value):
    return isinstance(value, str) and value.strip() != ''


def items(key, title_key='title'):
    return [x for x in profile.get(key) or [] if isinstance(x, dict) and filled(x.get(title_key))]


def e(text):
    return html.escape(text, quote=True)


skills = [s['name'] for s in items('skills', 'name')]
projects = items('projects')
experience = items('experience')
education = items('education')
certificates = items('certificates', 'name')
languages = items('languages', 'name')
city, _, country = (profile.get('location') or '').partition(', ')


# 1. Structured data ---------------------------------------------------------
person = {
    '@type': 'Person',
    '@id': SITE + '#person',
    'name': NAME,
    'alternateName': ALT_NAME,
    'jobTitle': ROLE,
    'description': profile.get('summary', ''),
    'url': SITE,
    'image': SITE + 'assets/img/profile.jpg',
    'email': 'mailto:' + EMAIL,
    'address': {'@type': 'PostalAddress', 'addressLocality': city, 'addressCountry': country},
    'knowsAbout': skills,
    'knowsLanguage': [l['name'] for l in languages],
    'alumniOf': [{'@type': 'EducationalOrganization', 'name': x['place'].split(',')[0]}
                 for x in education if filled(x.get('place'))],
    'sameAs': [GITHUB] + ([profile['linkedin']] if filled(profile.get('linkedin')) else []),
}
if filled(profile.get('availability')):
    person['seeks'] = {'@type': 'Demand', 'description': profile['availability']}

graph = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'ProfilePage',
            '@id': SITE + '#page',
            'url': SITE,
            'name': f'{NAME} ({ALT_NAME}) | {ROLE}',
            'mainEntity': {'@id': SITE + '#person'},
            'hasPart': [
                {
                    '@type': 'SoftwareSourceCode',
                    'name': p['title'],
                    'description': p.get('description', ''),
                    'codeRepository': p.get('code', ''),
                    'programmingLanguage': p.get('tags', []),
                    'author': {'@id': SITE + '#person'},
                }
                for p in projects
            ],
        },
        person,
    ],
}
jsonld = ('<script type="application/ld+json">\n'
          + json.dumps(graph, ensure_ascii=False, indent=2).replace('</', '<\\/')
          + '\n  </script>')


# 2. Readable summary (shown when JavaScript is off; read by crawlers) --------
def li_list(lines):
    return '<ul>' + ''.join(f'<li>{line}</li>' for line in lines) + '</ul>'


parts = [f'<h2>{e(NAME)} ({e(ALT_NAME)}), {e(ROLE)}</h2>']
facts = [profile.get(k) for k in ('location', 'availability') if filled(profile.get(k))]
if facts:
    parts.append(f'<p>{" · ".join(e(f) for f in facts)}</p>')
if filled(profile.get('summary')):
    parts.append(f'<p>{e(profile["summary"])}</p>')
if skills:
    parts.append(f'<h3>Skills</h3><p>{e(", ".join(skills))}</p>')
if projects:
    lines = []
    for p in projects:
        line = f'<strong>{e(p["title"])}</strong>'
        if filled(p.get('years')):
            line += f' ({e(p["years"])})'
        if filled(p.get('description')):
            line += f': {e(p["description"])}'
        if filled(p.get('code')):
            line += f' <a href="{e(p["code"])}">Code</a>'
        if filled(p.get('demo')):
            line += f' <a href="{e(p["demo"])}">Live demo</a>'
        lines.append(line)
    parts.append('<h3>Projects</h3>' + li_list(lines))


def timeline(title, entries):
    lines = []
    for x in entries:
        line = f'<strong>{e(x["title"])}</strong>'
        meta = [x.get(k) for k in ('place', 'years') if filled(x.get(k))]
        if meta:
            line += f', {e(", ".join(meta))}'
        points = [pt for pt in x.get('points') or [] if filled(pt)]
        if filled(x.get('details')):
            points.insert(0, x['details'])
        if points:
            line += ': ' + e(' '.join(points))
        lines.append(line)
    return f'<h3>{title}</h3>' + li_list(lines) if lines else ''


parts.append(timeline('Experience', experience))
parts.append(timeline('Education', education))
if certificates:
    parts.append('<h3>Certificates</h3>' + li_list(
        e(', '.join(v for v in (c['name'], c.get('provider'), c.get('year')) if filled(v)))
        for c in certificates))
parts.append(f'<p>Contact: <a href="mailto:{EMAIL}">{EMAIL}</a> · '
             f'<a href="{GITHUB}">GitHub</a> · <a href="cv.html">CV</a></p>')

summary = ('<noscript>\n      <section class="noscript-note">\n        '
           + '\n        '.join(p for p in parts if p)
           + '\n      </section>\n    </noscript>')


# 3. llms.txt -----------------------------------------------------------------
md = [f'# {NAME} ({ALT_NAME})', '',
      f'> {ROLE} in {profile.get("location", "")}. {profile.get("availability", "")}.', '']
if filled(profile.get('summary')):
    md += [profile['summary'], '']
md += ['## Contact', '', f'- Portfolio: {SITE}', f'- CV (PDF): {SITE}assets/docs/Pyae-Thiri-Cho-CV.pdf',
       f'- Email: {EMAIL}', f'- GitHub: {GITHUB}']
if filled(profile.get('linkedin')):
    md.append(f'- LinkedIn: {profile["linkedin"]}')
md += ['', '## Skills', '', ', '.join(skills), '', '## Projects', '']
for p in projects:
    title = f'[{p["title"]}]({p["code"]})' if filled(p.get('code')) else p['title']
    md.append(f'- {title}: {p.get("description", "")}'
              + (f' Built with {", ".join(p["tags"])}.' if p.get('tags') else ''))
for heading, entries in (('Experience', experience), ('Education', education)):
    if entries:
        md += ['', f'## {heading}', '']
        for x in entries:
            meta = ', '.join(x[k] for k in ('place', 'years') if filled(x.get(k)))
            body = ' '.join([x['details']] if filled(x.get('details')) else []
                            + [pt for pt in x.get('points') or [] if filled(pt)])
            md.append(f'- {x["title"]}' + (f' ({meta})' if meta else '') + (f': {body}' if body else ''))
if languages:
    md += ['', '## Languages', '', ', '.join(
        f'{l["name"]} ({l["level"]})' if filled(l.get('level')) else l['name'] for l in languages)]
(ROOT / 'llms.txt').write_text('\n'.join(md) + '\n', encoding='utf-8')


# Write into index.html -------------------------------------------------------
page = ROOT / 'index.html'
text = page.read_text(encoding='utf-8')
for name, block in (('jsonld', jsonld), ('summary', summary)):
    pattern = re.compile(rf'(<!-- seo:{name}:start -->).*?(<!-- seo:{name}:end -->)', re.S)
    if not pattern.search(text):
        raise SystemExit(f'index.html is missing the <!-- seo:{name}:start/end --> markers')
    text = pattern.sub(lambda m: f'{m.group(1)}\n    {block}\n    {m.group(2)}', text)
page.write_text(text, encoding='utf-8')
print('Updated index.html (structured data + summary) and llms.txt')
