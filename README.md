<div align="center">

# rdzTools

[![After Effects](https://img.shields.io/badge/After%20Effects-Plugin-9999FF?style=for-the-badge&logo=adobeaftereffects&logoColor=white)](https://www.adobe.com/products/aftereffects.html)
[![Version](https://img.shields.io/badge/Version-1.0.0-111827?style=for-the-badge)](/Users/ryder/Desktop/rdztools)

An After Effects CEP extension for motion presets, easing graphs, physics tools, and layer cleanup workflows.

Created by `ryduzz`.

</div>

## What It Does

`rdzTools` is an After Effects extension with three main areas:

- **Graphs** for reading and applying custom easing curves to selected keyframes
- **Presets** for applying text, layer entrance, and look treatments
- **Tools** for common rigging, timing, anchor, and layer utilities

It is built for getting useful motion, styling, physics, and cleanup operations onto selected layers quickly without rebuilding the same After Effects setups by hand.

## Features

### Graphs

- Draw and apply a custom keyframe easing curve
- Read easing from selected keyframes
- Reset the curve back to a default linear shape

### Presets

- Word text reveals from the left, right, top, or bottom with optional blur
- Word rotate entrance
- Character bounce entrance
- Layer fade, slide, scale, rotate, and blur entrances
- Soft shadow, long shadow, and liquid glass look presets
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

Build and install the extension into the local Adobe CEP extensions folder for testing:

```sh
npm run install:cep
```

Create a distributable zip from a fresh build:

```sh
npm run package
```

Create a signed ZXP from a fresh build:

```sh
ZXP_PASSWORD="your-certificate-password" npm run zxp
```

If `npm` is not available but Node is installed, run the package script directly:

```sh
node scripts/package.mjs
```

The local install command copies `dist/rdzTools` to `~/Library/Application Support/Adobe/CEP/extensions/rdzTools`. The zip package is written to `release/rdzTools-<version>.zip`. The signed ZXP is written to `release/rdzTools-<version>.zxp`. Generated `dist/` and `release/` output is intentionally ignored by git.

The ZXP script uses `/Users/ryder/Desktop/zxp-sign/ZXPSignCmd` and `certs/rdzTools.p12` by default. Override those paths with `ZXP_SIGN_CMD` or `ZXP_CERT` if needed. To timestamp the signature, pass `ZXP_TSA_URL`.

## Manual CEP Install

For local testing on macOS, run `npm run install:cep`.

To install a zip manually, unzip the release package and place the `rdzTools` folder in the Adobe CEP extensions directory for your platform.

Common extension directories:

- macOS: `~/Library/Application Support/Adobe/CEP/extensions/`
- Windows: `%APPDATA%\Adobe\CEP\extensions\`

After copying the folder, restart After Effects and open `Window > Extensions > rdzTools`.

## Unsigned Extension Setup

If installing from the zip instead of a signed ZXP, enable unsigned CEP extensions before After Effects will load the panel.

On macOS, enable CEP debug mode for the relevant CSXS versions:

```sh
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

Restart After Effects after changing CEP settings.

## Distribution

The package can be distributed as the generated zip with unsigned-install instructions, or as the signed ZXP for a smoother public install path.
