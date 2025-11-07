#!/usr/bin/env node
import { argv } from "process";
import { showHelp, Command, LICHESS_TOKEN } from "./utils";
import { delayCommand } from "./cmd/delay";
import { setLCCCommand } from "./cmd/setLCC";

// Ensure LICHESS_TOKEN is set
if (!LICHESS_TOKEN) {
  console.error("Error: LICHESS_TOKEN environment variable is not set.");
  process.exit(1);
}

const args = argv.slice(2);

(async () => {
  // check args[0] is --help or -h
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    showHelp();
    process.exit(0);
  }
  switch (args[0]) {
    case Command.Delay:
      args.shift();
      await delayCommand(args);
      break;
    case Command.SetLCC:
      args.shift();
      await setLCCCommand(args);
      break;
    default:
      console.error("Unknown command. Supported commands: delay, setLCC");
      process.exit(1);
  }
})();
