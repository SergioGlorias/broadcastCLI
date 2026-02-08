import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  sleep,
  handleApiResponse,
  checkTokenScopes,
} from "../utils/commandHandler.js";
import { getBroadcast } from "../utils/getInfoBroadcast.js";
import cl from "../utils/colors.js";

const setStartsPrevious = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  startsPrevious: boolean,
) => {
  const roundfilter = rounds.filter(
    (r) => r.startsAfterPrevious !== startsPrevious && !r.startsAt,
  );
  for (const round of roundfilter) {
    await handleApiResponse(
      client.POST("/broadcast/round/{broadcastRoundId}/edit", {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: {
          startsAfterPrevious: startsPrevious,
        },
      }),
      `Successfully set startsAfterPrevious for round ${cl.whiteBold(round.id)} to ${cl.whiteBold(startsPrevious.toString())}.`,
      `Error setting startsAfterPrevious for round ${cl.whiteBold(round.id)}`,
    );
    // sleep 200ms to avoid rate limit issues
    await sleep(200);
  }
};

export const startsPreviousCommand = async (args: string[]) => {
  await checkTokenScopes();
  const [broadcastId, startsPrevious] = args.slice(0, 2);
  // Validate required args
  if (!broadcastId || !startsPrevious) {
    msgCommonErrorHelp("Broadcast ID and startsPrevious are required.");
    exit(1);
  }
  const startsPreviousBool =
    startsPrevious.toLowerCase() === "true" ||
    startsPrevious === "1" ||
    startsPrevious.toLowerCase() === "yes";

  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast?.rounds || broadcast.rounds.length === 0) {
    console.error(cl.red("No rounds found for the specified broadcast."));
    exit(1);
  }
  await setStartsPrevious(broadcast.rounds, startsPreviousBool);
};
