import { exit } from "node:process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  sleep,
  checkTokenScopes,
  packageJson,
} from "../utils/commandHandler.js";
import { parsePgn, makePgn } from "chessops/pgn";
import { getBroadcastRound } from "../utils/getInfoBroadcast.js";
import cl from "../utils/colors.js";

const pushPGN = async (
  round: components["schemas"]["BroadcastRoundInfo"],
  pgn: string,
) => {
  try {
    const res = await client
      .POST("/api/broadcast/round/{broadcastRoundId}/push", {
        params: {
          path: { broadcastRoundId: round.id },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: pgn,
        bodySerializer: (body: string) => body,
      })
      .then((response) => response.data);

    console.log(
      cl.green(
        `✓ Successfully pushed PGN for round ${cl.whiteBold(round.id)}.`,
      ),
    );
    console.table(
      res?.games.map((game, i) => {
        return {
          "Game #": i + 1,
          "White Player": game.tags["White"] || "Unknown",
          "Black Player": game.tags["Black"] || "Unknown",
          Result: game.tags["Result"] || "Unknown",
          "Ply Count": game.moves ?? "Unknown",
          Error: game.error || "None",
        };
      }),
    );
  } catch (error) {
    console.error(
      cl.red(`Error pushing PGN for round ${cl.whiteBold(round.id)}:`),
      error,
    );
  }
};

const filterPgnByIds = (pgn: string, filterIds: number[]) => {
  const parsed = parsePgn(pgn);
  const filteredGames = parsed.filter((game) => {
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

  return filteredGames.map((game) => makePgn(game)).join("\n\n");
};

const readPGNFromURL = async (pgnURL: string, filterIds: number[]) => {
  // url can be a file path or a web URL
  if (pgnURL.startsWith("http://") || pgnURL.startsWith("https://")) {
    // Fetch from web URL
    const response = await fetch(pgnURL, {
      method: "GET",
      headers: {
        "User-Agent": packageJson.name + "/" + packageJson.version,
      },
    });
    if (!response.ok) {
      console.error(
        cl.red(`Failed to fetch PGN from URL: ${response.statusText}`),
      );
      return undefined;
    }
    const pgnText = await response.text();

    const filteredPgn = filterPgnByIds(pgnText, filterIds);
    if (!filteredPgn) {
      console.error(cl.red(`No games found matching the provided filter IDs.`));
      return undefined;
    }

    return filteredPgn;
  } else {
    // Assume it's a file path
    const resolvedPath = path.resolve(pgnURL);
    const stats = await readFile(resolvedPath, { encoding: "utf-8" }).catch(
      (err) => {
        console.error(cl.red(`Failed to read PGN file: ${err.message}`));
        return undefined;
      },
    );
    if (!stats) return undefined;
    return stats.toString();
  }
};

let lastPGN = "";

const loop = async (
  roundInfo: components["schemas"]["BroadcastRoundInfo"],
  pgnPath: string,
  loopTimer: number,
  filterIds: number[],
) => {
  while (true) {
    const pgnContent = await readPGNFromURL(pgnPath, filterIds);
    if (pgnContent && pgnContent !== lastPGN) {
      await pushPGN(roundInfo, pgnContent);
      lastPGN = pgnContent;
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

  // parse arg --loop <timerInSeconds>
  const loopArgIndex = args.findIndex((arg) => arg === "--loop");
  let loopTimer: number | undefined = undefined;
  if (loopArgIndex !== -1 && loopArgIndex + 1 < args.length) {
    const loopTimerStr = args[loopArgIndex + 1];
    loopTimer = parseInt(loopTimerStr, 10);
    if (isNaN(loopTimer) || loopTimer <= 0) {
      console.error(cl.red("Loop timer must be a positive integer."));
      exit(1);
    }
  }

  if (loopTimer) {
    console.log(
      cl.green(
        `Starting loop to push PGN every ${cl.whiteBold(loopTimer.toString())} seconds...`,
      ),
    );
    console.log(cl.blue("Press Ctrl+C to stop."));
    await loop(roundInfo, pgnPath, loopTimer, filterIds);
  } else {
    const pgnContent = await readPGNFromURL(pgnPath, filterIds);
    if (pgnContent) await pushPGN(roundInfo, pgnContent);
  }
};
