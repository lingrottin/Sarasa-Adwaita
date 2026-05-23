import path from "node:path";
import { ensureDir } from "./fs-utils.js";
import { runCommand, RunOptions } from "./exec.js";
import type { ResolvedConfig } from "./config.js";
import { styleName } from "./styles.js";

export async function buildAdwaitaSans(config: ResolvedConfig, options: RunOptions): Promise<string> {
  const adwaitaWorkDir = path.join(config.paths.work, "adwaita-fonts");
  const sansDir = path.join(adwaitaWorkDir, "sans");
  const regularFont = path.join(sansDir, "AdwaitaSans-Regular.ttf");
  const italicFont = path.join(sansDir, "AdwaitaSans-Italic.ttf");
  const outputDir = path.join(config.paths.artifacts, "adwaita-sans", "TTF");

  await ensureDir(outputDir);

  for (const weight of config.adwaitaSans.weights) {
    const uprightStyle = styleName(weight, false);
    const italicStyle = styleName(weight, true);
    const uprightOut = path.join(outputDir, `AdwaitaSans-${uprightStyle}.ttf`);
    const italicOut = path.join(outputDir, `AdwaitaSans-${italicStyle}.ttf`);

    await runCommand(
      "python3",
      [
        "-m",
        "fontTools.varLib.instancer",
        regularFont,
        `opsz=${config.adwaitaSans.opsz}`,
        `wght=${weight}`,
        "--output",
        uprightOut
      ],
      options
    );
    await runCommand(
      "python3",
      [
        "-m",
        "fontTools.varLib.instancer",
        italicFont,
        `opsz=${config.adwaitaSans.opsz}`,
        `wght=${weight}`,
        "--output",
        italicOut
      ],
      options
    );
  }

  return outputDir;
}
