import { exit } from 'node:process';
import { msgCommonErrorHelp, sleep, checkTokenScopes, client } from '../utils/commandHandler.js';
import { getBroadcast } from '../utils/getInfoBroadcast.js';
import cl from '../utils/colors.js';

export const getPlayersCommand = async (args: string[]) => {
  await checkTokenScopes();
  const [broadcastID, style] = args.slice(0, 2);
  // Validate required args
  if (!broadcastID || !style) {
    msgCommonErrorHelp('Broadcast ID and style are required.');
    exit(1);
  }

  const broadcast = await getBroadcast(broadcastID);

  if (!broadcast) {
    console.error(cl.red('Broadcast not found.'));
    exit(1);
  }

  const players = await client
    .GET('/broadcast/{broadcastTournamentId}/players', {
      params: {
        path: { broadcastTournamentId: broadcast.tour.id },
      },
    })
    .then(response => {
      return response.data;
    })
    .catch(err => {
      console.error(cl.red('Error fetching players:'), err);
      exit(1);
    });

  if (!players || !Array.isArray(players)) {
    console.error(cl.red('No players found.'));
    exit(1);
  }

  let playersImportantInfo = players.map(player => ({
    country: player.fed ?? 'NON',
    title: player.title ?? '',
    name: player.name,
    fideId: player.fideId ?? 0,
    elo: player.rating ?? 0,
  }));

  if (args.includes('--update')) {
    console.log(cl.boldYellow('Updating player information from FIDE API...'));
    playersImportantInfo = await Promise.all(
      playersImportantInfo.map(async player => {
        try {
          const response = await client.GET('/api/fide/player/{playerId}', {
            params: {
              path: { playerId: player.fideId },
            },
          });
          const playerData = response.data;

          player.country = playerData?.federation ?? player.country;
          player.title = playerData?.title ?? player.title;
          player.elo = playerData?.[broadcast.tour.info?.fideTC!] ?? player.elo;
        } catch (err) {
          console.error(cl.red('Error fetching player data:'), err);
        }
        await sleep(500); // Sleep for 500ms to avoid rate limit issues
        return player;
      }),
    );
  }

  if (style === 'table') {
    console.table(playersImportantInfo);
  } else if (style === 'replace') {
    playersImportantInfo.forEach(player => {
      console.log(
        `${player.name} / ${player.fideId} / ${player.title} / ${player.elo} / / ${player.country}`,
      );
    });
  } else {
    console.error(cl.red('Invalid style. Use "table" or "replace".'));
    exit(1);
  }
};
