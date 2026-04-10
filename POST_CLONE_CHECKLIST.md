# Post-Clone Checklist for Tauri Project

## Initial Setup
- [ ] `cd` into the project directory
- [ ] Update git remote: `git remote set-url origin <your-new-repo-url>`
- [ ] Verify remote: `git remote -v`

## Dependencies
- [ ] Run `bun install` (or `npm install`)
- [ ] Run `cd src-tauri && cargo fetch` to pre-fetch Rust dependencies

## Project Metadata
- [ ] Update `src-tauri/tauri.conf.json`:
  - `productName` - Display name of your app
  - `identifier` - Reverse-domain app ID (e.g., `com.yourname.yourapp`)
  - `version` - Start version (e.g., `0.1.0`)
  - Window titles if applicable

## Tauri Configuration
- [ ] Update `src-tauri/Cargo.toml`:
  - `package.name`
  - `package.version`
  - Binary names if needed
- [ ] Update `package.json`:
  - `name` field
  - App-specific dependencies

## Tauri CLI Setup
- [ ] Run `tauri init` if starting fresh (or `tauri add` for plugins)
- [ ] Add platforms: `tauri add android`, `tauri add ios` (if needed)

## Cleanup Starter Code
- [ ] Clear demo UI code in `src/`
- [ ] Remove/modify demo Tauri commands in `src-tauri/src/`
- [ ] Update icons in `src-tauri/icons/`
- [ ] Update `index.html` title

## Documentation
- [ ] Update `README.md` with new project info
- [ ] Update or remove `LICENSE` file
- [ ] Review `.github/` workflows (update repo names if needed)
- [ ] Read `RELEASE_GUIDE.md` to understand release process

## First Release
- [ ] Update version in `src-tauri/tauri.conf.json`
- [ ] Update version in `src-tauri/Cargo.toml`
- [ ] Update version in `package.json` (optional)
- [ ] Create first tag: `git tag v0.1.0`
- [ ] Push tag: `git push origin v0.1.0`
- [ ] Download artifacts from GitHub Actions

## Verification
- [ ] Run `bun run dev` to verify frontend works
- [ ] Run `bun run tauri dev` to verify Tauri works
- [ ] Run `bun run build` to verify build works
- [ ] Build for target platform: `bun run tauri build`

## Optional (Per Project)
- [ ] Setup database migrations
- [ ] Configure environment variables
- [ ] Add project-specific Tauri plugins
- [ ] Setup CI/CD workflows
- [ ] Add app icons for all platforms
