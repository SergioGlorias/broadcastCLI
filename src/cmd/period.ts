import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  sleep,
  handleApiResponse,
  translateRoundsToFix,
  checkTokenScopes,
} from "../utils/commandHandler.js";
import { getBroadcast } from "../utils/getInfoBroadcast.js";
import cl from "../utils/colors.js";

const setPeriodRounds = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  period: number,
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
          period: period,
        },
      }),
      `Successfully set period for round ${cl.whiteBold(round.id)} to ${cl.whiteBold(period.toString())} seconds.`,
      `Error setting period for round ${cl.whiteBold(round.id)}`,
    );
    // sleep 200ms to avoid rate limit issues
    await sleep(200);
  }
};

export const periodCommand = async (args: string[]) => {
  await checkTokenScopes(true);
  const [broadcastId, period] = args.slice(0, 2);
  // Validate required args
  if (!broadcastId || !period) {
    msgCommonErrorHelp("Broadcast ID and period are required.");
    exit(1);
  }
  const periodNum = parseInt(period, 10);
  // Validate period is a number between 2s and 60s
  if (isNaN(periodNum) || periodNum < 2 || periodNum > 60) {
    msgCommonErrorHelp("Period must be a number between 2 and 60 seconds.");
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
  await setPeriodRounds(broadcast.rounds, periodNum, roundsToFix);
};
