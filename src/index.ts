#!/usr/bin/env node
import { exit } from "node:process";
import { LICHESS_TOKEN, args, Command, commands } from "./utils/commandHandler";
import { showHelp, includeHelp } from "./utils/help";

(async () => {
  // show version for --version or -v
  if (args.includes("--version") || args.includes("-v")) {
    const { version } = require("../package.json");
    console.log(`libroadcast-cli v${version}`);
    exit(0);
  }

  if (args.length === 0 || includeHelp(args[0])) {
    showHelp();
    exit(0);
  }

  const cmd = args.shift() as Command | undefined;
  const handler = commands.get(cmd!);

  if (args.find(includeHelp)) {
    showHelp(cmd);
    exit(0);
  }
  if (!handler) {
    console.error("Error: Command handler not found.");
    exit(1);
  }

  if (!LICHESS_TOKEN) {
    console.error("Error: LICHESS_TOKEN environment variable is not set.");
    exit(1);
  }
  await handler(args);
})();
