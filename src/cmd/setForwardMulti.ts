import { exit } from 'node:process';
import { components } from '@lichess-org/types';
import {
  client,
  msgCommonErrorHelp,
  sleep,
  handleApiResponse,
  translateRoundsToFix,
  checkTokenScopes,
} from '../utils/commandHandler.js';
import { getBroadcast } from '../utils/getInfoBroadcast.js';
import cl from '../utils/colors.js';

const setForward = async (
  rounds: components['schemas']['BroadcastRoundInfo'][],
  urlsToForward: string[],
  setRoundFilter: boolean,
  setSliceFilter: string | null = null,
  roundsToFix?: number[],
) => {
  // Filter rounds based on criteria
  const roundsWithIndex = rounds.map((el, i) => ({ ...el, index: i }));
  let filteredRounds = roundsWithIndex.filter((_, i) => !roundsToFix?.length || roundsToFix.includes(i + 1));

  if (filteredRounds.length === 0) filteredRounds = roundsWithIndex;

  for (const [_, round] of filteredRounds.entries()) {
    const rN = round.index + 1;
    const urls = urlsToForward[round.index];
    await handleApiResponse(
      client.POST('/broadcast/round/{broadcastRoundId}/edit', {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: {
          syncSource: 'urls',
          syncUrls: urls,
          onlyRound: setRoundFilter ? rN : undefined,
          slices: setSliceFilter || undefined,
        },
      }),
      `Successfully set source for round ${cl.whiteBold(round.id)} to \n${cl.whiteBold(urls)}.`,
      `Error setting source for round ${cl.whiteBold(round.id)}`,
    );
    await sleep(200); // sleep 200ms to avoid rate limit issues
  }
};

export const setForwardMultiCommand = async (args: string[]) => {
  await checkTokenScopes(true);
  const [bId, forwardIDs] = args.slice(0, 2);
  // Validate required args
  if (!bId || !forwardIDs) {
    msgCommonErrorHelp('Broadcast ID and Broadcast ID to foward are required.');
    exit(1);
  }

  const bcast = await getBroadcast(bId);
  if (!bcast?.rounds || bcast.rounds.length === 0) {
    msgCommonErrorHelp('No rounds found for the specified broadcast.');
    exit(1);
  }

  const urls: string[][] = Array.from({ length: bcast.rounds.length }, () => []);

  const bIds = forwardIDs.split(' ');
  for (const forwardID of bIds) {
    const bward = await getBroadcast(forwardID);
    if (!bward?.rounds || bward.rounds.length === 0) {
      console.error(cl.red(`No rounds found to forward for the specified broadcast ID ${cl.whiteBold(forwardID)}.`));
      continue;
    }

    urls.forEach((urlGroup, i) => {
      const round = bward.rounds[i];
      if (round) urlGroup.push(round.url);
    });
  }

  const urlsToForward = urls.map(urlGroup => urlGroup.join('\n'));

  // parse arg --rounds
  const roundsArgIndex = args.findIndex(arg => arg === '--rounds');
  let roundsToFix: number[] | undefined = undefined;
  if (roundsArgIndex !== -1 && roundsArgIndex + 1 < args.length) {
    const roundsArg = args[roundsArgIndex + 1];
    roundsToFix = roundsArg ? translateRoundsToFix(roundsArg) : undefined;
  }

  const setRoundFilter = args.includes('--withFilter');
  const sliceIndex = args.indexOf('--slice');
  const setSliceFilter = sliceIndex !== -1 ? args[sliceIndex + 1] || null : null;

  await setForward(bcast.rounds, urlsToForward, setRoundFilter, setSliceFilter, roundsToFix);
};
