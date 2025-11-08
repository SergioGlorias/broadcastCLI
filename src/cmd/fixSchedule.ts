import { exit } from "node:process";
import { components } from "@lichess-org/types";
import { client, msgCommonErrorHelp, sleep } from "../utils/commandHandler";
import { getBroadcast } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";
import { parse as ms } from "ms";

const fixScheduleRounds = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  timeDiff: number,
  roundsToFix?: number[]
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
              `Successfully fixed schedule for round ${cl.whiteBold(round.id)}.`
            )
          );
        else
          console.error(
            cl.red(
              `Failed to fix schedule for round ${cl.whiteBold(round.id)}: ${cl.whiteBold(
                response.response.statusText
              )}`
            )
          );
      })
      .catch((error) => {
        console.error(
          cl.red(`Error fixing schedule for round ${cl.whiteBold(round.id)}:`),
          error
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
  const timeDiff = ms(timeDiffStr);

  if (isNaN(timeDiff)) {
    msgCommonErrorHelp(
      "Time difference must be a valid duration string (e.g., '1h', '30m', '15s')."
    );
    exit(1);
  }

  // parse arg --rounds
  const roundsArgIndex = args.findIndex((arg) => arg === "--rounds");
  if (roundsArgIndex === -1 || roundsArgIndex + 1 >= args.length) {
    return undefined;
  }
  const roundsArg = args[roundsArgIndex + 1];
  const roundsToFix = roundsArg ? translateRoundsToFix(roundsArg) : undefined;

  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast) {
    console.error(cl.red(`Broadcast ${cl.whiteBold(broadcastId)} not found.`));
    exit(1);
  }

  const rounds = broadcast.rounds;
  await fixScheduleRounds(rounds, timeDiff, roundsToFix);
};
