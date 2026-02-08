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

const filterPgnByIds = (
  pgn: string,
  filterIds: number[],
  firstOngoing: boolean,
) => {
  const parsed = parsePgn(pgn);
  let filteredGames = parsed.filter((game) => {
    const whiteFideId = game.headers.get("WhiteFideId");
    const blackFideId = game.headers.get("BlackFideId");

    if (filterIds.length > 1) {
      // If even number of filter IDs, treat them as pairs of white and black IDs
      for (let i = 0; i < filterIds.length; i += 2) {
        const whiteId = filterIds[i];
        const blackId = filterIds[i + 1];
        if (
          (whiteFideId === String(whiteId) &&
            blackFideId === String(blackId)) ||
          (whiteFideId === String(blackId) && blackFideId === String(whiteId))
        ) {
          return true;
        }
      }
      return false;
    } else {
      // If odd number of filter IDs, treat them as individual IDs to match either white or black
      return (
        filterIds.includes(parseInt(whiteFideId || "", 10)) ||
        filterIds.includes(parseInt(blackFideId || "", 10))
      );
    }
  });

  if (firstOngoing) {
    const ongoingGames = filteredGames.filter((game) => {
      const result = game.headers.get("Result");
      return !result || result === "*";
    });
    const gamesFinished = filteredGames.filter((game) => {
      const result = game.headers.get("Result");
      return result && result !== "*";
    });
    filteredGames = [...ongoingGames, ...gamesFinished];
  }

  return filteredGames.map((game) => makePgn(game)).join("\n\n");
};

let lastPGN = "";

const loop = async (
  roundInfo: components["schemas"]["BroadcastRoundInfo"],
  pgnPath: string,
  loopTimer: number,
  filterIds: number[],
  firstOngoing: boolean,
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

    const filteredPgn = filterPgnByIds(pgnContent, filterIds, firstOngoing);

    if (filteredPgn && filteredPgn !== lastPGN) {
      await pushPGN(roundInfo, filteredPgn);
      lastPGN = filteredPgn;
    }
    await sleep(loopTimer * 1000);
  }
};

export const pushFilterIDCommand = async (args: string[]) => {
  await checkTokenScopes();
  const [roundId, pgnPath] = args.slice(0, 2);
  const filterIds = args
    .slice(2)
    .filter((arg) => !arg.startsWith("--") && Number.isInteger(parseInt(arg)))
    .map((arg) => parseInt(arg, 10));
  // Validate required args
  if (!roundId || !pgnPath || filterIds.length === 0) {
    msgCommonErrorHelp(
      "Round ID, PGN, and at least one filter ID are required.",
    );
    exit(1);
  }

  const roundInfo = await getBroadcastRound(roundId);

  if (!roundInfo) {
    console.error(cl.red("Round not found."));
    exit(1);
  }

  const firstOngoing = args.includes("--firstOngoing");

  const loopTimer = loopChecker(args);

  if (loopTimer) {
    console.log(
      cl.green(
        `Starting loop to push PGN every ${cl.whiteBold(loopTimer.toString())} seconds...`,
      ),
    );
    console.log(cl.blue("Press Ctrl+C to stop."));
    await loop(roundInfo, pgnPath, loopTimer, filterIds, firstOngoing);
  } else {
    const pgnContent = await readPGNFromURL(pgnPath);

    if (!pgnContent) {
      console.error(cl.red(`Failed to read PGN content.`));
      exit(1);
    }

    const filteredPgn = filterPgnByIds(pgnContent, filterIds, firstOngoing);

    if (filteredPgn) await pushPGN(roundInfo, filteredPgn);
  }
};
