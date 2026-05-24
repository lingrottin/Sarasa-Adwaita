# Copilot Instructions — Sarasa Adwaita

## Build Commands

```bash
pnpm install         # Install Node.js dependencies
pnpm run build       # Full build pipeline (tsx src/cli.ts build)
pnpm run fetch       # Fetch/update upstream repositories only
pnpm run clean       # Remove target/ directory
pnpm run build -- --skip-adwaita-mono  # Skip Adwaita Mono rebuild
pnpm run build -- --skip-adwaita-sans  # Skip Adwaita Sans rebuild
pnpm run build -- --skip-sarasa        # Skip Sarasa-Gothic rebuild
pnpm run build -- --dry-run            # Print commands without executing
pnpm run build -- --clean              # Clean target before running
```

No test or lint infrastructure exists in this project.

## Prerequisites

- Node.js >= 20 + pnpm
- Python 3 + fonttools (`pip install fonttools`)
- `ttfautohint`, `otf2ttf` (from AFDKO: `pip install afdko`)
- git, curl

## High-Level Architecture

This is a build automation script that creates a custom GNOME-flavored variant of Sarasa Gothic by replacing the original Inter/Iosevka Latin characters with Adwaita Sans and Adwaita Mono.

### Directory Layout

```
Sarasa-Adwaita/
├─ config.jsonc           # All settings: upstream repos, paths, font family names, weights
├─ src/                   # TypeScript build scripts (run via tsx)
├─ patches/               # TOML patch files (e.g., extra Iosevka weight definitions)
├─ upstream/              # Cloned upstream repos (adwaita-fonts, Sarasa-Gothic)
├─ target/                # Build artifacts, cache, temp files (gitignored)
│  ├─ work/               # Work copies of upstream repos (--shared clones)
│  ├─ artifacts/          # Built Adwaita Sans/Mono TTFs
│  ├─ dist/               # Final output (TTF-Unhinted, TTF, TTC, zips)
│  ├─ cache/              # Downloaded Iosevka source archives
│  ├─ reports/            # Build report markdown files
│  └─ logs/               # Per-run log files
```

### Pipeline Steps (pnpm run build)

1. **Clone/update** upstream repos (adwaita-fonts, Sarasa-Gothic)
2. **Download** Iosevka source matching the Sarasa-Gothic version
3. **Build Adwaita Mono** — builds Iosevka with Adwaita Mono's build plan (5 weights × roman/italic)
4. **Build Adwaita Sans** — instances variable fonts into static weights using fonttools
5. **Copy** Latin sources into Sarasa-Gothic's source directories
6. **Patch** Sarasa config (family names, Latin groups, output prefix)
7. **Run Sarasa-Gothic build** — produces 180 unhinted TTFs
8. **ttfautohint** all TTFs in parallel
9. **Package** hinted TTFs into TTC files
10. **Zip** by region (CL/SC/TC/HC/J/K) and format (TTF/TTC/TTF-Unhinted)

### Build Skip Logic

The pipeline checks for existing artifacts before running each step:
- Adwaita Mono: checks for 10 TTFs (5 weights × roman/italic) in `target/artifacts/adwaita-mono/TTF/`
- Adwaita Sans: same pattern in `target/artifacts/adwaita-sans/TTF/`
- Sarasa: checks for existing `target/work/Sarasa-Gothic/out/TTF-Unhinted/` (via `--skip-sarasa`)

## Key Codebase Conventions

### Import Style

All TypeScript imports use `.js` extensions as if importing compiled JS:
```typescript
import { loadConfig } from "./config.js";
import type { ResolvedConfig } from "./config.js";
```
This works because `tsx` handles the resolution. Always use `.js` extensions in import paths.

### Module Layout

Each module in `src/` is self-contained with a single exported function or class:

| File | Responsibility |
|---|---|
| `cli.ts` | Entry point, command parsing (Commander) |
| `pipeline.ts` | Orchestrates all build steps |
| `config.ts` | Loads & validates `config.jsonc` |
| `git.ts` | Clone/fetch upstream repos |
| `exec.ts` | Run subprocesses (`runCommand`, `runCommandCapture`) |
| `fs-utils.ts` | File operations (`ensureDir`, `emptyDir`, `copyDir`, `copyFile`, `pathExists`) |
| `styles.ts` | Weight→name mapping (200→ExtraLight, etc.) |
| `logger.ts` | Structured logger with timestamps and log files |
| `adwaita-mono.ts` | Build Adwaita Mono from Iosevka source |
| `adwaita-sans.ts` | Instance Adwaita Sans variable font → static TTFs |
| `latin-sources.ts` | Copy fonts into Sarasa-Gothic source directories |
| `sarasa-config.ts` | Patch Sarasa-Gothic's config.json and verdafile.mjs |
| `sarasa-build.ts` | Run Sarasa build + ttfautohint + TTC packaging |
| `package-fonts.ts` | Create zip archives by region and format |
| `report.ts` | Write build report markdown |

### Config-Driven Design

All paths, upstream URLs, font weights, family names, and build options live in `config.jsonc`. The `loadConfig()` function resolves relative paths and validates required fields. **Never hardcode paths** — add new settings to `config.jsonc` and pass `ResolvedConfig` around.

### Dry-Run Pattern

All operations that run subprocesses accept `{ dryRun?: boolean }` in their `RunOptions`. When `dryRun` is true, commands are logged but not executed. Always thread `dryRun` through new code.

### Logging Pattern

Logger is created at the start of an operation with a log file path, and closed in a `finally` block:
```typescript
const logger = await Logger.create(logFilePath);
try {
  // ... work
} finally {
  logger.close();
}
```

### Weight Handling

Five weights are used: 200 (ExtraLight), 300 (Light), 400 (Regular), 600 (SemiBold), 700 (Bold). The `WEIGHT_NAME_MAP` in `styles.ts` is the single source of truth. Style names follow a pattern: `ExtraLight`, `Regular`, `Italic`, `SemiBoldItalic`, etc. — use `styleName(weight, italic)` to generate them.

### Silent Failure Style

The codebase has no explicit error handling in most modules — errors propagate up to `pipeline.ts` via thrown exceptions. There are no catch blocks, retry logic, or fallback behavior in individual modules. When adding new code, follow this convention.

### Incremental Build Awareness

Functions that produce build artifacts check for their existence before re-running:
- Check files exist → skip if present
- Expose a `--skip-*` CLI flag for manual override
- Store skip status as `(cached)` or `(skipped)` in the build report

### Build Report

After each pipeline run, a `target/reports/build-report.md` is written with timestamps, commit hashes, Iosevka version, and output paths.
