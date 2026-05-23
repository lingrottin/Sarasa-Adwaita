import path from "node:path";
import { emptyDir, copyDir } from "./fs-utils.js";
import { runCommand, RunOptions } from "./exec.js";
import type { ResolvedConfig } from "./config.js";

export async function buildSarasa(config: ResolvedConfig, options: RunOptions): Promise<string> {
  const sarasaWorkDir = path.join(config.paths.work, "Sarasa-Gothic");
  // Sarasa-Gothic uses npm (has package-lock.json), not pnpm
  await runCommand("npm", ["install"], { ...options, cwd: sarasaWorkDir });
  await runCommand("npm", ["run", "build", "--", config.build.sarasaTarget], {
    ...options,
    cwd: sarasaWorkDir
  });

  const sarasaOutDir = path.join(sarasaWorkDir, "out", config.build.sarasaTarget);
  const targetOutDir = path.join(config.paths.dist, config.build.sarasaTarget);
  await emptyDir(targetOutDir);
  await copyDir(sarasaOutDir, targetOutDir);
  return targetOutDir;
}
