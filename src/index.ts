#!/usr/bin/env node
import { exit } from "node:process";
import {
  LICHESS_TOKEN,
  args,
  Command,
  commands,
  packageJson,
} from "./utils/commandHandler.js";
import { showHelp, includeHelp } from "./utils/help.js";
import cl from "./utils/colors.js";

(async () => {
  // show version for --version or -v
  if (args.includes("--version") || args.includes("-v")) {
    console.log(
      `${cl.whiteBold(packageJson.name)} ${cl.underItalic(`v${packageJson.version}`)}`
    );
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
    console.error(`${cl.red("Error:")} Command handler not found.`);
    exit(1);
  }

  // Login command doesn't require a valid token
  if (cmd === Command.Login) {
    await handler(args);
    return;
  }

  if (!LICHESS_TOKEN?.trim() || !LICHESS_TOKEN.startsWith("lip_")) {
    console.error(
      `${cl.blue("Use the 'login' command to save your credentials: ")}${cl.whiteBold("libroadcast login")}`
    );
    exit(1);
  }
  await handler(args);
})();
