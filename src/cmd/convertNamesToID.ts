import { exit } from "node:process";
import {
  msgCommonErrorHelp,
  checkTokenScopes,
  client,
  handleApiResponse
} from "../utils/commandHandler.js";
import { parsePgn } from "chessops/pgn";
import { getBroadcastRound } from "../utils/getInfoBroadcast.js";
import cl from "../utils/colors.js";

const setGameIds = (roundInfo: any, gameIds: string) =>
  handleApiResponse(
    client.POST("/broadcast/round/{broadcastRoundId}/edit", {
      params: {
        path: { broadcastRoundId: roundInfo.id },
        // @ts-ignore patch param is not yet documented
        query: { patch: 1 },
      },
      // @ts-ignore name of body properties due patch param is implicit
      body: {
        syncSource: "ids",
        syncIds: gameIds,
      },
    }),
    `Successfully set game IDs for round ${cl.whiteBold(roundInfo.id)}.`,
    `Error setting game IDs for round ${cl.whiteBold(roundInfo.id)}`,
  );


const getGameIdFromPgn = async (roundId: string) => {
  const response = await client.GET("/api/broadcast/round/{broadcastRoundId}.pgn", {
    params: { path: { broadcastRoundId: roundId } },
  });
  
  if (!response.response.ok) {
    console.error(cl.red("Failed to fetch PGN for the round."));
    exit(1);
  }

  const pgn = parsePgn(await response.response.text());
  const gamesWithIds = pgn.map((game) => game.headers.get("GameId") || null).filter(id => typeof id === "string") as string[];

  return gamesWithIds;
};

export const convertNamesToIDCommand = async (args: string[]) => {
  await checkTokenScopes();
  const [roundId] = args.slice(0, 1);
  // Validate required args
  if (!roundId) {
    msgCommonErrorHelp("Round ID is required.");
    exit(1);
  }

  const roundInfo = await getBroadcastRound(roundId);

  if (!roundInfo) {
    console.error(cl.red("Round not found."));
    exit(1);
  }

  const gameIds = await getGameIdFromPgn(roundId);

  if (gameIds.length === 0) {
    console.error(cl.red("No games with GameId found in the PGN."));
    exit(1);
  }

  const IdsString = gameIds.join(" ");

  await setGameIds(roundInfo, IdsString);
};

