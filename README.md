# SMS - School Management System

A Tauri + React + TypeScript desktop application for school management.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Tauri 2 (Rust)
- **Database**: SQLite
- **Auth**: Argon2 password hashing, session-based auth

## Prerequisites

- [Bun](https://bun.sh) (latest)
- [Rust](https://rustup.rs) (latest)
- [Node.js](https://nodejs.org) (v18+)

## Clone & Setup

```bash
git clone https://github.com/kodezebra/xplatform-starter.git
cd xplatform-starter
bun install
```

## First Run - Setup Wizard

On first launch, you'll be guided through a quick setup:

1. **School Info**: Enter your school name
2. **Admin Account**: Create your admin account (name, email, password)
3. **Done!**: Start using the app

## Development

```bash
bun run tauri dev
```

## Build

```bash
bun run tauri build
```

## Downloads

Pre-built installers are automatically generated on every push via GitHub Actions.

**To download:**
1. Go to [Actions](https://github.com/kodezebra/xplatform-starter/actions)
2. Click a completed workflow run
3. Under "Artifacts", download only what you need:
   - **Linux**: `deb`, `rpm`, or `appimage`
   - **Windows**: `windows`
   - **macOS**: `macos`

**Linux installation:**
```bash
# .deb (Debian/Ubuntu)
sudo dpkg -i "SMS App_0.1.0_amd64.deb"

# .rpm (Fedora/RHEL)
sudo dnf install "SMS App-0.1.0-1.x86_64.rpm"

# .AppImage (portable)
chmod +x "SMS App_0.1.0_amd64.AppImage"
./"SMS App_0.1.0_amd64.AppImage"
```

## Project Structure

```
src/                  # React frontend
  components/         # UI components
  lib/               # Utilities, hooks, context
  routes/            # Page routes
src-tauri/           # Tauri/Rust backend
  src/               # Rust source
  Cargo.toml         # Rust dependencies
```
