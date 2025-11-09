import { env, argv } from "node:process";
import createClient from "openapi-fetch";
import { paths } from "@lichess-org/types";
import { delayCommand } from "../cmd/delay";
import { setPGNCommand } from "../cmd/setPGN";
import { setLichessGamesCommand } from "../cmd/setLichessGames";
import { fixScheduleCommand } from "../cmd/fixSchedule";
import cl from "./colors";

export const LICHESS_TOKEN = env.LICHESS_TOKEN;
const LICHESS_DOMAIN =
  (env.LICHESS_DOMAIN || "https://lichess.org").replace(/\/$/, "") + "/";

export const args = argv.slice(2);

// Commands names
export enum Command {
  Delay = "delay",
  SetPGN = "setPGN",
  SetLichessGames = "setLichessGames",
  FixSchedule = "fixSchedule",
}

export const commands = new Map([
  [Command.Delay, delayCommand],
  [Command.SetPGN, setPGNCommand],
  [Command.SetLichessGames, setLichessGamesCommand],
  [Command.FixSchedule, fixScheduleCommand],
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
