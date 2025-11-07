import { env, argv } from "process";
import createClient from "openapi-fetch";
import { paths } from "@lichess-org/types";
import { delayCommand } from "../cmd/delay";
import { setPGNCommand } from "../cmd/setPGN";
import { setLichessGamesCommand } from "../cmd/setLichessGames";

export const LICHESS_TOKEN = env.LICHESS_TOKEN;
const LICHESS_DOMAIN = env.LICHESS_DOMAIN || "https://lichess.org/";

export const args = argv.slice(2);

// Commands names
export enum Command {
  Delay = "delay",
  SetLCC = "setLCC",
  SetPGN = "setPGN",
  SetLichessGames = "setLichessGames",
}

export const commands = new Map([
  [Command.Delay, delayCommand],
  [Command.SetLCC, setPGNCommand],
  [Command.SetPGN, setPGNCommand],
  [Command.SetLichessGames, setLichessGamesCommand],
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
  console.error(msg);
  console.info("Use --help to see usage.");
};
