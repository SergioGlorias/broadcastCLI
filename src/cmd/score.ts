import { exit } from "node:process";
import { components } from "@lichess-org/types";
import {
  client,
  msgCommonErrorHelp,
  sleep,
  handleApiResponse,
  translateRoundsToFix,
  checkTokenScopes,
} from "../utils/commandHandler.js";
import { getBroadcast } from "../utils/getInfoBroadcast.js";
import cl from "../utils/colors.js";

const setScoreRounds = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  blackWin: number,
  blackDraw: number,
  whiteWin: number,
  whiteDraw: number,
  roundsToFix?: number[],
) => {
  // Filter rounds based on criteria
  let filteredRounds = rounds.filter(
    (_, i) => !roundsToFix?.length || roundsToFix.includes(i + 1),
  );

  if (filteredRounds.length === 0) filteredRounds = rounds;

  for (const round of filteredRounds) {
    await handleApiResponse(
      client.POST("/broadcast/round/{broadcastRoundId}/edit", {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: {
          "customScoring.black.draw": blackDraw,
          "customScoring.black.win": blackWin,
          "customScoring.white.draw": whiteDraw,
          "customScoring.white.win": whiteWin,
        },
      }),
      `Successfully set score for round ${cl.whiteBold(round.id)}: Black win=${cl.whiteBold(blackWin.toString())}, Black draw=${cl.whiteBold(blackDraw.toString())}, White win=${cl.whiteBold(whiteWin.toString())}, White draw=${cl.whiteBold(whiteDraw.toString())}.`,
      `Error setting score for round ${cl.whiteBold(round.id)}`,
    );
    // sleep 200ms to avoid rate limit issues
    await sleep(200);
  }
};

export const scoreCommand = async (args: string[]) => {
  await checkTokenScopes();
  const [broadcastId, whiteWinStr, whiteDrawStr, blackWinStr, blackDrawStr] =
    args.slice(0, 5);
  // Validate required args
  if (
    !broadcastId ||
    !whiteWinStr ||
    !whiteDrawStr ||
    !blackWinStr ||
    !blackDrawStr
  ) {
    msgCommonErrorHelp(
      "Broadcast ID, white win, white draw, black win, and black draw scores are required.",
    );
    exit(1);
  }
  // Parse scores
  const [whiteWin, whiteDraw, blackWin, blackDraw] = [
    whiteWinStr,
    whiteDrawStr,
    blackWinStr,
    blackDrawStr,
  ].map((scoreStr) => parseFloat(scoreStr));

  // Validate scores
  if ([whiteWin, whiteDraw, blackWin, blackDraw].some(isNaN)) {
    msgCommonErrorHelp(
      "Scores for white win, white draw, black win, and black draw must be valid numbers.",
    );
    exit(1);
  }

  if (
    [whiteWin, whiteDraw, blackWin, blackDraw].some(
      (score) => score < 0 || score > 10,
    )
  ) {
    msgCommonErrorHelp(
      "Scores for white win, white draw, black win, and black draw must be between 0 and 10.",
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

  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast?.rounds || broadcast.rounds.length === 0) {
    console.error(cl.red("No rounds found for the specified broadcast."));
    exit(1);
  }
  await setScoreRounds(
    broadcast.rounds,
    blackWin,
    blackDraw,
    whiteWin,
    whiteDraw,
    roundsToFix,
  );
};
