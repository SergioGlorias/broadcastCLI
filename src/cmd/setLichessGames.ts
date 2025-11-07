import { components } from "@lichess-org/types";
import { client, Command, showHelp, getBroadcastRound } from "../utils";

const setLichessGames = (
  round: components["schemas"]["BroadcastRoundInfo"],
  games: string
) =>
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
        syncSource: "ids",
        syncIds: games,
      },
    })
    .then((response) => {
      if (response.response.ok)
        console.log(
          `Successfully set games for round ${round.id} to ${games}.`
        );
      else
        console.error(
          `Failed to set games for round ${round.id}: ${response.response.statusText}`
        );
    })
    .catch((error) => {
      console.error(`Error setting games for round ${round.id}:`, error);
    });

export const setLichessGamesCommand = async (args: string[]) => {
  // const [bId, sourcePGN] = args.slice(0, 2);
  const bId = args.shift();
  // games ids are max 64 ids
  const games = args.slice(0, 64).join(" ");
  // check arg --help or -h
  if (args.includes("--help") || args.includes("-h")) {
    showHelp(Command.SetLichessGames);
    process.exit(0);
  }
  // Validate required args
  if (!bId || !games) {
    showHelp(Command.SetLichessGames);
    process.exit(1);
  }

  const round = await getBroadcastRound(bId);
  if (!round) {
    console.error(`Broadcast round with ID ${bId} not found or has no rounds.`);
    process.exit(1);
  }

  setLichessGames(round, games);
};
