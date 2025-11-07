import { components } from "@lichess-org/types";
import { client, Command, showHelp, getBroadcast } from "../utils";

const setPGN = (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  urlRound: (roundNum: string | number) => string,
  setRoundFilter: boolean,
  setSliceFilter: string | null = null
) => {
  let rN = 1;
  rounds.forEach((round) => {
    const url = urlRound(rN);
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
          syncUrl: url,
          onlyRound: setRoundFilter ? rN : undefined,
          slices: setSliceFilter ? setSliceFilter : undefined,
        },
      })
      .then((response) => {
        if (response.response.ok)
          console.log(
            `Successfully set source LCC for round ${round.id} to ${url}.`
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

  // check if link is from livechessviewer and check if it contains {}
  if (
    sourcePGN.includes("view.livechesscloud.com") &&
    !sourcePGN.endsWith("/{}")
  ) {
    console.error(
      'Invalid URL. For livechesscloud URLs, please ensure it ends with "/{}".'
    );
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

  const setRoundFilter = args.includes("--withFilter");
  const sliceIndex = args.indexOf("--slice");
  let setSliceFilter: string | null = null;
  //check if --slices is provided with a value in string format
  if (sliceIndex !== -1 && args.length > sliceIndex + 1) {
    setSliceFilter = args[sliceIndex + 1];
  }

  setPGN(bcast.rounds, urlRound, setRoundFilter, setSliceFilter);
};
