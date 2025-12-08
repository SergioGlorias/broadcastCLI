import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  handleApiResponse,
  checkTokenScopes,
} from "../utils/commandHandler";
import { getBroadcastRound } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";

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

export const setLichessGamesCommand = async (args: string[]) => {
  await checkTokenScopes();
  const bId = args.shift();
  // games ids are max 64 ids
  const games = args.slice(0, 64).join(" ");
  // Validate required args
  if (!bId || !games) {
    msgCommonErrorHelp("Broadcast ID and games IDs are required.");
    exit(1);
  }

  const round = await getBroadcastRound(bId);
  if (!round) {
    console.error(
      cl.red(
        `Broadcast round with ID ${cl.whiteBold(bId)} not found or has no rounds.`,
      ),
    );
    exit(1);
  }

  await setLichessGames(round, games);
};
