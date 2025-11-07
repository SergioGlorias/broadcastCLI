import { env } from "process";
import createClient from "openapi-fetch";
import { paths } from "@lichess-org/types";

export const LICHESS_TOKEN = env.LICHESS_TOKEN;
const LICHESS_DOMAIN = env.LICHESS_DOMAIN || "https://lichess.org/";

export const client = createClient<paths>({
  baseUrl: LICHESS_DOMAIN,
  headers: {
    Authorization: `Bearer ${LICHESS_TOKEN}`,
    Accept: "application/json",
  },
});

// Commands names
export enum Command {
  Delay = "delay",
  SetLCC = "setLCC",
  SetPGN = "setPGN",
}

// Function to show help messages
export const showHelp = (cmd?: Command) => {
  const msg = [
    "Usage: <command> [options]",
    "",
    "Commands:",
    "  delay <broadcastId> <delayInSeconds> [--onlyDelay] [--noDelay]",
    "     Sets the delay for all rounds in the specified broadcast.",
    "     Options:",
    "       --onlyDelay   Set only the delay without changing the start time.",
    "       --noDelay     Remove the delay from the rounds.",
    "  setLCC <broadcastId> <sourceLCCUrl>",
    "     Sets the source LCC URL for all rounds in the specified broadcast.",
    "  setPGN <broadcastId> <sourcePGNUrl>",
    "     Sets the source PGN URL for all rounds in the specified broadcast.",
    "     (optional) Use '{}' in the URL as a placeholder for the round number.",
    "",
    "Examples:",
    "  delay bcast123 300 --onlyDelay # Set a 5-minute delay without changing start time",
    "  setLCC bcast123 https://view.livechesscloud.com/#47c48351-034a-4860-9b94-087490742803",
    "  setPGN bcast123 https://example.com/pgns/round-{}/game.pgn",
  ];
  
  const ranges: Record<Command, [number, number]> = {
    [Command.Delay]: [3, 8],
    [Command.SetLCC]: [8, 10],
    [Command.SetPGN]: [10, 13],
  };

  const range = cmd ? ranges[cmd] : undefined;
  console.info(range ? msg.slice(...range).join("\n") : msg.join("\n"));
};

export const getBroadcast = (broadcastId: string) =>
  client
    .GET("/api/broadcast/{broadcastTournamentId}", {
      params: {
        path: { broadcastTournamentId: broadcastId },
      },
    })
    .then((response) => response.data)
    .catch((error) => {
      console.error("Error fetching broadcast:", error);
      return null;
    });
