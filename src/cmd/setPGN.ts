import { components } from "@lichess-org/types";
import { client, msgCommonErrorHelp, sleep } from "../utils/commandHandler";
import { getBroadcast } from "../utils/getInfoBroadcast";


const setPGN = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  urlRound: (roundNum: string | number) => string,
  setRoundFilter: boolean,
  setSliceFilter: string | null = null
) => {
  for (let rN = 1; rN <= rounds.length; rN++) {
    const round = rounds[rN-1];
    const url = urlRound(rN);
    await client
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
            `Successfully set source for round ${round.id} to ${url}.`
          );
        else
          console.error(
            `Failed to set source for round ${round.id}: ${response.response.statusText}`
          );
      })
      .catch((error) => {
        console.error(`Error setting source for round ${round.id}:`, error);
      });
    await sleep(200); // sleep 200ms to avoid rate limit issues
  }
};

export const setPGNCommand = async (args: string[]) => {
  const [bId, sourcePGN] = args.slice(0, 2);
  // Validate required args
  if (!bId || !sourcePGN) {
    msgCommonErrorHelp("Broadcast ID and source PGN URL are required.");
    process.exit(1);
  }

  const bcast = await getBroadcast(bId);
  if (!bcast?.rounds || bcast.rounds.length === 0) {
    msgCommonErrorHelp("No rounds found for the specified broadcast.");
    process.exit(1);
  }

  const urlRound = (roundNum?: number | string) =>
    roundNum ? sourcePGN.replaceAll("{}", roundNum.toString()) : sourcePGN;
  let isLCC = false;
  try {
    const url = new URL(urlRound());
    if (!url.protocol.startsWith("http")) throw new Error();
    isLCC = url.hostname === "view.livechesscloud.com";
    if (isLCC && url.hash.length > 1 && !url.hash.endsWith("/{}"))
      throw new Error();
  } catch {
    if (isLCC)
      console.error(
        'Invalid URL. For livechesscloud URLs, please ensure it ends with "/{}".'
      );
    else
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
