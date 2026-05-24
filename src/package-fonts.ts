import path from "node:path";
import fs from "node:fs/promises";
import { mkdtempSync } from "node:fs";
import { spawn } from "node:child_process";
import { loadConfig } from "./config.js";
import { Logger } from "./logger.js";

const REGIONS = ["CL", "SC", "TC", "HC", "J", "K"];
const TYPES = ["TTC", "TTF", "TTF-Unhinted"] as const;

interface PackageOptions {
  configPath?: string;
  outputDir?: string;
}

async function runZip(cwd: string, zipPath: string, files: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("zip", ["-q", "-9", "-X", zipPath, ...files], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`zip exited with code ${code}`));
    });
  });
}

export async function packageFonts(options: PackageOptions): Promise<void> {
  const config = await loadConfig(options.configPath);
  const logger = await Logger.create(
    path.join(config.paths.logs, `package-${new Date().toISOString().replace(/[:.]/g, '-')}.log`)
  );
  const outRoot = options.outputDir ?? path.join(config.paths.dist, "zips");
  await fs.mkdir(outRoot, { recursive: true });

  const docsDir = path.join(process.cwd(), "tmp-pkg-docs");
  await fs.mkdir(docsDir, { recursive: true });
  try {
    await fs.copyFile(path.join(process.cwd(), "README.md"), path.join(docsDir, "README.md"));
    await fs.copyFile(path.join(process.cwd(), "README.zh-CN.md"), path.join(docsDir, "README.zh-CN.md"));
    await fs.copyFile(path.join(process.cwd(), "LICENSE"), path.join(docsDir, "LICENSE"));
    const docFiles = ["README.md", "README.zh-CN.md", "LICENSE"];

    for (const region of REGIONS) {
      for (const type of TYPES) {
        // Gather font files
        let fontRelPaths: string[] = [];

        if (type === "TTC") {
          const ttcDir = path.join(config.paths.dist, "TTC");
          const allTtc = await fs.readdir(ttcDir);
          for (const f of allTtc) {
            if (f.endsWith(".ttc") && f.includes(region)) {
              fontRelPaths.push(path.join("TTC", f));
            }
          }
        } else {
          const srcDir = type === "TTF"
            ? path.join(config.paths.dist, "TTF")
            : path.join(config.paths.dist, "TTF-Unhinted");
          const allTtf = await fs.readdir(srcDir);
          for (const f of allTtf) {
            if (f.endsWith(".ttf") && f.includes(region)) {
              fontRelPaths.push(path.join(type === "TTF" ? "TTF" : "TTF-Unhinted", f));
            }
          }
        }

        if (fontRelPaths.length === 0) {
          logger.warn(`No files found for ${region}-${type}, skipping.`);
          continue;
        }

        // Stage files in a temp directory for clean zip contents
        const staging = await fs.mkdtemp("sarasa-pkg-");
        try {
          for (const doc of docFiles) {
            await fs.copyFile(path.join(docsDir, doc), path.join(staging, doc));
          }
          for (const rel of fontRelPaths) {
            const src = path.join(config.paths.dist, rel);
            const dst = path.join(staging, path.basename(rel));
            await fs.copyFile(src, dst);
          }

          const zipName = `SarasaAdwaita-${region}-${type}.zip`;
          const zipPath = path.join(outRoot, zipName);
          const allFiles = await fs.readdir(staging);
          await runZip(staging, zipPath, allFiles);

          const size = (await fs.stat(zipPath)).size;
          logger.info(`${zipName} (${(size / 1024 / 1024).toFixed(1)} MiB) — ${fontRelPaths.length} font files`);
        } finally {
          await fs.rm(staging, { recursive: true, force: true });
        }
      }
    }

    logger.info(`All packages written to ${outRoot}`);
  } finally {
    await fs.rm(docsDir, { recursive: true, force: true });
  }
}
