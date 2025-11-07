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
}

// Function to show help messages
export const showHelp = (cmd?: Command) => {
  const msg = [
    "Usage: <command> [options]",
    "Commands:",
    "  delay <broadcastId> <delayInSeconds> [--onlyDelay] [--noDelay]",
    "     Sets the delay for all rounds in the specified broadcast.",
    "     Options:",
    "       --onlyDelay   Set only the delay without changing the start time.",
    "       --noDelay     Remove the delay from the rounds.",
    "  setLCC <broadcastId> <sourceLCCUrl>",
    "     Sets the source LCC URL for all rounds in the specified broadcast.",
  ];
  switch (cmd) {
    case Command.Delay:
      console.info(msg.slice(2, 7).join("\n"));
      break;
    case Command.SetLCC:
      console.info(msg.slice(7, 9).join("\n"));
      break;
    default:
      console.info(msg.join("\n"));
  }
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
