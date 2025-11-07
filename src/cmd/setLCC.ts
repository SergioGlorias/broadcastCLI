import { components } from "@lichess-org/types";
import { client, Command, showHelp, getBroadcast } from "../utils";

const setSourceLCC = (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  sourceLCC: string
) => {
  let rN = 1;
  rounds.forEach((round) => {
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
          syncSource: "url",
          syncUrl: `${sourceLCC}/${rN}`,
        },
      })
      .then((response) => {
        if (response.response.ok)
          console.log(
            `Successfully set source LCC for round ${round.id} to ${sourceLCC}/${rN}.`
          );
        else
          console.error(
            `Failed to set source LCC for round ${round.id}: ${response.response.statusText}`
          );
      })
      .catch((error) => {
        console.error(`Error setting source LCC for round ${round.id}:`, error);
      });
    rN += 1;
  });
};

export const setLCCCommand = async (args: string[]) => {
     const [bId, sourceLCC] = args.slice(0, 2);
      // check arg --help or -h
      if (args.includes("--help") || args.includes("-h")) {
        showHelp(Command.SetLCC);
        process.exit(0);
      }
      // Validate required args
      if (!bId || !sourceLCC) {
        showHelp(Command.SetLCC);
        process.exit(1);
      }

      const bcast = await getBroadcast(bId);
      if (!bcast?.rounds || bcast.rounds.length === 0) {
        console.error("No rounds found for the specified broadcast.");
        process.exit(1);
      }

      // check sourceLCC is a valid URL
      let url: URL;
      try {
        url = new URL(
          sourceLCC.startsWith("http")
            ? sourceLCC
            : `https://view.livechesscloud.com/${sourceLCC}`
        );
      } catch (e) {
        console.error("sourceLCC must be a valid URL or LCC ID.");
        process.exit(1);
      }

      setSourceLCC(bcast.rounds, url.toString());
};