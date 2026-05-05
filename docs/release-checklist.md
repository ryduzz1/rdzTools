# rdzTools Release Checklist

Use this checklist before cutting a release artifact.

## Release Candidate

- Version: `0.1.0`
- Artifact: `release/rdzTools-0.1.0.zip`
- Package command: `npm run package`
- Extension folder inside zip: `rdzTools/`
- Distribution type: unsigned CEP zip for private/beta testing

## Build Verification

- [ ] Run `npm run package`
- [ ] Confirm the package command completes without errors
- [ ] Confirm `release/rdzTools-0.1.0.zip` exists
- [ ] Confirm the zip contains:
  - `rdzTools/client/index.html`
  - `rdzTools/client/app.js`
  - `rdzTools/client/styles.css`
  - `rdzTools/CSXS/manifest.xml`
  - `rdzTools/host/rdzTools.jsx`

## After Effects Smoke Test

Status: passed by Ryder on May 4, 2026.

- [x] Install built extension folder into the CEP extensions directory
- [x] Confirm panel opens from `Window > Extensions > rdzTools`
- [x] Confirm all tabs render correctly
- [x] Confirm every visible preset/tool applies successfully with valid selections
- [x] Confirm empty-selection and invalid-selection states show useful errors
- [x] Confirm graph read/apply works on selected keyframes
- [x] Confirm favorites and saved settings persist after panel reload/restart

## Release Hygiene

- [ ] Confirm `git status --short` only shows intentional release changes
- [ ] Confirm generated `dist/` and `release/` folders are not staged
- [ ] Confirm `.DS_Store` and other local files are not staged
- [ ] Update `CHANGELOG.md` before the first public or shared beta release
- [ ] Tag the release commit after the final package is verified

## Known Release Notes

- This release is currently an unsigned CEP package.
- Users may need to enable unsigned CEP extensions for local testing.
- Public distribution should use a signed ZXP or very clear unsigned-install instructions.
