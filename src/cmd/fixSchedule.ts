import { exit } from "node:process";
import { components } from "@lichess-org/types";
import { client, msgCommonErrorHelp, sleep, handleApiResponse } from "../utils/commandHandler";
import { getBroadcast } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";
import { parse as ms } from "ms";

const fixScheduleRounds = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  timeDiff: number,
  roundsToFix?: number[],
) => {
  // Filter rounds based on criteria
  rounds = rounds
    .filter((_, i) => !roundsToFix?.length || roundsToFix.includes(i + 1))
    .filter((el) => el.startsAt !== undefined);

  for (const round of rounds) {
    await handleApiResponse(
      client.POST("/broadcast/round/{broadcastRoundId}/edit", {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: {
          startsAt: round.startsAt! + timeDiff,
        },
      }),
      `Successfully fixed schedule for round ${cl.whiteBold(round.id)}.`,
      `Error fixing schedule for round ${cl.whiteBold(round.id)}`
    );
    // sleep 200ms to avoid rate limit issues
    await sleep(200);
  }
};

// if per example: 8+ is provided, all round numbers after round 8 will be selected
// if 1-4 is provided, only rounds 1 to 4 will be selected
// if 3,5,7 is provided, only rounds 3,5 and 7 will be selected
// if 1-4,6,8+ is provided, rounds 1 to 4, round 6 and all rounds after round 8 will be selected
const translateRoundsToFix = (arg: string): number[] => {
  const rounds: number[] = [];
  const parts = arg.split(",");

  for (const part of parts) {
    if (part.endsWith("+")) {
      const start = parseInt(part.slice(0, -1), 10);
      if (isNaN(start)) continue;  // adicionar validação
      for (let i = start; i <= 64; i++) {
        rounds.push(i);
      }
    } else if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) continue;  // adicionar validação
      for (let i = start; i <= end; i++) {
        rounds.push(i);
      }
    } else {
      const roundNum = parseInt(part, 10);
      if (isNaN(roundNum)) continue;  // adicionar validação
      rounds.push(roundNum);
    }
  }
  return rounds;
};

export const fixScheduleCommand = async (args: string[]) => {
  const [broadcastId, timeDiffStr] = args.slice(0, 2);
  if (!broadcastId || !timeDiffStr) {
    msgCommonErrorHelp("Broadcast ID and time difference are required.");
    exit(1);
  }

  const timeDiff = ms(timeDiffStr);

  if (isNaN(timeDiff)) {
    console.error(
      cl.red(
        "Error: Time difference must be a valid duration string (e.g., '1h', '30m', '15s').",
      ),
    );
    exit(1);
  }
  console.log(
    `Applying time difference of ${cl.whiteBold(timeDiffStr)} (${cl.whiteBold(
      timeDiff.toString(),
    )} ms) to broadcast ${cl.whiteBold(broadcastId)}.`,
  );
  // parse arg --rounds
  const roundsArgIndex = args.findIndex((arg) => arg === "--rounds");
  let roundsToFix: number[] | undefined = undefined;
  if (roundsArgIndex !== -1 && roundsArgIndex + 1 < args.length) {
    const roundsArg = args[roundsArgIndex + 1];
    roundsToFix = roundsArg ? translateRoundsToFix(roundsArg) : undefined;
  }

  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast?.rounds || broadcast.rounds.length === 0) {
    console.error(
      cl.red(
        `Broadcast with ID ${cl.whiteBold(
          broadcastId,
        )} not found or has no rounds.`,
      ),
    );
    exit(1);
  }
  await fixScheduleRounds(broadcast.rounds, timeDiff, roundsToFix);
};
