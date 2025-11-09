import { exit } from "node:process";
import { components } from "@lichess-org/types";
import { client, msgCommonErrorHelp, sleep, handleApiResponse } from "../utils/commandHandler";
import { getBroadcast } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";

const setPGN = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  urlRound: (roundNum: string | number) => string,
  setRoundFilter: boolean,
  setSliceFilter: string | null = null,
) => {
  for (let rN = 1; rN <= rounds.length; rN++) {
    const round = rounds[rN - 1];
    const url = urlRound(rN);
    await handleApiResponse(
      client.POST("/broadcast/round/{broadcastRoundId}/edit", {
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
          slices: setSliceFilter || undefined,
        },
      }),
      `Successfully set source for round ${cl.whiteBold(round.id)} to ${cl.whiteBold(url)}.`,
      `Error setting source for round ${cl.whiteBold(round.id)}`
    );
    await sleep(200); // sleep 200ms to avoid rate limit issues
  }
};

export const setPGNCommand = async (args: string[]) => {
  const [bId, sourcePGN] = args.slice(0, 2);
  // Validate required args
  if (!bId || !sourcePGN) {
    msgCommonErrorHelp("Broadcast ID and source PGN URL are required.");
    exit(1);
  }

  const bcast = await getBroadcast(bId);
  if (!bcast?.rounds || bcast.rounds.length === 0) {
    msgCommonErrorHelp("No rounds found for the specified broadcast.");
    exit(1);
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
    console.error(
      cl.red(
        isLCC
          ? 'Invalid URL. For livechesscloud URLs, please ensure it ends with "/{}".'
          : 'Invalid URL. Must be http/https with "{}" as round placeholder.',
      ),
    );
    exit(1);
  }

  const setRoundFilter = args.includes("--withFilter");
  const sliceIndex = args.indexOf("--slice");
  const setSliceFilter = sliceIndex !== -1 ? args[sliceIndex + 1] || null : null;

  await setPGN(bcast.rounds, urlRound, setRoundFilter, setSliceFilter);
};
