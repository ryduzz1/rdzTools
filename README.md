<div align="center">

# rdzTools

[![After Effects](https://img.shields.io/badge/After%20Effects-Plugin-9999FF?style=for-the-badge&logo=adobeaftereffects&logoColor=white)](https://www.adobe.com/products/aftereffects.html)
[![Status](https://img.shields.io/badge/Status-Beta-34D399?style=for-the-badge)](/Users/ryder/Desktop/rdztools)

An After Effects CEP panel for fast motion presets, graph easing, and layer cleanup tools.

Created by `ryder`.

</div>

## What It Does

`rdzTools` is a compact After Effects extension with three main areas:

- **Graphs** for reading and applying custom easing curves to selected keyframes
- **Presets** for applying text, layer entrance, and look treatments
- **Tools** for common rigging, timing, anchor, and layer utilities

The current version is focused on getting useful motion and styling onto selected layers quickly without rebuilding the same After Effects setups by hand.

## Current Features

### Graphs

- Draw and apply a custom keyframe easing curve
- Read easing from selected keyframes
- Reset the curve back to a default linear shape

### Presets

- Word blur text reveals from the left, right, top, or bottom
- Word rotate entrance
- Character bounce entrance
- Layer fade, slide, scale, rotate, and blur entrances
- Soft shadow, long shadow, bevel, and liquid glass look presets
- Per-preset settings with saved custom values
- Favorites for quick preset access

### Tools

- Move anchors to corners, edges, or center
- Center selected layers in the comp
- Precompose selected layers
- Fit selected layers to comp
- Freeze frames
- Sequence, duplicate, split, and reverse layers
- Enable motion blur
- Add Bounce controls to keyed transform properties
- Create a centered control null
- Save the current frame as a PNG
- Clear transform expressions

## Build And Package

Build the CEP extension folder:

```sh
npm run build
```

Create a release zip from a fresh build:

```sh
npm run package
```

If `npm` is not available but Node is installed, run the package script directly:

```sh
node scripts/package.mjs
```

The release artifact is written to `release/rdzTools-<version>.zip`. Generated `dist/` and `release/` output is intentionally ignored by git.

## Manual CEP Install

Unzip the release package and place the `rdzTools` folder in the Adobe CEP extensions directory for your platform.

Common extension directories:

- macOS: `~/Library/Application Support/Adobe/CEP/extensions/`
- Windows: `%APPDATA%\Adobe\CEP\extensions\`

After copying the folder, restart After Effects and open `Window > Extensions > rdzTools`.

## Unsigned Extension Setup

This beta package is currently unsigned. Testers may need to enable unsigned CEP extensions before After Effects will load the panel.

On macOS, enable CEP debug mode for the relevant CSXS versions:

```sh
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

Restart After Effects after changing CEP settings.

## Release Status

`rdzTools` is currently a beta CEP package. The current panel has passed a manual After Effects smoke test, but public distribution should use a signed ZXP or provide clear unsigned-install instructions.
