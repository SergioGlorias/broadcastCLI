#!/usr/bin/env node
import { LICHESS_TOKEN, args, Command } from "./utils/commandHandler";
import { showHelp } from "./utils/help";
import { delayCommand } from "./cmd/delay";
import { setPGNCommand } from "./cmd/setPGN";
import { setLichessGamesCommand } from "./cmd/setLichessGames";

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

  const cmd = command as Command | undefined;

  if (!cmd) {
    console.error(
      "Unknown command. Supported commands: delay, setLCC, setPGN, setLichessGames"
    );
    process.exit(1);
  }

  const handler = commands.get(cmd);
  if (cmd === Command.SetLCC)
    console.warn(
      "Warning: 'setLCC' command was removed. Will use 'setPGN' instead."
    );
  if (args.includes("--help") || args.includes("-h")) {
    showHelp(cmd);
    process.exit(0);
  }
  if (!handler) {
    console.error("Error: Command handler not found.");
    process.exit(1);
  }

  if (!LICHESS_TOKEN) {
    console.error("Error: LICHESS_TOKEN environment variable is not set.");
    process.exit(1);
  }
  await handler(args);
})();
