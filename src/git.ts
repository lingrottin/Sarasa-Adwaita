import path from "node:path";
import { pathExists } from "./fs-utils.js";
import { runCommand, runCommandCapture, RunOptions } from "./exec.js";
import type { RepoConfig } from "./config.js";

const COMMIT_REF = /^[0-9a-f]{7,40}$/i;

function isCommitRef(ref?: string): boolean {
  return !!ref && COMMIT_REF.test(ref);
}

async function ensureClean(dir: string, options: RunOptions): Promise<void> {
  const { stdout } = await runCommandCapture("git", ["-C", dir, "status", "--porcelain"], options);
  if (stdout.trim()) {
    throw new Error(`Upstream repo is not clean: ${dir}`);
  }
}

async function checkoutRef(dir: string, ref: string | undefined, options: RunOptions): Promise<void> {
  if (!ref) {
    return;
  }
  if (isCommitRef(ref)) {
    await runCommand("git", ["-C", dir, "checkout", "--detach", ref], options);
  } else {
    await runCommand("git", ["-C", dir, "checkout", ref], options);
    await runCommand("git", ["-C", dir, "reset", "--hard", `origin/${ref}`], options);
  }
  await runCommand("git", ["-C", dir, "clean", "-fdx"], options);
}

export async function ensureRepo(repoDir: string, repo: RepoConfig, options: RunOptions): Promise<void> {
  const gitDir = path.join(repoDir, ".git");
  const exists = await pathExists(gitDir);
  if (!exists) {
    await runCommand("git", ["clone", "--depth", "1", "--no-tags", repo.url, repoDir], options);
  }

  await ensureClean(repoDir, options);
  await runCommand("git", ["-C", repoDir, "fetch", "--prune", "--no-tags", "--depth", "1"], options);
  await checkoutRef(repoDir, repo.ref, options);
}

export async function cloneWorkRepo(
  upstreamDir: string,
  workDir: string,
  ref: string | undefined,
  options: RunOptions
): Promise<void> {
  await runCommand("git", ["clone", "--shared", "--no-hardlinks", upstreamDir, workDir], options);
  if (ref) {
    await checkoutRef(workDir, ref, options);
  }
}

export async function getHeadCommit(repoDir: string, options: RunOptions): Promise<string> {
  const { stdout } = await runCommandCapture("git", ["-C", repoDir, "rev-parse", "HEAD"], options);
  return stdout.trim();
}
