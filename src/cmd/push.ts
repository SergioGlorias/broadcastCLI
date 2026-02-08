import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  msgCommonErrorHelp,
  sleep,
  checkTokenScopes,
} from "../utils/commandHandler.js";
import { getBroadcastRound } from "../utils/getInfoBroadcast.js";
import cl from "../utils/colors.js";
import { pushPGN, readPGNFromURL, loopChecker } from "../utils/pushTools.js";

let lastPGN = "";

const loop = async (
  roundInfo: components["schemas"]["BroadcastRoundInfo"],
  pgnPath: string,
  loopTimer: number,
) => {
  while (true) {
    const pgnContent = await readPGNFromURL(pgnPath);
    if (pgnContent && pgnContent !== lastPGN) {
      await pushPGN(roundInfo, pgnContent);
      lastPGN = pgnContent;
    }
    await sleep(loopTimer * 1000);
  }
};

export const pushCommand = async (args: string[]) => {
  await checkTokenScopes();
  const [roundId, pgnPath] = args.slice(0, 2);
  // Validate required args
  if (!roundId || !pgnPath) {
    msgCommonErrorHelp("Round ID and PGN are required.");
    exit(1);
  }

  const roundInfo = await getBroadcastRound(roundId);

  if (!roundInfo) {
    console.error(cl.red("Round not found."));
    exit(1);
  }

  const loopTimer = loopChecker(args);

  if (loopTimer) {
    console.log(
      cl.green(
        `Starting loop to push PGN every ${cl.whiteBold(loopTimer.toString())} seconds...`,
      ),
    );
    console.log(cl.blue("Press Ctrl+C to stop."));
    await loop(roundInfo, pgnPath, loopTimer);
  } else {
    const pgnContent = await readPGNFromURL(pgnPath);
    if (pgnContent) await pushPGN(roundInfo, pgnContent);
  }
};
