import { exit } from "node:process";
import { components } from "@lichess-org/types";
import { client, msgCommonErrorHelp, sleep } from "../utils/commandHandler";
import { getBroadcast } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";
import { parse as ms } from "ms";

const fixScheduleRounds = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  timeDiff: number,
  roundsToFix?: number[],
) => {
  //if roundsToFix is provided, filter rounds to only those
  if (roundsToFix && roundsToFix.length > 0) {
    rounds = rounds.filter((_, i) => roundsToFix.includes(i + 1));
  }

  rounds = rounds.filter((el) => el.startsAt !== undefined);

  for (const round of rounds) {
    await client
      .POST("/broadcast/round/{broadcastRoundId}/edit", {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: {
          startsAt: round.startsAt! + timeDiff,
        },
      })
      .then((response) => {
        if (response.response.ok)
          console.log(
            cl.green(
              `Successfully fixed schedule for round ${cl.whiteBold(round.id)}.`,
            ),
          );
        else
          console.error(
            cl.red(
              `Failed to fix schedule for round ${cl.whiteBold(round.id)}: ${cl.whiteBold(
                response.response.statusText,
              )}`,
            ),
          );
      })
      .catch((error) => {
        console.error(
          cl.red(`Error fixing schedule for round ${cl.whiteBold(round.id)}:`),
          error,
        );
      });
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
      for (let i = start; i <= 64; i++) {
        rounds.push(i);
      }
    } else if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      for (let i = start; i <= end; i++) {
        rounds.push(i);
      }
    } else {
      const roundNum = parseInt(part, 10);
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
