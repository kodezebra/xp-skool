# Release Guide

This project uses **Git tags** to trigger builds. Binaries are only built when you intentionally release, not on every push.

## Why Tags?

| Approach | Builds | Best For |
|----------|--------|----------|
| Every push | 6 builds × every commit | Active development, testing CI |
| Tags/releases only | 6 builds × releases | Production, saving resources |

Building on every push wastes CI minutes and accumulates artifacts. Using tags keeps things clean.

---

## Release Workflow

### 1. Update Version Numbers

Before releasing, update version in **both** files (they should match):

**src-tauri/tauri.conf.json:**
```json
"version": "1.0.0"
```

**src-tauri/Cargo.toml:**
```toml
[package]
version = "1.0.0"
```

### 2. Create a Tag

```bash
# Lightweight tag (simple)
git tag v1.0.0

# OR Annotated tag (recommended - includes message)
git tag -a v1.0.0 -m "Release v1.0.0 - Initial stable release"
```

### 3. Push the Tag

```bash
git push origin v1.0.0
```

**Important:** `git push` alone does NOT push tags. You must explicitly push tags.

### 4. Alternative: Create GitHub Release

```bash
# Install GitHub CLI first: brew install gh (macOS) or see github.com/cli
gh release create v1.0.0 --title "v1.0.0" --notes "Release notes here"
```

Or on GitHub.com: Go to **Releases** → **Draft a new release** → Select your tag

### 5. Download Built Artifacts

After CI completes:
1. Go to your repo on GitHub
2. Click **Actions** tab
3. Select the workflow run for your tag
4. Download artifacts from each job

---

## Tag Naming Convention

| Format | Example | Use Case |
|--------|---------|----------|
| `v*` | `v1.0.0` | Standard releases |
| `v*.*.*-*` | `v1.0.0-beta` | Pre-releases |

**Semantic Versioning (recommended):**
- `MAJOR.MINOR.PATCH`
- `1.0.0` → `1.1.0` (new feature) → `1.1.1` (bug fix)

---

## Useful Git Commands

```bash
# List all tags
git tag

# List tags with details
git tag -l -n

# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0

# Push all local tags
git push origin --tags

# Checkout (view) a tagged release
git checkout v1.0.0

# Go back to main branch
git checkout main
```

---

## CI Build Targets

When you push a tag, CI builds these artifacts:

| Platform | Artifact | File Type |
|----------|----------|-----------|
| Linux | deb | `.deb` package |
| Linux | rpm | `.rpm` package |
| Linux | appimage | `.AppImage` portable |
| Windows | nsis | `.exe` installer |
| macOS | app, dmg | `.app` + `.dmg` |
| Android | apk | `.apk` package |

Artifacts are available in the **Actions** tab for 90 days.

---

## Troubleshooting

**CI didn't trigger?**
- Make sure you pushed the tag: `git push origin v1.0.0`
- Check the tag exists: `git tag`

**Wrong version in artifact?**
- Update both `tauri.conf.json` AND `Cargo.toml`

**Need to re-run a build?**
- Go to Actions → Select workflow → Click "Re-run all jobs"
