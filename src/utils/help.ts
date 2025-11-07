import { Command } from "./commandHandler";
import cl from "./colors";

const msg = [
  `${cl.boldYellow("Usage:")} ${cl.underItalic("<command> [options]")}`,
  ``,
  ``,
  `${cl.boldYellow("Commands:")}`,
  `  ${cl.underItalic("delay <broadcastId> <delayInSeconds> [--onlyDelay] [--noDelay]")}`,
  `     ${cl.gray("Sets the delay for all rounds in the specified broadcast.")}`,
  `     ${cl.bold("Note:")}  ${cl.gray("The delay is specified in seconds. (max 3600 seconds = 1 hour)")}`,
  `     ${cl.bold("Options:")}`,
  `       --onlyDelay   ${cl.gray("Set only the delay without changing the start time.")}`,
  `       --noDelay     ${cl.gray("Remove the delay from the rounds.")}`,
  ``,
  `  ${cl.underItalic("setPGN <broadcastId> <sourcePGNUrl> [--withFilter] [--slice <sliceFilter>]")}`,
  `     ${cl.gray("Sets the source PGN URL for all rounds in the specified broadcast.")}`,
  `     ${cl.italic("(optional)")} ${cl.gray('Use "{}" in the URL as a placeholder for the round number.')}`,
  `     ${cl.bold("Note:")} ${cl.gray('For livechesscloud URLs, please ensure it ends with "/{}".')}`,
  `     ${cl.bold("Options:")}`,
  `       --withFilter            ${cl.gray("Apply round number filtering based on round number.")}`,
  `       --slice <sliceFilter>   ${cl.gray("Apply slice filtering using the provided filter string.")}`,
  ``,
  `  ${cl.underItalic("setLichessGames <broadcastRoundId> <gameIds...>")}`,
  `     ${cl.gray("Sets the games for the specified broadcast round using Lichess game IDs.")}`,
  `     ${cl.bold("Note:")} ${cl.gray("Maximum of 64 game IDs can be provided.")}`,
  ``,
  ``,
  `${cl.boldYellow("Examples:")}`,
  `   ${cl.gray("# Set a 5-minute delay without changing start time")}`,
  `     $ ${cl.underItalic("delay")} ${cl.italic("bcast123 300 --onlyDelay")}`,
  `   ${cl.gray("# Set source PGN URL with round and slice filters")}`,
  `     $ ${cl.underItalic("setPGN")} ${cl.italic('bcast123 https://example.com/pgns/round-{}/game.pgn --withFilter --slice "1-5,7,9-12"')}`,
  `   ${cl.gray("# Set Lichess games for a broadcast round")}`,
  `     $ ${cl.underItalic("setLichessGames")} ${cl.italic("round456 gameId1 gameId2 gameId3")}`,
];

export const showHelp = (cmd?: Command) => {
  const ranges: Record<Command, [number, number]> = {
    [Command.Delay]: [4, 10],
    [Command.SetPGN]: [11, 18],
    [Command.SetLCC]: [11, 18], // will remove soon
    [Command.SetLichessGames]: [19, 22],
  };

  const range = cmd ? ranges[cmd] : undefined;
  if (cmd === Command.SetLCC) {
    console.warn(
      "Warning: 'setLCC' command was removed. Use 'setPGN' command instead.",
    );
  }
  console.info(range ? msg.slice(...range).join("\n") : msg.join("\n"));
};

export const includeHelp = (str: string) => ["--help", "-h"].includes(str);
