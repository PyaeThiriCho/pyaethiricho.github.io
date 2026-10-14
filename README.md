# Pyae Thiri Cho — Portfolio

A static portfolio site with no build step. Host the folder anywhere (GitHub Pages, Netlify).
To preview locally, use a local server such as VS Code "Live Server" so `data/profile.json` can load.

## Folder structure

```
index.html            Page content only (text, sections, links)
data/profile.json     Your details: education, experience, links (edit this)
404.html              "Page not found" page (GitHub Pages shows it automatically)
assets/
  css/style.css       All styles, grouped into numbered sections
  css/fonts.css       Loads the local fonts below
  js/main.js          Tabs, contact panel, contact form, profile data loader
  fonts/              DM Sans and Space Grotesk (from Google Fonts, OFL licence)
  vendor/             Third-party files, downloaded so the site needs no CDN:
    fontawesome/        Font Awesome Free 6.5.0 icons (solid, regular, brands)
    emailjs/            EmailJS browser library 4.4.1
  docs/               Pyae-Thiri-Cho-CV.pdf    (to add)
  img/                profile.webp              (GitHub profile photo, used on the page)
                      profile.jpg               (same photo, for link previews only)
                      handicrafts-project.webp  (from the handicrafts repo)
                      rosiva-project.webp       (from the rosivaflowershop repo)
                      To swap an image, replace the file and keep the same name.
                      Convert new photos to WebP, about 800px wide:
                        cwebp -q 78 -resize 800 0 photo.jpg -o assets/img/name.webp
```

## Common edits

- **Add a project or skill:** add an entry in `data/profile.json` (see below).
  Icons: https://fontawesome.com/v6/search?o=r&m=free (only Free solid, regular and brands icons show)
- **Change colours:** edit the variables at the top of `assets/css/style.css`.
- **Contact details:** search `index.html` for the email address and phone number.

## Updating your details: `data/profile.json`

Location, availability, LinkedIn, CV, skills, projects, education, experience,
certificates and languages all come from **`data/profile.json`**. Edit that file only; the page
updates itself. No HTML changes are needed.

| Field | What to put |
| --- | --- |
| `location`, `availability` | Short text shown under your title on the About tab |
| `linkedin` | Full LinkedIn URL, e.g. `https://www.linkedin.com/in/your-name` |
| `cv` | Path to your CV PDF, e.g. `assets/docs/Pyae-Thiri-Cho-CV.pdf` |
| `skills` | `name` and `icon` (a Font Awesome class, e.g. `fa-brands fa-laravel`) |
| `projects` | `title`, `description`, `features` (list), `tags` (list), `image` + `imageAlt`, or `icon` if there is no image yet, `code` (GitHub link), `demo` (live link, optional) |
| `education`, `experience` | `years`, `title`, `place`, plus `details` (one sentence) and/or `points` (a list) |
| `certificates` | `year`, `name`, `provider`, `link` (link is optional) |
| `languages` | `name`, `level` |

Rules:
- Leave a value as `""` or a list as `[]` to hide that part of the page.
- Add an entry by copying an existing `{ ... }` block; separate blocks with commas.
- No comma after the last item in a list. A JSON typo makes the Resume tab show
  an error message, and the browser console shows the line number.
- The current content is **sample data**. When it is all real, set
  `"isSampleData": false`. Do not publish before that.
- Preview with a local server (for example VS Code "Live Server"). Opening
  `index.html` by double-click cannot load the JSON file.

## Contact form (EmailJS) setup

The form now sends these values: `from_name`, `reply_to`, `title`, `description`.
In the EmailJS dashboard, open template `template_uxw3e7b` and set:

| Template field | Value |
| --- | --- |
| To Email | `pyaethiricho4@gmail.com` (type it in, do **not** use a variable) |
| Reply To | `{{reply_to}}` |
| From Name | `{{from_name}}` |
| Subject | `Portfolio: {{title}}` |
| Content | `{{from_name}} ({{reply_to}}) wrote: {{description}}` |

After the site is published, add its domain to the allowed list in the EmailJS
account security settings. This stops other sites from using your key.
Do it after publishing: the allowlist also blocks local testing.

Do **not** turn on the template's reCAPTCHA option. The form does not send a
reCAPTCHA token yet, so every message would be rejected.

## Hosting

The site is published with GitHub Pages at https://pyaethiricho.github.io/
from the `pyaethiricho.github.io` repository. To update it, upload the changed
files to that repository on GitHub; the live site refreshes within a few minutes.
