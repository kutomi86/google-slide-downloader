# Release Checklist

Use this checklist when preparing a GitHub Release for Google Slides Downloader.

## Build

1. Update the version in `package.json`.
2. Run `npm run build`.
3. Verify `dist/` contains only the release-ready artifacts.

## Expected `dist/` Contents

- `Google Slides Downloader Setup <version>.exe`
- `Google Slides Downloader Setup <version>.exe.blockmap`
- `latest.yml`

## Publish to GitHub Releases

1. Create a release tag that matches `package.json`.
2. Create a GitHub Release for that tag.
3. Upload the contents of `dist/` to the release.
4. Confirm the uploaded assets are publicly accessible.

## Post-Publish Verification

1. Launch the installed app.
2. Use Settings > Check Updates.
3. Confirm the app detects the new release version.
4. Confirm the update download and restart flow works end to end.

## Notes

- Keep release publication manual for now.
- Do not upload the source repo or build folders.
- The update system depends on the installer, `latest.yml`, and the blockmap file.
