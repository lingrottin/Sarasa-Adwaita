import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "jsonc-parser";
import { WEIGHT_NAME_MAP } from "./styles.js";

export interface RepoConfig {
  url: string;
  ref?: string;
}

export interface ProjectConfig {
  upstream: {
    adwaitaFonts: RepoConfig;
    sarasaGothic: RepoConfig;
  };
  paths?: {
    upstream?: string;
    target?: string;
  };
  patches?: {
    adwaitaMonoWeights?: string;
  };
  adwaitaSans: {
    opsz: number;
    weights: number[];
  };
  adwaitaMono: {
    buildPlanName: string;
    buildPlanPath: string;
    weights: number[];
  };
  sarasa: {
    familyOrder: string[];
    familyNames: {
      gothic: Record<string, string>;
      ui: Record<string, string>;
      mono: Record<string, string>;
    };
    latinGroups: {
      sans: string;
      mono: string;
      monoFixed: string;
    };
    adwaitaSansDropFeatures: string[];
  };
  build?: {
    sarasaTarget?: "ttf" | "ttc";
  };
}

export interface ResolvedPaths {
  root: string;
  configPath: string;
  upstream: string;
  target: string;
  work: string;
  artifacts: string;
  dist: string;
  reports: string;
  logs: string;
  cache: string;
}

export interface ResolvedConfig extends ProjectConfig {
  paths: ResolvedPaths;
  patches: {
    adwaitaMonoWeights: string;
  };
  build: {
    sarasaTarget: "ttf" | "ttc";
  };
}

function assertPresent(value: unknown, message: string): void {
  if (!value) {
    throw new Error(message);
  }
}

function resolvePath(root: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath);
}

function validateWeights(weights: number[], label: string): void {
  for (const weight of weights) {
    if (!WEIGHT_NAME_MAP[weight]) {
      throw new Error(`${label} weight ${weight} is not supported`);
    }
  }
}

export async function loadConfig(configPath: string): Promise<ResolvedConfig> {
  const absoluteConfigPath = resolvePath(process.cwd(), configPath);
  const raw = await fs.readFile(absoluteConfigPath, "utf8");
  const config = parse(raw) as ProjectConfig;

  assertPresent(config.upstream?.adwaitaFonts?.url, "Missing upstream.adwaitaFonts.url");
  assertPresent(config.upstream?.sarasaGothic?.url, "Missing upstream.sarasaGothic.url");
  assertPresent(config.adwaitaSans?.weights?.length, "Missing adwaitaSans.weights");
  assertPresent(config.adwaitaMono?.buildPlanPath, "Missing adwaitaMono.buildPlanPath");
  assertPresent(config.adwaitaMono?.buildPlanName, "Missing adwaitaMono.buildPlanName");
  assertPresent(config.sarasa?.familyOrder?.length, "Missing sarasa.familyOrder");
  assertPresent(config.sarasa?.familyNames?.gothic, "Missing sarasa.familyNames.gothic");

  validateWeights(config.adwaitaSans.weights, "Adwaita Sans");
  validateWeights(config.adwaitaMono.weights, "Adwaita Mono");

  const rootDir = path.dirname(absoluteConfigPath);
  const upstreamDir = resolvePath(rootDir, config.paths?.upstream ?? "upstream");
  const targetDir = resolvePath(rootDir, config.paths?.target ?? "target");
  const paths: ResolvedPaths = {
    root: rootDir,
    configPath: absoluteConfigPath,
    upstream: upstreamDir,
    target: targetDir,
    work: path.join(targetDir, "work"),
    artifacts: path.join(targetDir, "artifacts"),
    dist: path.join(targetDir, "dist"),
    reports: path.join(targetDir, "reports"),
    logs: path.join(targetDir, "logs"),
    cache: path.join(targetDir, "cache")
  };

  const patches = {
    adwaitaMonoWeights: resolvePath(
      rootDir,
      config.patches?.adwaitaMonoWeights ?? "patches/adwaita-mono-weights.toml"
    )
  };

  const build = {
    sarasaTarget: config.build?.sarasaTarget ?? "ttf"
  };

  return {
    ...config,
    patches,
    paths,
    build
  };
}
