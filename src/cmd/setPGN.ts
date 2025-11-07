import { components } from "@lichess-org/types";
import { client, Command, showHelp, getBroadcast } from "../utils";

const setPGN = (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  urlRound: (roundNum: string | number) => string
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
          syncUrl: urlRound(rN),
        },
      })
      .then((response) => {
        if (response.response.ok)
          console.log(
            `Successfully set source LCC for round ${round.id} to ${urlRound(
              rN
            )}.`
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

export const setPGNCommand = async (args: string[]) => {
  const [bId, sourcePGN] = args.slice(0, 2);
  // check arg --help or -h
  if (args.includes("--help") || args.includes("-h")) {
    showHelp(Command.SetPGN);
    process.exit(0);
  }
  // Validate required args
  if (!bId || !sourcePGN) {
    showHelp(Command.SetPGN);
    process.exit(1);
  }

  const bcast = await getBroadcast(bId);
  if (!bcast?.rounds || bcast.rounds.length === 0) {
    console.error("No rounds found for the specified broadcast.");
    process.exit(1);
  }

  const urlRound = (roundNum: number | string) =>
    sourcePGN.replaceAll("{}", roundNum.toString());

  try {
    const url = new URL(urlRound(1));
    if (!url.protocol.startsWith("http")) throw new Error();
  } catch {
    console.error(
      'Invalid URL. Must be http/https with "{}" as round placeholder.'
    );
    process.exit(1);
  }

  setPGN(bcast.rounds, urlRound);
};
