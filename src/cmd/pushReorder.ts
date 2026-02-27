import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  msgCommonErrorHelp,
  sleep,
  checkTokenScopes,
} from "../utils/commandHandler.js";
import { parsePgn, makePgn } from "chessops/pgn";
import { getBroadcastRound } from "../utils/getInfoBroadcast.js";
import cl from "../utils/colors.js";
import { loopChecker, pushPGN, readPGNFromURL } from "../utils/pushTools.js";

const sortPgn = (pgn: string) => {
  const parsed = parsePgn(pgn);
  let sortedGames = parsed.sort((a, b) => {
    const roundA = parseInt(a.headers.get("Round")?.split(".")[1] || "0", 10);
    const roundB = parseInt(b.headers.get("Round")?.split(".")[1] || "0", 10);
    return roundA - roundB;
  });
  return sortedGames.map((game) => makePgn(game)).join("\n\n");
};

let lastPGN = "";

const loop = async (
  roundInfo: components["schemas"]["BroadcastRoundInfo"],
  pgnPath: string,
  loopTimer: number,
) => {
  while (true) {
    const pgnContent = await readPGNFromURL(pgnPath);

    if (!pgnContent) {
      console.error(
        cl.red(
          `Failed to read PGN content. Retrying in ${loopTimer} seconds...`,
        ),
      );
      await sleep(loopTimer * 1000);
      continue;
    }

    const filteredPgn = sortPgn(pgnContent);

    if (filteredPgn && filteredPgn !== lastPGN) {
      await pushPGN(roundInfo, filteredPgn);
      lastPGN = filteredPgn;
    }
    await sleep(loopTimer * 1000);
  }
};

export const pushReorderCommand = async (args: string[]) => {
  await checkTokenScopes();
  const [roundId, pgnPath] = args.slice(0, 2);
  // Validate required args
  if (!roundId || !pgnPath) {
    msgCommonErrorHelp("Round ID and PGN path are required.");
    exit(1);
  }

  const roundInfo = await getBroadcastRound(roundId);

  if (!roundInfo) {
    console.error(cl.red("Round not found."));
    exit(1);
  }

  const loopTimer = loopChecker(args);

  if (loopTimer) {
    console.log(
      cl.green(
        `Starting loop to push reordered PGN every ${cl.whiteBold(loopTimer.toString())} seconds...`,
      ),
    );
    console.log(cl.blue("Press Ctrl+C to stop."));
    await loop(roundInfo, pgnPath, loopTimer);
  } else {
    const pgnContent = await readPGNFromURL(pgnPath);

    if (!pgnContent) {
      console.error(cl.red(`Failed to read PGN content.`));
      exit(1);
    }

    const filteredPgn = sortPgn(pgnContent);

    if (filteredPgn) await pushPGN(roundInfo, filteredPgn);
  }
};
