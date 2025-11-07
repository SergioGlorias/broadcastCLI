import { client } from "./commandHandler";
import cl from "./colors";

export const getBroadcast = (broadcastId: string) =>
  client
    .GET("/api/broadcast/{broadcastTournamentId}", {
      params: {
        path: { broadcastTournamentId: broadcastId },
      },
    })
    .then((response) => response.data)
    .catch((error) => {
      console.error(cl.red("Error fetching broadcast:"), error);
      return null;
    });

export const getBroadcastRound = (roundId: string) =>
  client
    .GET(
      "/api/broadcast/{broadcastTournamentSlug}/{broadcastRoundSlug}/{broadcastRoundId}",
      {
        params: {
          path: {
            broadcastTournamentSlug: "-",
            broadcastRoundSlug: "-",
            broadcastRoundId: roundId,
          },
        },
      },
    )
    .then((response) => response.data?.round)
    .catch((error) => {
      console.error(cl.red("Error fetching broadcast round:"), error);
      return null;
    });
