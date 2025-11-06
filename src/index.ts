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
  },
})

const getBroadcast = async (broadcastId: string) => {
  const { data } = await client.GET("/api/broadcast/{broadcastTournamentId}", {
    params: {
      path: { broadcastTournamentId: broadcastId },
    }
  })

  return data;
};

const setDelayRounds = (rounds: components["schemas"]["BroadcastRoundInfo"][], delay: number, onlyDelay: boolean, noDelay: boolean) => 
  rounds.forEach((round) => {
    client.POST("/broadcast/round/{broadcastRoundId}/edit", {
      params: {
        path: { broadcastRoundId: round.id },
        // @ts-ignore patch param is not yet documented
        query: { patch: 1 },
      },
      body: {
        name: round.name,
        delay: noDelay ? undefined : delay,
        startsAt: round.startsAt && !onlyDelay ? round.startsAt + (delay * 1000) : undefined,
      }
    })
    .then((response) => {
      if (response.response.ok) console.log(`Successfully set delay for round ${round.id} to ${delay} seconds.`);
      else console.error(`Failed to set delay for round ${round.id}: ${response.response.statusText}`);
    })
    .catch((error) => {
      console.error(`Error setting delay for round ${round.id}:`, error);
    });
  });

(async () => {
  switch (args[0]) {
    case "delay":
      const [broadcastId, delay] = args.slice(1, 3);
      // check arg --help or -h
      if (args.includes("--help") || args.includes("-h")) {
        console.info("Usage: delay <broadcastId> <delayInSeconds> [--onlyDelay] [--noDelay]");
        console.info("Sets the delay for all rounds in the specified broadcast.");
        console.info("Options:");
        console.info("  --onlyDelay   Set only the delay without changing the start time.");
        console.info("  --noDelay     Remove the delay from the rounds.");
        process.exit(0);
      }
      // Validate required args
      if (!broadcastId || !delay) {
        console.error("Usage: delay <broadcastId> <delayInSeconds> [--onlyDelay] [--noDelay]");
        console.info("Use --help for more information.");
        process.exit(1);
      }
      // Validate delay is a number between 0s and 1h
      if (
        isNaN(parseInt(delay, 10)) &&
        parseInt(delay, 10) >= 0 &&
        parseInt(delay, 10) <= 3600
      ) {
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
    default:
      console.error("Unknown command. Supported commands: delay");
      process.exit(1);
  }
})();
