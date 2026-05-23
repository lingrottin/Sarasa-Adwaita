import fs from "node:fs/promises";
import path from "node:path";

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function emptyDir(dirPath: string): Promise<void> {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}

export async function copyDir(source: string, destination: string): Promise<void> {
  await ensureDir(path.dirname(destination));
  await fs.cp(source, destination, { recursive: true, force: true });
}

export async function copyFile(source: string, destination: string): Promise<void> {
  await ensureDir(path.dirname(destination));
  await fs.copyFile(source, destination);
}
