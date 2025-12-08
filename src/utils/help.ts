import { Command } from "./commandHandler";
import cl from "./colors";

const helpLogin = [
  `  ${cl.underItalic("login [--logout]")}`,
  `     ${cl.gray("Save your Lichess token and domain for future use.")}`,
  `     ${cl.gray("This allows you to use the CLI without setting environment variables.")}`,
  `     ${cl.bold("Options:")}`,
  `       --logout (-lo)   ${cl.gray("Clear saved credentials and log out.")}`,
  `     ${cl.blue("Note:")} ${cl.gray("Your token must start with 'lip_' to be valid.")}`,
  `     ${cl.blue("Note:")} ${cl.gray("Environment variables always take precedence over saved credentials.")}`,
].join("\n");

const helpDelay = [
  `  ${cl.underItalic("delay <broadcastId> <delayInSeconds> [--onlyDelay] [--noDelay] [--rounds <roundsToFix>]")} `,
  `     ${cl.gray("Sets the delay for all rounds in the specified broadcast.")}`,
  `     ${cl.bold("Note:")}  ${cl.gray("The delay is specified in seconds. (max 3600 seconds = 1 hour)")}`,
  `     ${cl.bold("Options:")}`,
  `       --onlyDelay   ${cl.gray("Set only the delay without changing the start time.")}`,
  `       --noDelay     ${cl.gray("Do not modify the delay, only adjust the start time.")}`,
  `       --rounds <roundsToFix>   ${cl.gray("Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.")}`,
].join("\n");

const helpSetPGN = [
  `  ${cl.underItalic("setPGN <broadcastId> <sourcePGNUrl> [--withFilter] [--slice <sliceFilter>] [--rounds <roundsToFix>]")}`,
  `     ${cl.gray("Sets the source PGN URL for all rounds in the specified broadcast.")}`,
  `     ${cl.italic("(optional)")} ${cl.gray('Use "{}" in the URL as a placeholder for the round number.')}`,
  `     ${cl.bold("Note:")} ${cl.gray('For livechesscloud URLs, please ensure it ends with "/{}".')}`,
  `     ${cl.bold("Options:")}`,
  `       --withFilter             ${cl.gray("Apply round number filtering based on round number.")}`,
  `       --slice <sliceFilter>    ${cl.gray("Apply slice filtering using the provided filter string.")}`,
  `       --rounds <roundsToFix>   ${cl.gray("Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.")}`,
].join("\n");

const helpSetPGNMulti = [
  `  ${cl.underItalic("setPGNMulti <broadcastId> <sourcePGNUrl> <gamesNum> [--withFilter] [--onlyGames <sliceFilter>] [--rounds <roundsToFix>]")}`,
  `     ${cl.gray("Sets the source PGN URLs for all rounds in the specified broadcast.")}`,
  `     ${cl.gray("Use {r} in the URL as a placeholder for the round number and {g} for the game number.")}`,
  `     ${cl.gray("Use the gamesNum parameter to specify how many games per round.")}`,
  `     ${cl.bold("Note:")} ${cl.gray('For broadcasts with multiple rounds, the source PGN URLs must include the "{g}" placeholder for round numbers.')}`,
  `     ${cl.bold("Options:")}`,
  `       --withFilter                ${cl.gray("Apply round number filtering based on round number.")}`,
  `       --onlyGames <sliceFilter>   ${cl.gray("Apply slice filtering using the provided filter string.")}`,
  `       --rounds <roundsToFix>      ${cl.gray("Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.")}`,
].join("\n");

const helpSetLichessGames = [
  `  ${cl.underItalic("setLichessGames <broadcastRoundId> <gameIds...>")}`,
  `     ${cl.gray("Sets the games for the specified broadcast round using Lichess game IDs.")}`,
  `     ${cl.bold("Note:")} ${cl.gray("Maximum of 64 game IDs can be provided.")}`,
].join("\n");

const helpFixSchedule = [
  `  ${cl.underItalic("fixSchedule <broadcastId> <timeDiff> [--rounds <roundsToFix>]")}`,
  `     ${cl.gray("Fixes the schedule of rounds in the specified broadcast by applying a time difference.")}`,
  `     ${cl.bold("Note:")} ${cl.gray('The time difference should be in a format like "1h", "30m", "15s", etc.')}`,
  `     ${cl.bold("Options:")}`,
  `       --rounds <roundsToFix>   ${cl.gray("Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.")}`,
].join("\n");

const helpStartsPrevious = [
  `  ${cl.underItalic("startsPrevious <broadcastId> <startsPrevious>")}`,
  `     ${cl.gray("Sets the startsAfterPrevious flag for all rounds in the specified broadcast.")}`,
].join("\n");

const helpSetPeriod = [
  `  ${cl.underItalic("period <broadcastId> <periodInSeconds>")}`,
  `     ${cl.gray("Sets the period between polling for all rounds in the specified broadcast.")}`,
  `     ${cl.redBold("Required:")} ${cl.gray(`Your Lichess token needs the ${cl.whiteBold("web:mod")} scope to use this command. (Broadcast/Study Admin perm required)`)}`,
  `     ${cl.bold("Note:")} ${cl.gray("The period is specified in seconds.")}`,
  `     ${cl.bold("Options:")}`,
  `       --rounds <roundsToFix>   ${cl.gray("Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.")}`,
].join("\n");

const msg = [
  `${cl.boldYellow("Usage:")} ${cl.underItalic("<command> [options]")}`,
  ``,
  ``,
  `${cl.boldYellow("Commands:")}`,
  helpLogin,
  ``,
  helpDelay,
  ``,
  helpSetPGN,
  ``,
  helpSetPGNMulti,
  ``,
  helpSetLichessGames,
  ``,
  helpFixSchedule,
  ``,
  helpStartsPrevious,
  ``,
  helpSetPeriod,
  ``,
  ``,
  `${cl.boldYellow("Examples:")}`,
  `   ${cl.gray("# Login with your Lichess token (interactive)")}`,
  `     $ ${cl.underItalic("login")}`,
  `   ${cl.gray("# Login with token as argument")}`,
  `     $ ${cl.underItalic("login")} ${cl.italic("lip_yourtoken https://lichess.org")}`,
  `   ${cl.gray("# Logout and clear saved credentials")}`,
  `     $ ${cl.underItalic("login")} ${cl.italic("--logout")}`,
  `   ${cl.gray("# Set a 5-minute delay without changing start time")}`,
  `     $ ${cl.underItalic("delay")} ${cl.italic("bcast123 300 --onlyDelay")}`,
  `   ${cl.gray("# Set source PGN URL with round and slice filters")}`,
  `     $ ${cl.underItalic("setPGN")} ${cl.italic('bcast123 https://example.com/pgns/round-{}/game.pgn --withFilter --slice "1-5,7,9-12"')}`,
  `  ${cl.gray("# Set source PGN URLs for multiple games per round")}`,
  `     $ ${cl.underItalic("setPGNMulti")} ${cl.italic('bcast123 https://example.com/pgns/round-{r}/game-{g}.pgn 12 --withFilter --onlyGames "1-5,7,9-12"')}`,
  `   ${cl.gray("# Set Lichess games for a broadcast round")}`,
  `     $ ${cl.underItalic("setLichessGames")} ${cl.italic("round456 gameId1 gameId2 gameId3")}`,
  `   ${cl.gray("# Fix schedule of rounds 1 to 4 and all rounds after 8 by adding 15 minutes")}`,
  `     $ ${cl.underItalic("fixSchedule")} ${cl.italic("bcast123 15m --rounds 1-4,8+")}`,
  `  ${cl.gray("# Set startsAfterPrevious to true for all rounds in a broadcast")}`,
  `     $ ${cl.underItalic("startsPrevious")} ${cl.italic("bcast123 true")}`,
];

export const showHelp = (cmd?: Command) => {
  const ranges: Record<Command, string> = {
    [Command.Login]: helpLogin,
    [Command.Delay]: helpDelay,
    [Command.SetPGN]: helpSetPGN,
    [Command.SetPGNMulti]: helpSetPGNMulti,
    [Command.SetLichessGames]: helpSetLichessGames,
    [Command.FixSchedule]: helpFixSchedule,
    [Command.StartsPrevious]: helpStartsPrevious,
    [Command.Period]: helpSetPeriod,
  };

  const range = cmd ? ranges[cmd] : undefined;
  console.info(range ? range : msg.join("\n"));
};

export const includeHelp = (str: string) => ["--help", "-h"].includes(str);
