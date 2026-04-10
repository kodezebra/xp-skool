# Project Guidelines

## Release & Tagging

This project builds **only on Git tags**, not on every push.

### When to Tag
- After completing a feature or set of changes
- Before publishing a release
- When ready to distribute binaries

### How to Release

1. Update version in **both** files (must match):
   ```bash
   # src-tauri/tauri.conf.json
   # src-tauri/Cargo.toml
   ```

2. Create and push tag:
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

3. CI builds all targets automatically:
   - Linux: deb, rpm, appimage
   - Windows: nsis
   - macOS: app, dmg
   - Android: apk

4. Download artifacts from GitHub Actions → Actions tab

### CI Triggers
| Trigger | Builds? |
|---------|---------|
| Push to `main` | No |
| Push tag (`v*`) | Yes |
| PR to `main` | Yes (lint/test only) |
| Manual dispatch | Yes |

## Code Conventions

### General Principles
- **DRY** (Don't Repeat Yourself) - Extract repeated logic into functions/components
- **KISS** (Keep It Simple, Stupid) - Simple > Clever
- **YAGNI** (You Aren't Gonna Need It) - Don't build features you might need
- **Prefer flat over nested** - Early returns over deep nesting
- **Small functions** - If a function does multiple things, split it up
- **Meaningful names** - Variables/functions should be self-documenting

### TypeScript/React
- Use `interface` for object shapes, `type` for unions/primitives
- Avoid `any` - Use `unknown` and type guard if needed
- Use `const` by default, `let` only when reassignment is needed
- Prefer functional components with hooks
- Co-locate: component + styles + tests in same folder
- Use early returns to reduce nesting:
  ```typescript
  // Bad
  if (user) {
    if (user.isActive) {
      // deep nesting
    }
  }

  // Good
  if (!user || !user.isActive) return;
  // flat, readable
  ```

### Rust/Tauri
- Prefer `?` operator over `match`/`unwrap` for error propagation
- Use structopt/clap for CLI arguments
- Keep Rust code minimal - do most logic in TypeScript/React
- Use `#[derive(Debug, Clone, ...)]` only when needed

### Styling
- Use **Tailwind CSS v4** (CSS-first config)
- Use **shadcn/ui** components as base
- Avoid inline styles unless dynamic
- Extract repeated class patterns into components
- Use CSS variables for theme values

### State Management
- Use React Query for server state
- Use React Context sparingly (only global truly global state)
- Prefer local state (`useState`) over lifting state up

### File Organization
```
src/
├── components/       # Reusable UI components
│   └── ui/           # shadcn/ui base components
├── features/         # Feature-specific code
│   ├── users/
│   └── settings/
├── hooks/            # Custom React hooks
├── lib/              # Utilities, API clients
├── pages/            # Route pages
└── types/            # Shared TypeScript types
```

### What to Avoid
- Premature optimization
- Over-abstraction (3 usages = maybe, 5+ = yes)
- Commented-out code (delete it, git has history)
- TODO comments (create issue instead)
- Magic numbers (use constants)
- Unnamed exports (use named exports)
- barrels (index.ts re-exports) unless 3+ imports

## Tauri Development

- Frontend: `bun run dev` (Vite dev server)
- Desktop: `bun run tauri dev`
- Build: `bun run tauri build`

## Project Structure

```
├── src/              # React frontend
├── src-tauri/        # Rust backend
│   ├── src/          # Rust source
│   ├── Cargo.toml    # Rust dependencies
│   └── tauri.conf.json  # Tauri config
├── .github/workflows/ # CI/CD
└── RELEASE_GUIDE.md  # Detailed release docs
```
