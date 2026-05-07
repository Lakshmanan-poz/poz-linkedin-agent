# Point One Zero — Marketing Site UI Kit

A hi-fi click-through of the POZ marketing site. Five surfaces — hero, work, services, contact, journal — composed from small JSX components that live beside this file.

> **Source note:** no live site or Figma was shared, so screens are derived directly from the brand guide (`assets/brand-guide.jpg`). This is a *principled extrapolation*, not a recreation of an existing site. If a real site exists, share the URL and we'll align the kit.

## Files

- `index.html` — full click-through. Tab bar switches between the five screens.
- `Nav.jsx` — fixed top nav (logomark + word nav + CTA).
- `Hero.jsx` — D1/D2 display hero with dark fill + primary-blue accent.
- `WorkGrid.jsx` — case-study grid with hover-reveal metadata.
- `ServicesList.jsx` — numbered-row services list (01 / 02 / 03…).
- `Contact.jsx` — two-column "start a project" form.
- `Footer.jsx` — minimal footer, large wordmark.

## Opening it

Open `index.html` in any browser. Built with inline Babel + React 18, no build step.
