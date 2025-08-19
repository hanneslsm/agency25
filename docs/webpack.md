# Webpack Configuration for WithKit

This file explains the structure and usage of the **`webpack.config.js`**.

---

## Overview

The configuration handles:

* Automatic detection of SCSS and JS entries for global assets and blocks.
* Image optimization (JPEG, PNG, AVIF, WebP) with Sharp.
* SVG optimization with SVGO.
* BrowserSync live reload with proxy (development).
* Automatic version sync of `style.css` with `package.json`.

---

## Config Variables

At the top of `webpack.config.js`, you can adjust variables or override them via environment variables.

### Images

* `IMG_MAX_WIDTH` → Max width for resized images (default: 2560).
* `QUALITY_JPEG` → JPEG quality (default: 50).
* `QUALITY_PNG` → PNG quality (default: 50).
* `QUALITY_AVIF` → AVIF quality (default: 50).
* `QUALITY_WEBP` → WebP quality for originals (default: 70).
* `QUALITY_WEBP_CONVERT` → WebP quality for converted duplicates in `webp/` (default: 60).

### BrowserSync (development)

* `BS_PROXY` → Local dev URL (e.g. `https://mysite.local`).

  * If empty, BrowserSync is disabled.

### Toggles

* `COPY_IMAGES_IN_PROD` → Enable/disable image & SVG copy/optimization in production (default: true).

---

## Entries

Webpack automatically builds:

* **Global styles**: `global.scss`, `screen.scss`, `editor.scss` → CSS.
* **Global JS**: `global.js` → JS.
* **Blocks**: Auto-detects `index.js`, `view.js`, and `style.scss` in each block folder.
* **Block SCSS**: Recursive import of SCSS in `src/scss/blocks/`.
* **Block Styles**: Variations in `src/scss/block-styles/`.

---

## Development

Run:

```bash
npm start
```

If `BS_PROXY` is set, BrowserSync proxies your Local WP site and reloads on changes.

Example:

```bash
WITHKIT_BS_PROXY=https://withkit.local npm start
```

---

## Production Build

Run:

```bash
npm run build
```

This will:

* Minify assets.
* Optimize images and SVGs (if `COPY_IMAGES_IN_PROD` is true).
* Update the version in `style.css` to match `package.json`.

Example with custom quality:

```bash
WITHKIT_IMG_MAX_WIDTH=1920 WITHKIT_QUALITY_WEBP_CONVERT=75 npm run build
```

---

## Notes

* `style.css` version is always updated after each build.
* No need to manually register new block assets – detection is automatic.
* Adjust values via environment variables for quick project-specific tuning.
