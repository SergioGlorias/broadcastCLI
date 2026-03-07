import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  handleApiResponse,
  checkTokenScopes,
  sleep,
} from "../utils/commandHandler.js";
import { getBroadcastRound } from "../utils/getInfoBroadcast.js";
import cl from "../utils/colors.js";
import { splitIdsIntoGroups } from "../utils/splitTools.js";

const setLichessGames = (
  round: components["schemas"]["BroadcastRoundInfo"],
  games: string,
) =>
  handleApiResponse(
    client.POST("/broadcast/round/{broadcastRoundId}/edit", {
      params: {
        path: { broadcastRoundId: round.id },
        // @ts-ignore patch param is not yet documented
        query: { patch: 1 },
      },
      // @ts-ignore name of body properties due patch param is implicit
      body: {
        syncSource: "ids",
        syncIds: games,
      },
    }),
    `Successfully set games for round ${cl.whiteBold(round.id)} to ${cl.whiteBold(games)}.`,
    `Error setting games for round ${cl.whiteBold(round.id)}`,
  );

export const setLichessGamesMultiCommand = async (args: string[]) => {
  await checkTokenScopes();
  const bIds = args.shift()?.split(" ");
  const gamesIDs = args.shift()?.split(" ");
  // Validate required args
  if (!bIds || !gamesIDs) {
    msgCommonErrorHelp("Broadcast ID and games IDs are required.");
    exit(1);
  }

  const groups = splitIdsIntoGroups(bIds, gamesIDs);

  for (let [index, group] of groups.entries()) {
    const roundId = bIds[index];
    const round = await getBroadcastRound(roundId);
    if (!round) {
      console.error(
        cl.red(
          `Broadcast round with ID ${cl.whiteBold(roundId)} not found or has no rounds.`,
        ),
      );
      continue;
    }

    await setLichessGames(round, group.join(" "));

    await sleep(500); // Delay of 500ms between requests to avoid hitting rate limits
  }
};
