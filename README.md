<div align="center">

# rdzTools

[![After Effects](https://img.shields.io/badge/After%20Effects-2024%2B-9999FF?style=for-the-badge&logo=adobeaftereffects&logoColor=white)](https://www.adobe.com/products/aftereffects.html)
[![CEP Panel](https://img.shields.io/badge/Extension-CEP%20Panel-1F2937?style=for-the-badge)](https://developer.adobe.com/after-effects/)
[![ExtendScript](https://img.shields.io/badge/Host-ExtendScript-F59E0B?style=for-the-badge)](https://developer.adobe.com/after-effects/)
[![Status](https://img.shields.io/badge/Status-Scaffold-34D399?style=for-the-badge)](/Users/ryder/Desktop/rdztools)

A tactile After Effects preset panel for text animation, layer styling, and fast look application.

Created by `ryder`.

</div>

## What rdzTools Is

`rdzTools` is an After Effects panel scaffold built around quick, satisfying motion-design actions instead of deep menu diving. The idea is simple: pick a layer, hit a preset, and get a useful animation or look immediately.

The current scaffold includes:

- A dockable CEP panel UI for browsing and applying presets.
- A host-side ExtendScript bridge for running After Effects actions.
- Starter text animation presets for common title and callout motion.
- Starter look presets for adding depth, bevel, shadow, and glassy styling.
- Utility actions for repeated comp setup tasks.
- A simple build script that assembles a distributable extension bundle.

## Feature Overview

### Text Animation

- Quick title moves like fade-ups, pop-ins, and horizontal slides.
- A structure that can grow into word, line, and character-based animation packs.
- A panel-first workflow designed for fast experimentation.

### Looks And Styling

- One-click passes for shadows, bevels, and glass-like treatments.
- A base for building more opinionated visual styles instead of generic utility presets.
- Support for turning flat shapes and layers into more dimensional design elements.

### Utilities

- Repeated setup actions like anchor centering and control null creation.
- A pattern for adding more production helpers without changing the panel structure.
- A clean separation between UI metadata and host-side logic.

### Panel Workflow

- Grouped preset browsing for text, looks, and utilities.
- Search support in the panel so preset libraries can scale.
- A host connection layer that also falls back into mock mode for UI iteration outside After Effects.

## Starter Presets

### Text Motion

- `Fade Up`
- `Pop In`
- `Slide Left`

### Looks

- `Soft Shadow`
- `Bevel Lite`
- `Liquid Glass`

### Utilities

- `Center Anchor`
- `Create Control Null`

The current `Liquid Glass` preset is a stylized first pass. It is meant to be refined into a stronger signature look rather than treated as a final finished effect.

## Installation

### Required

- Adobe After Effects with CEP panel support
- A local CEP extensions folder

### Steps

1. Build the extension bundle.
2. Copy `dist/rdzTools` into your CEP extensions directory.
3. Enable CEP debug mode if it is not already enabled on your machine.
4. Launch After Effects.
5. Open `rdzTools` from `Window > Extensions`.

Common CEP extension locations:

- macOS: `~/Library/Application Support/Adobe/CEP/extensions`
- Windows: `%APPDATA%/Adobe/CEP/extensions`

## Project Layout

```text
src/
  CSXS/manifest.xml
  client/
    index.html
    styles.css
    app.js
  host/
    rdzTools.jsx
scripts/
  build.mjs
docs/
  preset-roadmap.md
```

## Development

### Build From Source

```bash
node scripts/build.mjs
```

Artifacts are written to `dist/rdzTools/`.

### Package Script

If `npm` is installed on your machine:

```bash
npm run build
```

### Clean

```bash
node scripts/build.mjs --clean
```

## Version Information

| Component | Version |
|-----------|---------|
| Plugin Name | `rdzTools` |
| Scaffold Version | `0.1.0` |
| Panel Type | `CEP` |
| Host Layer | `ExtendScript` |

## Product Direction

This scaffold is aimed at a plugin that feels fast, tactile, and a little more art-directed than a standard utility panel.

Planned areas to expand:

- richer text animation packs
- layered shape looks and material treatments
- adjustable preset intensity controls
- favorites, recents, and curated preset collections
- stronger signature looks like polished glass, chrome, foam, and glow systems

## Notes

- This is a scaffold, not a finished commercial plugin.
- The current setup favors broad compatibility and fast iteration.
- If the product grows beyond preset application and UI-driven automation, the next architectural decision is whether to stay CEP-first or move some features into native plugin territory.

## References

- Adobe After Effects developer overview: [developer.adobe.com/after-effects](https://developer.adobe.com/after-effects/)
- CEP extension documentation: [Adobe Creative Cloud developer docs](https://developer.adobe.com/developer-console/docs/guides/extensions/)

