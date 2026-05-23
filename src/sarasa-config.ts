import path from "node:path";
import fs from "node:fs/promises";
import { pathExists, copyFile, readFile } from "./fs-utils.js";
import type { ResolvedConfig } from "./config.js";

function updateFamilyNaming(
  family: { naming?: Record<string, string> },
  names: Record<string, string>
): void {
  const existing = family.naming ?? {};
  for (const locale of Object.keys(existing)) {
    // For locales we have a new name for, use it; keep existing for others
    if (names[locale]) {
      existing[locale] = names[locale];
    }
  }
  // Also add any new locales not present in the original
  for (const [locale, name] of Object.entries(names)) {
    if (!existing[locale]) {
      existing[locale] = name;
    }
  }
  family.naming = existing;
}

async function patchVerdafilePrefix(workDir: string): Promise<void> {
  const verdafile = path.join(workDir, "verdafile.mjs");
  const backupPath = path.join(workDir, "verdafile.mjs.orig");

  if (!(await pathExists(backupPath))) {
    await copyFile(verdafile, backupPath);
  }

  let content = await fs.readFile(verdafile, "utf8");
  content = content.replace(
    /const PREFIX = `Sarasa`/,
    "const PREFIX = `SarasaAdwaita`"
  );
  // Cap hinting jobs to avoid OOM on high-core machines (128 workers × font data = memory bomb)
  content = content.replace(
    /const JHint = oracle\("hinting-jobs", async \(\) => os\.cpus\(\)\.length\);/,
    'const JHint = oracle("hinting-jobs", async () => Math.min(os.cpus().length, 64));'
  );
  await fs.writeFile(verdafile, content, "utf8");
}

export async function applySarasaConfig(config: ResolvedConfig): Promise<void> {
  const sarasaWorkDir = path.join(config.paths.work, "Sarasa-Gothic");
  const configPath = path.join(sarasaWorkDir, "config.json");
  const backupPath = path.join(sarasaWorkDir, "config.json.orig");

  if (!(await pathExists(backupPath))) {
    await copyFile(configPath, backupPath);
  }

  const raw = await fs.readFile(configPath, "utf8");
  const sarasaConfig = JSON.parse(raw);

  sarasaConfig.familyOrder = config.sarasa.familyOrder;

  const families = sarasaConfig.families;
  if (!families?.Gothic || !families?.Ui || !families?.Mono) {
    throw new Error("Sarasa config is missing required families");
  }

  families.Gothic.latinGroup = config.sarasa.latinGroups.sans;
  updateFamilyNaming(families.Gothic, config.sarasa.familyNames.gothic);

  families.Ui.latinGroup = config.sarasa.latinGroups.sans;
  updateFamilyNaming(families.Ui, config.sarasa.familyNames.ui);

  families.Mono.latinGroup = config.sarasa.latinGroups.mono;
  updateFamilyNaming(families.Mono, config.sarasa.familyNames.mono);

  if (families.Fixed) {
    families.Fixed.latinGroup = config.sarasa.latinGroups.monoFixed;
  }

  sarasaConfig.latinGroups = {
    ...(sarasaConfig.latinGroups ?? {}),
    [config.sarasa.latinGroups.sans]: {
      isCff: false,
      bakeFeatures: [],
      dropFeatures: config.sarasa.adwaitaSansDropFeatures
    },
    [config.sarasa.latinGroups.mono]: {
      isCff: false,
      bakeFeatures: [],
      dropFeatures: []
    },
    [config.sarasa.latinGroups.monoFixed]: {
      isCff: false,
      bakeFeatures: [],
      dropFeatures: []
    }
  };

  const formatted = JSON.stringify(sarasaConfig, null, "\t");
  await fs.writeFile(configPath, `${formatted}\n`);

  // Patch PREFIX in verdafile.mjs for correct output file naming
  await patchVerdafilePrefix(sarasaWorkDir);
}
