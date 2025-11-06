import { argv, env } from "process";
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration.js';
dayjs().format();
dayjs.extend(duration);

const LICHESS_TOKEN = env.LICHESS_TOKEN;
const LICHESS_DOMAIN = env.LICHESS_DOMAIN || "https://lichess.org/";

if (!LICHESS_TOKEN) {
  console.error("Error: LICHESS_TOKEN environment variable is not set.");
  process.exit(1);
}

const args = argv.slice(2);

const getBroadcastRounds = (id) =>
  fetch(`${LICHESS_DOMAIN}api/broadcast/${id}`, {
    headers: {
      Authorization: `Bearer ${LICHESS_TOKEN}`,
    },
  })
    .then((response) => {
      if (!response.ok)
        throw new Error(
          `Failed to fetch broadcast data: ${response.statusText}`
        );
      return response;
    })
    .then((response) => response.json())
    .then((data) => data.rounds);

const setDelayRounds = (rounds, delay, onlyDelay, noDelay) => 
  rounds.forEach((round) => {
    const jsonBody = {};
    jsonBody.delay = !noDelay ? delay : undefined;
    jsonBody.startsAt = round.startsAt && !onlyDelay ? dayjs(round.startsAt).add(delay, 'seconds').valueOf() : undefined;
    fetch(`${LICHESS_DOMAIN}broadcast/round/${round.id}/edit?patch=1`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LICHESS_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(jsonBody),
    })
      .then((response) => {
        if (response.ok) {
          console.log(
            `Successfully set delay for round ${round.id} to ${delay} seconds.`
          );
        } else {
          console.error(
            `Failed to set delay for round ${round.id}: ${response.statusText}`
          );
        }
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
      const roundIds = await getBroadcastRounds(broadcastId);
      setDelayRounds(roundIds, parseInt(delay, 10, onlyDelay, noDelay));
      break;
    default:
      console.error("Unknown command. Supported commands: delay");
      process.exit(1);
  }
})();
