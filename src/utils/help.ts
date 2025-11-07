import { Command } from "./commandHandler";

const msg = [
  "Usage: <command> [options]",
  "",
  "Commands:",
  "  delay <broadcastId> <delayInSeconds> [--onlyDelay] [--noDelay]",
  "     Sets the delay for all rounds in the specified broadcast.",
  "     The delay is specified in seconds. (max 3600 seconds = 1 hour)",
  "     Options:",
  "       --onlyDelay   Set only the delay without changing the start time.",
  "       --noDelay     Remove the delay from the rounds.",
  "  setPGN <broadcastId> <sourcePGNUrl> [--withFilter] [--slice <sliceFilter>]",
  "     Sets the source PGN URL for all rounds in the specified broadcast.",
  "     (optional) Use '{}' in the URL as a placeholder for the round number.",
  '       Note: For livechesscloud URLs, please ensure it ends with "/{}".',
  "     Options:",
  "       --withFilter    Apply round number filtering based on round number.",
  "       --slice <sliceFilter>  Apply slice filtering using the provided filter string.",
  "  setLichessGames <broadcastRoundId> <gameIds...>",
  "     Sets the games for the specified broadcast round using Lichess game IDs.",
  "     Note: Maximum of 64 game IDs can be provided.",
  "",
  "Examples:",
  "  delay bcast123 300 --onlyDelay # Set a 5-minute delay without changing start time",
  '  setPGN bcast123 https://example.com/pgns/round-{}/game.pgn --withFilter --slice "1-5,7,9-12"',
  "  setLichessGames round456 gameId1 gameId2 gameId3 # Set specific games for the round",
];

export const showHelp = (cmd?: Command) => {
  const ranges: Record<Command, [number, number]> = {
    [Command.Delay]: [3, 9],
    [Command.SetPGN]: [9, 16],
    [Command.SetLCC]: [9, 16], // will remove soon
    [Command.SetLichessGames]: [16, 19],
  };

  const range = cmd ? ranges[cmd] : undefined;
  if (cmd === Command.SetLCC) {
    console.warn(
      "Warning: 'setLCC' command was removed. Use 'setPGN' command instead."
    );
  }
  console.info(range ? msg.slice(...range).join("\n") : msg.join("\n"));
};

export const includeHelp = (str: string) => ["--help", "-h"].includes(str);