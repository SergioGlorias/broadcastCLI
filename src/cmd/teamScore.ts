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

const setTeamScoreRounds = async (
  rounds: components['schemas']['BroadcastRoundInfo'][],
  teamWin: number,
  teamDraw: number,
  roundsToFix?: number[],
) => {
  // Filter rounds based on criteria
  let filteredRounds = rounds.filter((_, i) => !roundsToFix?.length || roundsToFix.includes(i + 1));

  if (filteredRounds.length === 0) filteredRounds = rounds;

  for (const round of filteredRounds) {
    await handleApiResponse(
      client.POST('/broadcast/round/{broadcastRoundId}/edit', {
        params: {
          path: { broadcastRoundId: round.id },
          // @ts-ignore patch param is not yet documented
          query: { patch: 1 },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: {
          // @ts-ignore teamCustomScoring.win and teamCustomScoring.draw are not yet documented
          'teamCustomScoring.win': teamWin,
          'teamCustomScoring.draw': teamDraw,
        },
      }),
      `Successfully set score for round ${cl.whiteBold(round.id)}: Team win=${cl.whiteBold(teamWin.toString())}, Team draw=${cl.whiteBold(teamDraw.toString())}.`,
      `Error setting score for round ${cl.whiteBold(round.id)}`,
    );
    // sleep 200ms to avoid rate limit issues
    await sleep(200);
  }
};

export const teamScoreCommand = async (args: string[]) => {
  await checkTokenScopes();
  const [broadcastId, teamWinStr, teamDrawStr] = args.slice(0, 5);
  // Validate required args
  if (!broadcastId || !teamWinStr || !teamDrawStr) {
    msgCommonErrorHelp('Broadcast ID, team win, and team draw scores are required.');
    exit(1);
  }
  // Parse scores
  const [teamWin, teamDraw] = [teamWinStr, teamDrawStr].map(scoreStr => parseFloat(scoreStr));

  // Validate scores
  if ([teamWin, teamDraw].some(isNaN)) {
    msgCommonErrorHelp('Scores for team win and team draw must be valid numbers.');
    exit(1);
  }

  if ([teamWin, teamDraw].some(score => score < 0 || score > 10)) {
    msgCommonErrorHelp('Scores for team win and team draw must be between 0 and 10.');
    exit(1);
  }

  // parse arg --rounds
  const roundsArgIndex = args.findIndex(arg => arg === '--rounds');
  let roundsToFix: number[] | undefined = undefined;
  if (roundsArgIndex !== -1 && roundsArgIndex + 1 < args.length) {
    const roundsArg = args[roundsArgIndex + 1];
    roundsToFix = roundsArg ? translateRoundsToFix(roundsArg) : undefined;
  }

  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast?.rounds || broadcast.rounds.length === 0) {
    console.error(cl.red('No rounds found for the specified broadcast.'));
    exit(1);
  }
  await setTeamScoreRounds(broadcast.rounds, teamWin, teamDraw, roundsToFix);
};
