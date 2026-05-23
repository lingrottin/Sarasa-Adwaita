import path from "node:path";
import { ensureDir, copyFile } from "./fs-utils.js";
import type { ResolvedConfig } from "./config.js";
import { styleName } from "./styles.js";

export async function prepareLatinSources(config: ResolvedConfig): Promise<void> {
  const sarasaWorkDir = path.join(config.paths.work, "Sarasa-Gothic");
  const sourcesDir = path.join(sarasaWorkDir, "sources");

  const sansGroup = config.sarasa.latinGroups.sans;
  const monoGroup = config.sarasa.latinGroups.mono;
  const monoFixedGroup = config.sarasa.latinGroups.monoFixed;

  const sansOutDir = path.join(sourcesDir, sansGroup);
  const monoOutDir = path.join(sourcesDir, monoGroup);
  const monoFixedOutDir = path.join(sourcesDir, monoFixedGroup);

  await ensureDir(sansOutDir);
  await ensureDir(monoOutDir);
  await ensureDir(monoFixedOutDir);

  const sansArtifacts = path.join(config.paths.artifacts, "adwaita-sans", "TTF");
  for (const weight of config.adwaitaSans.weights) {
    for (const italic of [false, true]) {
      const style = styleName(weight, italic);
      const fileName = `AdwaitaSans-${style}.ttf`;
      await copyFile(path.join(sansArtifacts, fileName), path.join(sansOutDir, fileName));
    }
  }

  const monoArtifacts = path.join(config.paths.artifacts, "adwaita-mono", "TTF");
  for (const weight of config.adwaitaMono.weights) {
    for (const italic of [false, true]) {
      const style = styleName(weight, italic);
      const sourceName = `AdwaitaMono-${style}.ttf`;
      const monoTarget = `AdwaitaMonoN-${style}.ttf`;
      const fixedTarget = `AdwaitaMonoNFixed-${style}.ttf`;
      await copyFile(path.join(monoArtifacts, sourceName), path.join(monoOutDir, monoTarget));
      await copyFile(path.join(monoArtifacts, sourceName), path.join(monoFixedOutDir, fixedTarget));
    }
  }
}
