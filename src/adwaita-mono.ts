import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import AdmZip from "adm-zip";
import { emptyDir, ensureDir, pathExists, copyFile } from "./fs-utils.js";
import { runCommand, RunOptions } from "./exec.js";
import type { ResolvedConfig } from "./config.js";
import { weightToName } from "./styles.js";

export interface AdwaitaMonoResult {
  iosevkaVersion: string;
  patchedWeights: string[];
  outputDir: string;
}

function parseWeightBlocks(patchContent: string): Map<string, string> {
  const blocks = new Map<string, string>();
  const regex = /\[buildPlans\.AdwaitaMono\.weights\.(\w+)\][\s\S]*?(?=\n\[buildPlans\.AdwaitaMono\.weights\.|\s*$)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(patchContent))) {
    blocks.set(match[1], match[0].trim());
  }
  return blocks;
}

async function patchBuildPlan(buildPlanPath: string, patchFile: string): Promise<string[]> {
  const buildPlan = await fs.readFile(buildPlanPath, "utf8");
  const patchContent = await fs.readFile(patchFile, "utf8");
  const blocks = parseWeightBlocks(patchContent);
  const patched: string[] = [];
  let updated = buildPlan;

  for (const [name, block] of blocks.entries()) {
    const marker = new RegExp(`\\[buildPlans\\.AdwaitaMono\\.weights\\.${name}\\]`);
    if (!marker.test(buildPlan)) {
      updated = `${updated.trimEnd()}\n\n${block}\n`;
      patched.push(name);
    }
  }

  if (patched.length) {
    await fs.writeFile(buildPlanPath, updated);
  }
  return patched;
}

function parseIosevkaMeta(scriptContent: string): { version: string; hash: string } {
  const versionMatch = scriptContent.match(/IOSEVKA_VERSION=([0-9.]+)/);
  const hashMatch = scriptContent.match(/HASH=([0-9a-f]+)/);
  if (!versionMatch || !hashMatch) {
    throw new Error("Failed to parse Iosevka version/hash from update-fonts.sh");
  }
  return { version: versionMatch[1], hash: hashMatch[1] };
}

async function verifySha256(filePath: string, expected: string): Promise<void> {
  const data = await fs.readFile(filePath);
  const digest = crypto.createHash("sha256").update(data).digest("hex");
  if (digest !== expected) {
    throw new Error(`Checksum mismatch for ${filePath}`);
  }
}

async function extractZip(zipPath: string, destination: string): Promise<void> {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destination, true);
}

export async function buildAdwaitaMono(config: ResolvedConfig, options: RunOptions): Promise<AdwaitaMonoResult> {
  const adwaitaWorkDir = path.join(config.paths.work, "adwaita-fonts");
  const monoDir = path.join(adwaitaWorkDir, "mono");
  const buildPlanPath = path.join(adwaitaWorkDir, config.adwaitaMono.buildPlanPath);

  const patchedWeights = await patchBuildPlan(buildPlanPath, config.patches.adwaitaMonoWeights);

  const updateScriptPath = path.join(monoDir, "update-fonts.sh");
  const updateScript = await fs.readFile(updateScriptPath, "utf8");
  const { version, hash } = parseIosevkaMeta(updateScript);

  const archiveName = `Iosevka-v${version}.zip`;
  const archivePath = path.join(config.paths.cache, archiveName);
  const sourceUrl = `https://github.com/be5invis/Iosevka/archive/refs/tags/v${version}.zip`;

  await ensureDir(config.paths.cache);
  if (!(await pathExists(archivePath))) {
    await runCommand("curl", ["--fail", "--location", "--connect-timeout", "30", "--max-time", "600", "--retry", "5", "--retry-delay", "15", "-o", archivePath, sourceUrl], options);
  } else {
    options.logger.info(`Cache hit: ${archivePath}, skipping download`);
  }
  await verifySha256(archivePath, hash);

  const buildDir = path.join(monoDir, `Iosevka-${version}`);
  if (await pathExists(buildDir)) {
    await fs.rm(buildDir, { recursive: true, force: true });
  }
  await extractZip(archivePath, monoDir);

  const targetBuildPlan = path.join(buildDir, "private-build-plans.toml");
  await copyFile(buildPlanPath, targetBuildPlan);

  await runCommand("npm", ["install"], { ...options, cwd: buildDir });
  const buildCacheDir = path.join(
    buildDir,
    ".build",
    "TTF",
    config.adwaitaMono.buildPlanName
  );
  await ensureDir(buildCacheDir);
  await runCommand("npm", ["run", "build", "--", "ttf::AdwaitaMono"], { ...options, cwd: buildDir });

  const distDir = path.join(buildDir, "dist", "AdwaitaMono", "TTF");
  const outputDir = path.join(config.paths.artifacts, "adwaita-mono", "TTF");
  await ensureDir(outputDir);

  const files = await fs.readdir(distDir);
  for (const file of files) {
    if (!file.endsWith(".ttf")) {
      continue;
    }
    await copyFile(path.join(distDir, file), path.join(outputDir, file));
  }

  for (const weight of config.adwaitaMono.weights) {
    weightToName(weight);
  }

  return { iosevkaVersion: version, patchedWeights, outputDir };
}
