import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { emptyDir, copyDir } from "./fs-utils.js";
import { runCommand, type RunOptions } from "./exec.js";
import type { ResolvedConfig } from "./config.js";

/** Map target name → verda output directory name */
const TARGET_OUT_DIR: Record<string, string> = {
  ttf: "TTF-Unhinted",
  ttc: "TTC",
  "ttf-unhinted": "TTF-Unhinted",
  "ttc-unhinted": "TTC-Unhinted",
};

/**
 * Package hinted TTFs into TTC files grouped by prefix (family+region).
 * Each group of files sharing the same prefix before the last `-` becomes one TTC.
 * Output goes to `dist/TTC/`.
 */
async function packageTtc(distHinted: string, distTtc: string, sarasaWorkDir: string, options: RunOptions): Promise<void> {
  await emptyDir(distTtc);
  const entries = await fs.readdir(distHinted);
  const files = entries.filter((f) => f.endsWith(".ttf"));
  const groups = new Map<string, string[]>();

  for (const file of files) {
    // e.g. "SarasaAdwaitaGothicCL-Regular.ttf" → prefix "SarasaAdwaitaGothicCL"
    const prefix = file.replace(/-[^/-]+\.ttf$/, "");
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push(file);
  }

  const ttcBundle = path.join(sarasaWorkDir, "node_modules/otb-ttc-bundle/bin/otb-ttc-bundle");
  for (const [prefix, members] of groups) {
    const inputs = members.sort().map((f) => path.join(distHinted, f));
    const output = path.join(distTtc, `${prefix}.ttc`);
    await runCommand("node", ["--max-old-space-size=16384", ttcBundle, "--verbose", "-x", "-o", output, ...inputs], options);
  }
}

/**
 * Build Sarasa-Gothic (unhinted), apply ttfautohint, then package hinted TTFs into TTCs.
 * When `skipBuild` is set, reuses existing TTF-Unhinted files instead of rebuilding.
 * Returns the hinted TTF output directory path.
 */
export async function buildSarasa(
  config: ResolvedConfig,
  options: RunOptions & { skipBuild?: boolean }
): Promise<string> {
  const sarasaWorkDir = path.join(config.paths.work, "Sarasa-Gothic");
  const target = config.build.sarasaTarget;

  if (!options.skipBuild) {
    // 1 – Install dependencies & build unhinted
    await runCommand("npm", ["install"], { ...options, cwd: sarasaWorkDir });
    await runCommand("npm", ["run", "build", "--", target], {
      ...options,
      cwd: sarasaWorkDir,
    });
  } else {
    options.logger.info("Skipping Sarasa npm build — using existing TTF-Unhinted files.");
  }

  // 2 – Copy unhinted output into dist/
  const outDirName = TARGET_OUT_DIR[target] ?? "TTF-Unhinted";
  const sarasaOutDir = path.join(sarasaWorkDir, "out", outDirName);
  const distUnhinted = path.join(config.paths.dist, outDirName);
  await emptyDir(distUnhinted);
  await copyDir(sarasaOutDir, distUnhinted);

  // 3 – Run ttfautohint on every unhinted TTF
  const distHinted = path.join(config.paths.dist, "TTF");
  await emptyDir(distHinted);

  const entries = await fs.readdir(distUnhinted);
  const files = entries.filter((f) => f.endsWith(".ttf")).sort();
  const concurrency = Math.max(1, os.cpus().length);
  const results: Promise<void>[] = [];
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    options.logger.info(`ttfautohint batch: ${batch.join(", ")}`);
    await Promise.all(batch.map(async (file) => {
      const inp = path.join(distUnhinted, file);
      const oup = path.join(distHinted, file);
      await runCommand("ttfautohint", [inp, oup], options);
    }));
  }

  // 4 – Package hinted TTFs into TTCs
  const distTtc = path.join(config.paths.dist, "TTC");
  await packageTtc(distHinted, distTtc, sarasaWorkDir, options);

  return distHinted;
}
