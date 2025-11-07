#!/usr/bin/env node
import { argv } from "process";
import { showHelp, Command, LICHESS_TOKEN } from "./utils";
import { delayCommand } from "./cmd/delay";
import { setPGNCommand } from "./cmd/setPGN";
import { setLichessGamesCommand } from "./cmd/setLichessGames";

// Ensure LICHESS_TOKEN is set
if (!LICHESS_TOKEN) {
  console.error("Error: LICHESS_TOKEN environment variable is not set.");
  process.exit(1);
}

const args = argv.slice(2);

(async () => {
  // show version for --version or -v
  if (args.includes("--version") || args.includes("-v")) {
    const { version } = require("../package.json");
    console.log(`libroadcast-cli v${version}`);
    process.exit(0);
  }
  // check args[0] is --help or -h
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    showHelp();
    process.exit(0);
  }
  const command = args.shift();
  const commands = new Map([
    [Command.Delay, delayCommand],
    [Command.SetLCC, setPGNCommand],
    [Command.SetPGN, setPGNCommand],
    [Command.SetLichessGames, setLichessGamesCommand],
  ]);

  const handler = commands.get(command as Command);
  if (command === Command.SetLCC)
    console.warn(
      "Warning: 'setLCC' command was removed. Will use 'setPGN' instead."
    );
  if (!handler) {
    console.error("Unknown command. Supported commands: delay, setLCC, setPGN, setLichessGames");
    process.exit(1);
  }
  await handler(args);
})();
