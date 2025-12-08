import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  sleep,
  handleApiResponse,
  translateRoundsToFix,
} from "../utils/commandHandler";
import { getBroadcast } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";

const setDelayRounds = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  delay: number,
  onlyDelay: boolean,
  noDelay: boolean,
  roundsToFix?: number[],
) => {
  // Filter rounds based on criteria
  let filteredRounds = rounds.filter(
    (_, i) => !roundsToFix?.length || roundsToFix.includes(i + 1),
  );
  
  if (filteredRounds.length === 0) filteredRounds = rounds;

  for (const round of filteredRounds) {
    await handleApiResponse(
      client.POST("/broadcast/round/{broadcastRoundId}/edit", {
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
      }),
      `Successfully set delay for round ${cl.whiteBold(round.id)} to ${cl.whiteBold(delay.toString())} seconds.`,
      `Error setting delay for round ${cl.whiteBold(round.id)}`,
    );
    // sleep 200ms to avoid rate limit issues
    await sleep(200);
  }
};

export const delayCommand = async (args: string[]) => {
  const [broadcastId, delay] = args.slice(0, 2);
  // Validate required args
  if (!broadcastId || !delay) {
    msgCommonErrorHelp("Broadcast ID and delay are required.");
    exit(1);
  }
  const delayNum = parseInt(delay, 10);
  // Validate delay is a number between 0s and 1h
  if (isNaN(delayNum) || delayNum < 0 || delayNum > 3600) {
    msgCommonErrorHelp("Delay must be a number between 0 and 3600 seconds.");
    exit(1);
  }
  // check arg --onlyDelay
  const onlyDelay = args.includes("--onlyDelay");
  // check arg --noDelay
  const noDelay = args.includes("--noDelay");
  if (onlyDelay && noDelay) {
    console.error(cl.red("Cannot use --onlyDelay and --noDelay together."));
    exit(1);
  }

  // parse arg --rounds
    const roundsArgIndex = args.findIndex((arg) => arg === "--rounds");
    let roundsToFix: number[] | undefined = undefined;
    if (roundsArgIndex !== -1 && roundsArgIndex + 1 < args.length) {
      const roundsArg = args[roundsArgIndex + 1];
      roundsToFix = roundsArg ? translateRoundsToFix(roundsArg) : undefined;
    }

  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast?.rounds || broadcast.rounds.length === 0) {
    console.error(cl.red("No rounds found for the specified broadcast."));
    exit(1);
  }
  await setDelayRounds(broadcast.rounds, delayNum, onlyDelay, noDelay, roundsToFix);
}
