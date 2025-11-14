import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  sleep,
  handleApiResponse,
} from "../utils/commandHandler";
import { getBroadcast } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";

const setPGN = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  urlsRound: (gamesN: number, roundNum?: string | number) => string[],
  gamesNum: number,
  setRoundFilter: boolean,
  setSliceFilter: number[] | null = null,
) => {
  for (const [index, round] of rounds.entries()) {
    const rN = index + 1;
    const urls = urlsRound(gamesNum, rN).filter((_, i) =>
      setSliceFilter ? setSliceFilter.includes(i + 1) : true,
    ).join("\n");
    await handleApiResponse(
      client.POST("/broadcast/round/{broadcastRoundId}/edit", {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: {
          syncSource: "urls",
          syncUrls: urls,
          onlyRound: setRoundFilter ? rN : undefined,
        },
      }),
      `Successfully set source for round ${cl.whiteBold(round.id)} to\n${cl.whiteBold(urls)}`,
      `Error setting source for round ${cl.whiteBold(round.id)}`,
    );
    await sleep(200); // sleep 200ms to avoid rate limit issues
  }
};

// if per example: 8+ is provided, all round numbers after round 8 will be selected
// if 1-4 is provided, only rounds 1 to 4 will be selected
// if 3,5,7 is provided, only rounds 3,5 and 7 will be selected
// if 1-4,6,8+ is provided, rounds 1 to 4, round 6 and all rounds after round 8 will be selected
const translateGamesToAdd = (arg: string, gamesN: number): number[] | null => {
  const rounds: number[] = [];
  if (arg.trim() === "") return null;
  const parts = arg.split(",");

  for (const part of parts) {
    if (part.endsWith("+")) {
      const start = parseInt(part.slice(0, -1), 10);
      if (isNaN(start)) continue;
      for (let i = start; i <= gamesN; i++) {
        rounds.push(i);
      }
    } else if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) continue;
      for (let i = start; i <= end; i++) {
        rounds.push(i);
      }
    } else {
      const roundNum = parseInt(part, 10);
      if (isNaN(roundNum)) continue;
      rounds.push(roundNum);
    }
  }
  return [...new Set(rounds)];
};

export const setPGNMultiCommand = async (args: string[]) => {
  const [bId, sourcePGNs, gamesN] = args.slice(0, 3);
  // Validate required args
  if (!bId || !sourcePGNs || !gamesN) {
    msgCommonErrorHelp("Broadcast ID, source PGN URLs, and number of games are required.");
    exit(1);
  }

  const bcast = await getBroadcast(bId);
  if (!bcast?.rounds || bcast.rounds.length === 0) {
    msgCommonErrorHelp("No rounds found for the specified broadcast.");
    exit(1);
  }

  let gamesNum = parseInt(gamesN, 10);
  if (isNaN(gamesNum) || gamesNum <= 0) {
    msgCommonErrorHelp("Number of games must be a positive integer.");
    exit(1);
  }

  if (bcast.rounds.length > 1 && !sourcePGNs.includes("{g}")) {
    console.error(
      cl.red(
        'For broadcasts with multiple rounds, the source PGN URLs must include the "{g}" placeholder for round numbers.',
      ),
    );
    exit(1);
  }

  const urlRound = (gamesN: number, roundNum?: number | string) => {
    let rN = roundNum ? sourcePGNs.replaceAll("{r}", roundNum.toString()) : sourcePGNs;
    let urls = [];
    for (let i = 1; i <= gamesN; i++) {
      urls.push(rN.replaceAll("{g}", i.toString()));
    }
    return urls;
  }
    

  try {
    const url = new URL(urlRound(gamesNum,1)[0]);
    if (!url.protocol.startsWith("http")) {
      throw new Error("Invalid protocol");
    }
    const isLCC = url.hostname === "view.livechesscloud.com";
    if (isLCC) {
      console.error(
        cl.red(
          'Invalid URL.',
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

  const setRoundFilter = args.includes("--withFilter");

  const sliceIndex = args.indexOf("--onlyGames");
  const setSliceFilter =
    sliceIndex !== -1 ? translateGamesToAdd(args[sliceIndex + 1] || "", gamesNum) : null;
    

  await setPGN(bcast.rounds, urlRound, gamesNum, setRoundFilter, setSliceFilter);
};
