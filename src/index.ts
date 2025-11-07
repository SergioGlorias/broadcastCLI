#!/usr/bin/env node
import { argv, env } from "process";
import createClient from "openapi-fetch";
import { components, paths } from "@lichess-org/types";

const LICHESS_TOKEN = env.LICHESS_TOKEN;
const LICHESS_DOMAIN = env.LICHESS_DOMAIN || "https://lichess.org/";

if (!LICHESS_TOKEN) {
  console.error("Error: LICHESS_TOKEN environment variable is not set.");
  process.exit(1);
}

const args = argv.slice(2);

const client = createClient<paths>({
  baseUrl: LICHESS_DOMAIN,
  headers: {
    Authorization: `Bearer ${LICHESS_TOKEN}`,
    Accept: "application/json",
  },
});

const getBroadcast = (broadcastId: string) =>
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

const setDelayRounds = (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  delay: number,
  onlyDelay: boolean,
  noDelay: boolean
) =>
  rounds.forEach((round) => {
    client
      .POST("/broadcast/round/{broadcastRoundId}/edit", {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: {
          delay: noDelay ? undefined : delay,
          startsAt:
            round.startsAt && !onlyDelay
              ? round.startsAt + delay * 1000
              : undefined,
        },
      })
      .then((response) => {
        if (response.response.ok)
          console.log(
            `Successfully set delay for round ${round.id} to ${delay} seconds.`
          );
        else
          console.error(
            `Failed to set delay for round ${round.id}: ${response.response.statusText}`
          );
      })
      .catch((error) => {
        console.error(`Error setting delay for round ${round.id}:`, error);
      });
  });

const setSourceLCC = (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  sourceLCC: string
) => {
  let rN = 1;
  rounds.forEach((round) => {
    client
      .POST("/broadcast/round/{broadcastRoundId}/edit", {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: {
          // @ts-ignore property is not yet documented
          syncSource: "url",
          syncUrl: `${sourceLCC}/${rN}`,
        },
      })
      .then((response) => {
        if (response.response.ok)
          console.log(
            `Successfully set source LCC for round ${round.id} to ${sourceLCC}/${rN}.`
          );
        else
          console.error(
            `Failed to set source LCC for round ${round.id}: ${response.response.statusText}`
          );
      })
      .catch((error) => {
        console.error(`Error setting source LCC for round ${round.id}:`, error);
      });
    rN += 1;
  });
};

enum Command {
  Delay = "delay",
  SetLCC = "setLCC",
}

const showHelp = (cmd?: Command) => {
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

(async () => {
  // check args[0] is --help or -h
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    showHelp();
    process.exit(0);
  }
  switch (args[0]) {
    case Command.Delay:
      const [broadcastId, delay] = args.slice(1, 3);
      // check arg --help or -h
      if (args.includes("--help") || args.includes("-h")) {
        showHelp(Command.Delay);
        process.exit(0);
      }
      // Validate required args
      if (!broadcastId || !delay) {
        showHelp(Command.Delay);
        process.exit(1);
      }
      const delayNum = parseInt(delay, 10);
      // Validate delay is a number between 0s and 1h
      if (isNaN(delayNum) && delayNum >= 0 && delayNum <= 3600) {
        console.error("Delay must be a number between 0 and 3600 seconds.");
        process.exit(1);
      }
      // check arg --onlyDelay
      const onlyDelay = args.includes("--onlyDelay");
      // check arg --noDelay
      const noDelay = args.includes("--noDelay");
      if (onlyDelay && noDelay) {
        console.error("Cannot use --onlyDelay and --noDelay together.");
        process.exit(1);
      }
      const broadcast = await getBroadcast(broadcastId);
      if (!broadcast?.rounds || broadcast.rounds.length === 0) {
        console.error("No rounds found for the specified broadcast.");
        process.exit(1);
      }
      setDelayRounds(broadcast.rounds, parseInt(delay, 10), onlyDelay, noDelay);
      break;

    case Command.SetLCC:
      const [bId, sourceLCC] = args.slice(1, 3);
      // check arg --help or -h
      if (args.includes("--help") || args.includes("-h")) {
        showHelp(Command.SetLCC);
        process.exit(0);
      }
      // Validate required args
      if (!bId || !sourceLCC) {
        showHelp(Command.SetLCC);
        process.exit(1);
      }

      const bcast = await getBroadcast(bId);
      if (!bcast?.rounds || bcast.rounds.length === 0) {
        console.error("No rounds found for the specified broadcast.");
        process.exit(1);
      }

      // check sourceLCC is a valid URL
      let url: URL;
      try {
        url = new URL(
          sourceLCC.startsWith("http")
            ? sourceLCC
            : `https://view.livechesscloud.com/${sourceLCC}`
        );
      } catch (e) {
        console.error("sourceLCC must be a valid URL or LCC ID.");
        process.exit(1);
      }

      setSourceLCC(bcast.rounds, url.toString());
      break;

    default:
      console.error("Unknown command. Supported commands: delay, setLCC");
      process.exit(1);
  }
})();
