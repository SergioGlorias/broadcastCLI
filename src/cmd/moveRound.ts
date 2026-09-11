import { exit } from 'node:process';
import { components } from '@lichess-org/types';
import { msgCommonErrorHelp, checkTokenScopes, handleApiResponse, client, sleep } from '../utils/commandHandler.js';
import { getBroadcastRound } from '../utils/getInfoBroadcast.js';
import cl from '../utils/colors.js';

const moveRound = async (
  round: components['schemas']['BroadcastRoundInfo'],
  direction: boolean,
  time: number,
) => {
  for (let index = 0; index < time; index++) {
    await handleApiResponse(
      client.POST('/broadcast/round/{broadcastRoundId}/edit', {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        body: {
          // @ts-ignore move is not yet documented
          move: direction
        },
      }),
      `Successfully moved round ${cl.whiteBold(round.id)} ${direction ? 'up' : 'down'}.`,
      `Error moving round ${cl.whiteBold(round.id)} ${direction ? 'up' : 'down'}`,
    );
    await sleep(200);
  }
};

export const moveRoundCommand = async (args: string[]) => {
  await checkTokenScopes(true);
  const [roundId, upOrDown, time] = args.slice(0, 3);
  // Validate required args
  if (!roundId || !upOrDown || !time) {
    msgCommonErrorHelp('Round ID, upOrDown, and time are required.');
    exit(1);
  }

  let direction: boolean;
  if (['up', 'true', '1'].includes(upOrDown.toLowerCase())) direction = true;
  else if (['down', 'false', '0'].includes(upOrDown.toLowerCase())) direction = false;
  else {
    msgCommonErrorHelp('upOrDown must be "up" or "down".');
    exit(1);
  }

  const timeNum = parseInt(time, 10);
  // Validate time is a number between 1 and 64
  if (isNaN(timeNum) || timeNum < 1 || timeNum > 64) {
    msgCommonErrorHelp('Time must be a number between 1 and 64.');
    exit(1);
  }

  const roundInfo = await getBroadcastRound(roundId);

  if (!roundInfo) {
    console.error(cl.red('Round not found.'));
    exit(1);
  }

  await moveRound(roundInfo, direction, timeNum);
};
