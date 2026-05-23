import path from "node:path";
import { loadConfig } from "./config.js";
import { Logger } from "./logger.js";
import { emptyDir, ensureDir, pathExists } from "./fs-utils.js";
import { ensureRepo, cloneWorkRepo, getHeadCommit } from "./git.js";
import { runCommandCapture } from "./exec.js";
import { buildAdwaitaMono } from "./adwaita-mono.js";
import { buildAdwaitaSans } from "./adwaita-sans.js";
import { prepareLatinSources } from "./latin-sources.js";
import { applySarasaConfig } from "./sarasa-config.js";
import { buildSarasa } from "./sarasa-build.js";
import { writeBuildReport } from "./report.js";
import { styleName } from "./styles.js";

export interface PipelineOptions {
  configPath: string;
  dryRun?: boolean;
  clean?: boolean;
  skipAdwaitaMono?: boolean;
  skipAdwaitaSans?: boolean;
}

async function requireCommand(cmd: string, logger: Logger): Promise<void> {
  const { stdout } = await runCommandCapture("bash", ["-lc", `command -v ${cmd}`], {
    logger
  });
  if (!stdout.trim()) {
    throw new Error(`Missing required command: ${cmd}`);
  }
}

async function prepareTarget(paths: {
  target: string;
  work: string;
  artifacts: string;
  dist: string;
  cache: string;
  reports: string;
  logs: string;
}): Promise<void> {
  await ensureDir(paths.target);
  await emptyDir(paths.work);
  await ensureDir(paths.artifacts);
  await emptyDir(paths.dist);
  await ensureDir(paths.cache);
  await ensureDir(paths.reports);
  await ensureDir(paths.logs);
}

async function monoArtifactsExist(config: ResolvedConfig): Promise<boolean> {
  const monoDir = path.join(config.paths.artifacts, "adwaita-mono", "TTF");
  for (const weight of config.adwaitaMono.weights) {
    for (const italic of [false, true]) {
      const file = path.join(monoDir, `AdwaitaMono-${styleName(weight, italic)}.ttf`);
      if (!(await pathExists(file))) return false;
    }
  }
  return true;
}

async function sansArtifactsExist(config: ResolvedConfig): Promise<boolean> {
  const sansDir = path.join(config.paths.artifacts, "adwaita-sans", "TTF");
  for (const weight of config.adwaitaSans.weights) {
    for (const italic of [false, true]) {
      const file = path.join(sansDir, `AdwaitaSans-${styleName(weight, italic)}.ttf`);
      if (!(await pathExists(file))) return false;
    }
  }
  return true;
}

export async function runPipeline(options: PipelineOptions): Promise<void> {
  const config = await loadConfig(options.configPath);
  const logFile = path.join(config.paths.logs, `run-${Date.now()}.log`);
  const logger = await Logger.create(logFile);
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
  const baseOptions = { logger, dryRun: options.dryRun, env };

  try {
    await requireCommand("git", logger);
    await requireCommand("npm", logger);
    await requireCommand("pnpm", logger);
    await requireCommand("python3", logger);
    await requireCommand("curl", logger);
    await requireCommand("ttfautohint", logger);
    await requireCommand("otf2ttf", logger);

    if (options.clean) {
      await emptyDir(config.paths.target);
    }
    await prepareTarget(config.paths);
    await ensureDir(config.paths.upstream);

    await ensureRepo(
      path.join(config.paths.upstream, "adwaita-fonts"),
      config.upstream.adwaitaFonts,
      baseOptions
    );
    await ensureRepo(
      path.join(config.paths.upstream, "Sarasa-Gothic"),
      config.upstream.sarasaGothic,
      baseOptions
    );

    await cloneWorkRepo(
      path.join(config.paths.upstream, "adwaita-fonts"),
      path.join(config.paths.work, "adwaita-fonts"),
      config.upstream.adwaitaFonts.ref,
      baseOptions
    );
    await cloneWorkRepo(
      path.join(config.paths.upstream, "Sarasa-Gothic"),
      path.join(config.paths.work, "Sarasa-Gothic"),
      config.upstream.sarasaGothic.ref,
      baseOptions
    );

    const adwaitaCommit = await getHeadCommit(
      path.join(config.paths.upstream, "adwaita-fonts"),
      baseOptions
    );
    const sarasaCommit = await getHeadCommit(
      path.join(config.paths.upstream, "Sarasa-Gothic"),
      baseOptions
    );

    // --- Incremental / skip logic ---
    const monoCached = await monoArtifactsExist(config);
    const sansCached = await sansArtifactsExist(config);

    let monoResult: import("./adwaita-mono.js").AdwaitaMonoResult | undefined;
    if (options.skipAdwaitaMono) {
      logger.info("Skipping Adwaita Mono build (--skip-adwaita-mono).");
    } else if (monoCached) {
      logger.info("Adwaita Mono artifacts found, skipping rebuild.");
    } else {
      monoResult = await buildAdwaitaMono(config, baseOptions);
    }

    let sansOutputDir: string | undefined;
    if (options.skipAdwaitaSans) {
      logger.info("Skipping Adwaita Sans build (--skip-adwaita-sans).");
    } else if (sansCached) {
      logger.info("Adwaita Sans artifacts found, skipping rebuild.");
      sansOutputDir = path.join(config.paths.artifacts, "adwaita-sans", "TTF");
    } else {
      sansOutputDir = await buildAdwaitaSans(config, baseOptions);
    }

    await prepareLatinSources(config);
    await applySarasaConfig(config);
    const sarasaOutputDir = await buildSarasa(config, baseOptions);

    await writeBuildReport(config, {
      adwaitaCommit,
      sarasaCommit,
      iosevkaVersion: monoResult?.iosevkaVersion ?? "(cached)",
      patchedWeights: monoResult?.patchedWeights ?? ["(cached)"],
      sarasaOutputDir,
      adwaitaSansDir: sansOutputDir ?? "(skipped)",
      adwaitaMonoDir: monoResult?.outputDir ?? "(cached)"
    });

    logger.info("Pipeline completed.");
  } finally {
    logger.close();
  }
}

export async function fetchUpstream(options: PipelineOptions): Promise<void> {
  const config = await loadConfig(options.configPath);
  const logFile = path.join(config.paths.logs, `fetch-${Date.now()}.log`);
  const logger = await Logger.create(logFile);
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
  const baseOptions = { logger, dryRun: options.dryRun, env };

  try {
    await requireCommand("git", logger);
    await ensureDir(config.paths.upstream);
    await ensureRepo(
      path.join(config.paths.upstream, "adwaita-fonts"),
      config.upstream.adwaitaFonts,
      baseOptions
    );
    await ensureRepo(
      path.join(config.paths.upstream, "Sarasa-Gothic"),
      config.upstream.sarasaGothic,
      baseOptions
    );
    logger.info("Upstream fetch completed.");
  } finally {
    logger.close();
  }
}

export async function cleanTarget(options: PipelineOptions): Promise<void> {
  const config = await loadConfig(options.configPath);
  const logFile = path.join(config.paths.logs, `clean-${Date.now()}.log`);
  const logger = await Logger.create(logFile);

  try {
    await emptyDir(config.paths.target);
    logger.info("Target directory cleaned.");
  } finally {
    logger.close();
  }
}
