import { env, argv } from "node:process";
import createClient from "openapi-fetch";
import cl from "./colors";

import { paths } from "@lichess-org/types";
import { delayCommand } from "../cmd/delay";
import { setPGNCommand } from "../cmd/setPGN";
import { setPGNMultiCommand } from "../cmd/setPGNMulti";
import { setLichessGamesCommand } from "../cmd/setLichessGames";
import { fixScheduleCommand } from "../cmd/fixSchedule";
import { startsPreviousCommand } from "../cmd/startsPrevious";
import { periodCommand } from "../cmd/period";

export const LICHESS_TOKEN = env.LICHESS_TOKEN;
const LICHESS_DOMAIN =
  (env.LICHESS_DOMAIN || "https://lichess.org").replace(/\/$/, "") + "/";

export const args = argv.slice(2);

// Commands names
export enum Command {
  Delay = "delay",
  SetPGN = "setPGN",
  SetPGNMulti = "setPGNMulti",
  SetLichessGames = "setLichessGames",
  FixSchedule = "fixSchedule",
  StartsPrevious = "startsPrevious",
  Period = "period",
}

export const commands = new Map([
  [Command.Delay, delayCommand],
  [Command.SetPGN, setPGNCommand],
  [Command.SetPGNMulti, setPGNMultiCommand],
  [Command.SetLichessGames, setLichessGamesCommand],
  [Command.FixSchedule, fixScheduleCommand],
  [Command.StartsPrevious, startsPreviousCommand],
  [Command.Period, periodCommand],
]);

export const client = createClient<paths>({
  baseUrl: LICHESS_DOMAIN,
  headers: {
    Authorization: `Bearer ${LICHESS_TOKEN}`,
    Accept: "application/json",
  },
});

// sleep function to avoid rate limit issues
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const msgCommonErrorHelp = (msg: string) => {
  console.error(cl.red(msg));
  console.info(cl.blue("Use --help to see usage."));
};

// Helper to handle API responses consistently
export const handleApiResponse = async <
  T extends { response: { ok: boolean; statusText: string } },
>(
  promise: Promise<T>,
  successMsg: string,
  errorContext: string,
): Promise<void> => {
  try {
    const response = await promise;
    if (response.response.ok) {
      console.log(cl.green(successMsg));
    } else {
      console.error(
        cl.red(
          `${errorContext}: ${cl.whiteBold(response.response.statusText)}`,
        ),
      );
    }
  } catch (error) {
    console.error(cl.red(errorContext), error);
  }
};

// if per example: 8+ is provided, all round numbers after round 8 will be selected
// if 1-4 is provided, only rounds 1 to 4 will be selected
// if 3,5,7 is provided, only rounds 3,5 and 7 will be selected
// if 1-4,6,8+ is provided, rounds 1 to 4, round 6 and all rounds after round 8 will be selected
export const translateRoundsToFix = (arg: string): number[] => {
  const rounds: number[] = [];
  const parts = arg.split(",");

  for (const part of parts) {
    if (part.endsWith("+")) {
      const start = parseInt(part.slice(0, -1), 10);
      if (isNaN(start)) continue;
      for (let i = start; i <= 64; i++) {
        rounds.push(i);
      }
    } else if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) continue;
      for (let i = start; i <= end; i++) {
        rounds.push(i);
      }
    } else {
      const roundNum = parseInt(part, 10);
      if (isNaN(roundNum)) continue;
      rounds.push(roundNum);
    }
  }
  return [...new Set(rounds)];
};

export const checkTokenScopes = async (modRequired?: boolean) => {
  const requiredScopes = ["study:read", "study:write"];
  if (modRequired) requiredScopes.push("web:mod");
  await client
    .POST("/api/token/test", {
      headers: {
        "Content-Type": "text/plain",
      },
      body: LICHESS_TOKEN!,
      bodySerializer: (body: string) => body,
    })
    .then((response) => response.data)
    .then((data) => data?.[LICHESS_TOKEN!]!.scopes?.split(","))
    .then((scopes) => {
      const missingScopes = requiredScopes.filter(
        (scope) => !scopes?.includes(scope),
      );
      if (missingScopes.length > 0) {
        console.error(
          cl.red(
            `Error: Missing required token scopes: ${missingScopes.join(", ")}`,
          ),
        );
        process.exit(1);
      }
    });
};
