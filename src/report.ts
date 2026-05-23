import path from "node:path";
import fs from "node:fs/promises";
import type { ResolvedConfig } from "./config.js";
import { ensureDir } from "./fs-utils.js";

export interface BuildReportContext {
  adwaitaCommit: string;
  sarasaCommit: string;
  iosevkaVersion: string;
  patchedWeights: string[];
  sarasaOutputDir: string;
  adwaitaSansDir: string;
  adwaitaMonoDir: string;
}

export async function writeBuildReport(
  config: ResolvedConfig,
  context: BuildReportContext
): Promise<string> {
  const reportDir = config.paths.reports;
  await ensureDir(reportDir);
  const reportPath = path.join(reportDir, "build-report.md");
  const timestamp = new Date().toISOString();
  const patched = context.patchedWeights.length ? context.patchedWeights.join(", ") : "无";

  const content = `# Build Report

- Time: ${timestamp}
- adwaita-fonts commit: ${context.adwaitaCommit}
- Sarasa-Gothic commit: ${context.sarasaCommit}
- Iosevka version: ${context.iosevkaVersion}
- Patched Adwaita Mono weights: ${patched}
- Sarasa build target: ${config.build.sarasaTarget}
- Sarasa output: ${context.sarasaOutputDir}
- Adwaita Sans output: ${context.adwaitaSansDir}
- Adwaita Mono output: ${context.adwaitaMonoDir}
`;

  await fs.writeFile(reportPath, content);
  return reportPath;
}
