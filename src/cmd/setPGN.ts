import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  sleep,
  handleApiResponse,
  translateRoundsToFix,
  checkTokenScopes,
} from "../utils/commandHandler";
import { getBroadcast } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";

const setPGN = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  urlRound: (roundNum: string | number) => string,
  setRoundFilter: boolean,
  setSliceFilter: string | null = null,
  roundsToFix?: number[],
) => {
  // Filter rounds based on criteria
  const roundsWithIndex = rounds.map((el, i) => ({ ...el, index: i }));
  let filteredRounds = roundsWithIndex.filter(
    (_, i) => !roundsToFix?.length || roundsToFix.includes(i + 1),
  );

  if (filteredRounds.length === 0) filteredRounds = roundsWithIndex;

  for (const [_, round] of filteredRounds.entries()) {
    const rN = round.index + 1;
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
          syncSource: "url",
          syncUrl: url,
          onlyRound: setRoundFilter ? rN : undefined,
          slices: setSliceFilter || undefined,
        },
      }),
      `Successfully set source for round ${cl.whiteBold(round.id)} to ${cl.whiteBold(url)}.`,
      `Error setting source for round ${cl.whiteBold(round.id)}`,
    );
    await sleep(200); // sleep 200ms to avoid rate limit issues
  }
};

export const setPGNCommand = async (args: string[]) => {
  await checkTokenScopes();
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

  try {
    const url = new URL(urlRound());
    if (!url.protocol.startsWith("http")) {
      throw new Error("Invalid protocol");
    }
    const isLCC = url.hostname === "view.livechesscloud.com";
    if (isLCC && url.hash.length > 1 && !url.hash.endsWith("/{}")) {
      console.error(
        cl.red(
          'Invalid URL. For livechesscloud URLs, please ensure it ends with "/{}".',
        ),
      );
      exit(1);
    }
  } catch (error) {
    console.error(
      cl.red('Invalid URL. Must be http/https with "{}" as round placeholder.'),
    );
    exit(1);
  }

  // parse arg --rounds
  const roundsArgIndex = args.findIndex((arg) => arg === "--rounds");
  let roundsToFix: number[] | undefined = undefined;
  if (roundsArgIndex !== -1 && roundsArgIndex + 1 < args.length) {
    const roundsArg = args[roundsArgIndex + 1];
    roundsToFix = roundsArg ? translateRoundsToFix(roundsArg) : undefined;
  }

  const setRoundFilter = args.includes("--withFilter");
  const sliceIndex = args.indexOf("--slice");
  const setSliceFilter =
    sliceIndex !== -1 ? args[sliceIndex + 1] || null : null;

  await setPGN(
    bcast.rounds,
    urlRound,
    setRoundFilter,
    setSliceFilter,
    roundsToFix,
  );
};
