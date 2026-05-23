# Building Sarasa Adwaita

This file contains the basic development and build instructions for Sarasa Adwaita.

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
- Wait for all TTFs to be generated (with hinting)

### 8. Collect build artifacts

- Copy TTF/TTC from Sarasa output to project `target/dist/`
- Generate build report

## Incremental Build

The project supports incremental builds:

- If `target/cache/Iosevka-*.zip` exists, download is skipped
- If Adwaita Mono TTFs exist, build is skipped (use `--skip-adwaita-mono` to force skip)
- Same Sarasa-Gothic work copy is reused

Available flags:

```bash
pnpm run build -- --skip-adwaita-mono   # Skip Adwaita Mono build
pnpm run build -- --skip-adwaita-sans   # Skip Adwaita Sans build
```

## Build Time & Resources

Building Sarasa Adwaita requires significant computational resources:

- **TTF-Unhinted phase** (~30 min on 16-core machine): Generates 180 unhinted TTF files. Most time spent on CJK glyph composition and compilation.
- **Hinting phase** (~7-8 hours on 128-core server): CJK glyph hinting uses the chlorophytum engine, performing multi-pass analysis (kanji0 → hangul0 → pass1 → pass2) on 300000+ CJK glyphs per weight. This phase is memory-bandwidth-bound; with 128 worker threads, each ~1-1.5GB RSS, OOM is likely. Recommend capping `--jobs` at 64.

Tip: If hinting is not needed, abort the build after the TTF-Unhinted phase completes. The unhinted fonts are usable in most scenarios.

## Output Font Naming

| Original | Now |
|---|---|
| Sarasa Gothic | Sarasa Adwaita Gothic |
| Sarasa UI | Sarasa Adwaita UI |
| Sarasa Mono | Sarasa Adwaita Mono |

File prefix unified to `SarasaAdwaita`, e.g., `SarasaAdwaitaGothicSC-Regular.ttf`.

## Troubleshooting

- **otc2otf not found**: Install Python AFDKO package (`pip install afdko`)
- **OOM killed**: Reduce hinting parallelism (cap `os.cpus().length` in verdafile.mjs)
- **Build stuck at clone**: Check network connectivity to GitHub

## Reference Links

- [Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic)
- [Adwaita Fonts](https://gitlab.gnome.org/GNOME/adwaita-fonts)
- [Iosevka](https://github.com/be5invis/Iosevka)
- [Inter](https://github.com/rsms/inter)
