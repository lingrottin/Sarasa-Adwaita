# Building Sarasa Adwaita

This file contains the basic development and build instructions for Sarasa Adwaita.

> [!NOTE]
> Since this project is vibe-coded, instructing an AI agent to build this is recommended, for AI-written documents may **not** cover all the details, while debugging as a human requires a lot of time and effort.

## Directory Structure

```
Sarasa-Adwaita/
├─ package.json           # Node.js project config
├─ config.jsonc           # Project configuration (upstream repos, paths, family naming)
├─ upstream/              # Upstream Git repositories (not modified directly)
│  ├─ adwaita-fonts/      #   GNOME/adwaita-fonts
│  └─ Sarasa-Gothic/      #   be5invis/Sarasa-Gothic
├─ src/                   # Build script source (TypeScript)
├─ patches/               # Patch files (e.g. extra Iosevka weights)
├─ target/                # Working directory (build artifacts, cache, temp files)
└─ pnpm-workspace.yaml
```

## Dependencies

- Node.js >= 20 + pnpm
- Python3 + fonttools
- git / curl
- ttfautohint、AFDKO（otc2otf / otf2ttf）

## Quickstart

```bash
pnpm install
pnpm run build
```

## Workflow

`pnpm run build` automates the following steps:

### 1. Prepare upstream repositories

- Clone/update `adwaita-fonts` (with `--depth 1`)
- Clone/update `Sarasa-Gothic` (with `--depth 1`)
- Create work copies with `--shared` object reuse

### 2. Fetch Iosevka source

- Download Iosevka source zip matching the Sarasa-Gothic version
- Extract into work directory

### 3. Build Adwaita Mono (5 weights × roman/italic = 10 TTFs)

- Copy Adwaita Mono's Iosevka build plan (`private-build-plans.toml`)
- Append missing weight variants (ExtraLight, Light, SemiBold)
- Run Iosevka build: `npm run build -- ttf::AdwaitaMono`
- Output goes to `target/artifacts/AdwaitaMono/TTF-Unhinted/`

### 4. Build Adwaita Sans (5 weights × roman/italic = 10 TTFs)

- Instance static weights (opsz=14, wght=200/300/400/600/700) from Adwaita Sans variable font using `fonttools varLib.instancer`

### 5. Prepare Sarasa-Gothic Latin source directories

- Copy Adwaita Sans TTFs into `sources/AdwaitaSans/`
- Copy Adwaita Mono TTFs into `sources/AdwaitaMonoN/` and `sources/AdwaitaMonoNFixed/`

### 6. Apply Sarasa config patches

- Backup `config.json` as `config.json.orig`
- Backup `verdafile.mjs` as `verdafile.mjs.orig`
- Add `latinGroups` (AdwaitaSans, AdwaitaMonoN, AdwaitaMonoNFixed)
- Modify family names ("Sarasa Adwaita" / "更纱独黑" etc. for 6 locales)
- Modify `verdafile.mjs` output prefix to `SarasaAdwaita`

### 7. Run Sarasa-Gothic build

- Execute `npm run build -- ttf` in Sarasa-Gothic work directory
- Generates 180 unhinted TTF files (`TTF-Unhinted`) — Sarasa's own hinting is now skipped
- After Sarasa build finishes, our pipeline applies ttfautohint to all unhinted TTFs, then packages them into TTC files

### 8. Collect build artifacts

- Copy TTF/TTC from Sarasa output to project `target/dist/`
- Generate build report

## Incremental Build

The project supports incremental builds:

- If `target/cache/Iosevka-*.zip` exists, download is skipped
- If Adwaita Mono TTFs exist, build is skipped (use `--skip-adwaita-mono` to force skip)
- If Adwaita Sans TTFs exist, build is skipped (use `--skip-adwaita-sans` to force skip)
- If TTF-Unhinted files exist, Sarasa-Gothic rebuild is skipped (use `--skip-sarasa` to force skip)
- Same Sarasa-Gothic work copy is reused

Available flags:

```bash
pnpm run build -- --skip-adwaita-mono   # Skip Adwaita Mono build
pnpm run build -- --skip-adwaita-sans   # Skip Adwaita Sans build
pnpm run build -- --skip-sarasa         # Skip Sarasa-Gothic rebuild (reuse existing TTF-Unhinted)
```

## Build Time & Resources

Building Sarasa Adwaita requires significant computational resources:

- **TTF-Unhinted phase** (~30 min on 16-core machine, ~1.5h on 2-core): Generates 180 unhinted TTF files. Most time spent on CJK glyph composition and compilation.
- **ttfautohint phase** (~3 min on 16-core machine, parallel): Applies [ttfautohint](https://www.freetype.org/ttfautohint) to all 180 unhinted TTFs in parallel. Each font takes <15 seconds. Significantly faster than the original chlorophytum pipeline, which took ~1.7 hours per font (~100+ hours total for all 180 fonts on a 128-core server).
- **TTC packaging** (~10 min): Bundles hinted TTFs into TTC files using `otb-ttc-bundle`.

Tip: If hinting is not needed, the pipeline can be interrupted after the TTF-Unhinted phase completes. Unhinted fonts work well in most modern rendering environments.

## Output Font Naming

| Original | Now |
|---|---|
| Sarasa Gothic | Sarasa Adwaita Gothic |
| Sarasa UI | Sarasa Adwaita UI |
| Sarasa Mono | Sarasa Adwaita Mono |

File prefix unified to `SarasaAdwaita`, e.g., `SarasaAdwaitaGothicSC-Regular.ttf`.

## Troubleshooting

- **otc2otf not found**: Install Python AFDKO package (`pip install afdko`)
- **Build stuck at clone**: Check network connectivity to GitHub

## Reference Links

- [Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic)
- [Adwaita Fonts](https://gitlab.gnome.org/GNOME/adwaita-fonts)
- [Iosevka](https://github.com/be5invis/Iosevka)
- [Inter](https://github.com/rsms/inter)
