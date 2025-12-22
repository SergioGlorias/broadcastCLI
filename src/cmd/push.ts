import { exit } from "node:process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  sleep,
  checkTokenScopes,
} from "../utils/commandHandler";
import { getBroadcastRound } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";

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
          "Ply Count": game.moves || "Unknown",
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

const readPGNFromURL = async (pgnURL: string) => {
  // url can be a file path or a web URL
  if (pgnURL.startsWith("http://") || pgnURL.startsWith("https://")) {
    // Fetch from web URL
    const response = await fetch(pgnURL);
    if (!response.ok) {
      console.error(
        cl.red(`Failed to fetch PGN from URL: ${response.statusText}`),
      );
      return undefined;
    }
    const pgnText = await response.text();
    return pgnText;
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

const loop = async (
  roundInfo: components["schemas"]["BroadcastRoundInfo"],
  pgnPath: string,
  loopTimer: number,
) => {
  while (true) {
    const pgnContent = await readPGNFromURL(pgnPath);
    if (pgnContent) await pushPGN(roundInfo, pgnContent);
    await sleep(loopTimer * 1000);
  }
};

export const pushCommand = async (args: string[]) => {
  await checkTokenScopes();
  const [roundId, pgnPath] = args.slice(0, 2);
  // Validate required args
  if (!roundId || !pgnPath) {
    msgCommonErrorHelp("Round ID and PGN are required.");
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
    await loop(roundInfo, pgnPath, loopTimer);
  } else {
    const pgnContent = await readPGNFromURL(pgnPath);
    if (pgnContent) await pushPGN(roundInfo, pgnContent);
  }
};
