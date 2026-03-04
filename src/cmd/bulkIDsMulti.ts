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

const getBulkIds = (bulkID: string) =>
  client
    .GET("/api/bulk-pairing/{id}", {
      params: { path: { id: bulkID } },
    })
    .then((response) => {
      const data = response.data;
      let ids =
        data?.games
          .map((game) => game.id)
          .filter((id) => typeof id === "string") || [];
      return ids;
    })
    .catch((error) => {
      console.error(
        cl.red(`Error fetching bulk pairing data: ${error.message}`),
      );
      return [];
    });

const splitIdsIntoGroups = (broadcastsIds: string[], gameIds: string[]) =>
  gameIds.reduce(
    (groups: string[][], id, index) => {
      groups[index % broadcastsIds.length].push(id);
      return groups;
    },
    broadcastsIds.map(() => [] as string[]),
  );

export const bulkIDsMultiCommand = async (args: string[]) => {
  await checkTokenScopes();
  const bulkID = args.shift();
  const broadcastsIds = args;
  // Validate required args
  if (!bulkID || !broadcastsIds) {
    msgCommonErrorHelp("Broadcast ID and rounds IDs are required.");
    exit(1);
  }

  const gameIds = await getBulkIds(bulkID);

  if (gameIds.length === 0) {
    console.error(
      cl.red(`No game IDs found for bulk ID ${cl.whiteBold(bulkID)}.`),
    );
    exit(1);
  }

  const groupedIds = splitIdsIntoGroups(broadcastsIds, gameIds);

  for (let [index, group] of groupedIds.entries()) {
    const roundId = broadcastsIds[index];
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
