import { Command } from "commander";
import { runPipeline, fetchUpstream, cleanTarget } from "./pipeline.js";
import { packageFonts } from "./package-fonts.js";

const program = new Command();
program
  .name("sarasa-adwaita")
  .description("Sarasa Adwaita build automation")
  .option("-c, --config <path>", "config file path", "config.jsonc")
  .option("--dry-run", "print commands without executing", false)
  .option("--clean", "clean target before running", false)
  .option("--skip-adwaita-mono", "skip Adwaita Mono build", false)
  .option("--skip-adwaita-sans", "skip Adwaita Sans build", false)
  .option("--skip-sarasa", "skip Sarasa TTF build, reuse existing TTFs", false);

program
  .command("build", { isDefault: true })
  .description("Run full build pipeline")
  .action(async () => {
    const opts = program.opts();
    await runPipeline({
      configPath: opts.config,
      dryRun: opts.dryRun,
      clean: opts.clean,
      skipAdwaitaMono: opts.skipAdwaitaMono,
      skipAdwaitaSans: opts.skipAdwaitaSans,
      skipSarasa: opts.skipSarasa
    });
  });

program
  .command("fetch")
  .description("Fetch upstream repositories")
  .action(async () => {
    const opts = program.opts();
    await fetchUpstream({
      configPath: opts.config,
      dryRun: opts.dryRun
    });
  });

program
  .command("clean")
  .description("Remove target directory")
  .action(async () => {
    const opts = program.opts();
    await cleanTarget({
      configPath: opts.config
    });
  });

program
  .command("package")
  .description("Package fonts into zip archives by region and format")
  .option("-o, --output <path>", "output directory (default: target/dist/zips)")
  .action(async () => {
    const opts = program.opts();
    const cmdOpts = program.commands.find(c => c.name() === "package")?.opts() ?? {};
    await packageFonts({
      configPath: opts.config,
      outputDir: cmdOpts.output,
    });
  });

await program.parseAsync(process.argv);
