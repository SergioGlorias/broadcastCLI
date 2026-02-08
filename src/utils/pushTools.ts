import { components } from "@lichess-org/types";
import { client, packageJson } from "./commandHandler.js";
import cl from "./colors.js";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { exit } from "node:process";

export const pushPGN = async (
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
      res?.games
        .map((game, i) => {
          return {
            id: i + 1,
            "White Player": game.tags["White"] || "Unknown",
            "Black Player": game.tags["Black"] || "Unknown",
            Result: game.tags["Result"] || "Unknown",
            "Ply Count": game.moves ?? "Unknown",
            Error: game.error || "None",
          };
        })
        .reduce((acc: Record<number, object>, { id, ...rest }) => {
          acc[id] = rest;
          return acc;
        }, {}),
    );
  } catch (error) {
    console.error(
      cl.red(`Error pushing PGN for round ${cl.whiteBold(round.id)}:`),
      error,
    );
  }
};

export const readPGNFromURL = async (pgnURL: string) => {
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

export const loopChecker = (args: string[]) => {
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
  return loopTimer;
};
