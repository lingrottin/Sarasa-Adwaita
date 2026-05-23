import { spawn } from "node:child_process";
import type { Logger } from "./logger.js";

export interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  dryRun?: boolean;
  logger: Logger;
}

export async function runCommand(command: string, args: string[], options: RunOptions): Promise<void> {
  const commandLine = [command, ...args].join(" ");
  if (options.dryRun) {
    options.logger.info(`[dry-run] ${commandLine}`);
    return;
  }

  options.logger.command(commandLine, options.cwd);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      options.logger.raw(chunk);
    });
    child.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
      options.logger.raw(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed (${code}): ${commandLine}`));
      }
    });
  });
}

export async function runCommandCapture(
  command: string,
  args: string[],
  options: RunOptions
): Promise<{ stdout: string; stderr: string }> {
  const commandLine = [command, ...args].join(" ");
  if (options.dryRun) {
    options.logger.info(`[dry-run] ${commandLine}`);
    return { stdout: "", stderr: "" };
  }

  options.logger.command(commandLine, options.cwd);
  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      options.logger.raw(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      options.logger.raw(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed (${code}): ${commandLine}`));
      }
    });
  });
}
