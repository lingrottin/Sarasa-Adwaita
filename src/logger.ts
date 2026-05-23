import fs from "node:fs";
import path from "node:path";
import { ensureDir } from "./fs-utils.js";

export class Logger {
  private stream: fs.WriteStream;

  private constructor(logFile: string) {
    this.stream = fs.createWriteStream(logFile, { flags: "a" });
  }

  static async create(logFile: string): Promise<Logger> {
    await ensureDir(path.dirname(logFile));
    return new Logger(logFile);
  }

  info(message: string): void {
    this.writeLine("INFO", message);
  }

  warn(message: string): void {
    this.writeLine("WARN", message);
  }

  error(message: string): void {
    this.writeLine("ERROR", message);
  }

  command(commandLine: string, cwd?: string): void {
    const detail = cwd ? `${commandLine} (cwd: ${cwd})` : commandLine;
    this.writeLine("CMD", detail);
  }

  raw(chunk: Buffer | string): void {
    this.stream.write(chunk);
  }

  close(): void {
    this.stream.end();
  }

  private writeLine(level: string, message: string): void {
    const line = `[${level}] ${message}`;
    this.stream.write(`${line}\n`);
    if (level === "ERROR") {
      console.error(line);
    } else {
      console.log(line);
    }
  }
}
