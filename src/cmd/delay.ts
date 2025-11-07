import { exit } from "node:process";
import { components } from "@lichess-org/types";
import { client, msgCommonErrorHelp, sleep } from "../utils/commandHandler";
import { getBroadcast } from "../utils/getInfoBroadcast";
import cl from "../utils/colors";

const setDelayRounds = async (
  rounds: components["schemas"]["BroadcastRoundInfo"][],
  delay: number,
  onlyDelay: boolean,
  noDelay: boolean,
) => {
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
          delay: noDelay ? undefined : delay,
          startsAt:
            round.startsAt && !onlyDelay
              ? round.startsAt + delay * 1000
              : undefined,
        },
      })
      .then((response) => {
        if (response.response.ok)
          console.log(
            cl.green(
              `Successfully set delay for round ${cl.whiteBold(
                round.id,
              )} to ${cl.whiteBold(delay.toString())} seconds.`,
            ),
          );
        else
          console.error(
            cl.red(
              `Failed to set delay for round ${cl.whiteBold(round.id)}: ${cl.whiteBold(
                response.response.statusText,
              )}`,
            ),
          );
      })
      .catch((error) => {
        console.error(
          cl.red(`Error setting delay for round ${cl.whiteBold(round.id)}:`),
          error,
        );
      });
    // sleep 200ms to avoid rate limit issues
    await sleep(200);
  }
};

export const delayCommand = async (args: string[]) => {
  const [broadcastId, delay] = args.slice(0, 2);
  // Validate required args
  if (!broadcastId || !delay) {
    msgCommonErrorHelp("Broadcast ID and delay are required.");
    exit(1);
  }
  const delayNum = parseInt(delay, 10);
  // Validate delay is a number between 0s and 1h
  if (isNaN(delayNum) && delayNum >= 0 && delayNum <= 3600) {
    msgCommonErrorHelp("Delay must be a number between 0 and 3600 seconds.");
    exit(1);
  }
  // check arg --onlyDelay
  const onlyDelay = args.includes("--onlyDelay");
  // check arg --noDelay
  const noDelay = args.includes("--noDelay");
  if (onlyDelay && noDelay) {
    console.error(cl.red("Cannot use --onlyDelay and --noDelay together."));
    exit(1);
  }
  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast?.rounds || broadcast.rounds.length === 0) {
    console.error(cl.red("No rounds found for the specified broadcast."));
    exit(1);
  }
  setDelayRounds(broadcast.rounds, parseInt(delay, 10), onlyDelay, noDelay);
};
