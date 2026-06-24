import { components } from '@lichess-org/types';
import { client, packageJson } from './commandHandler.js';
import cl from './colors.js';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { exit } from 'node:process';
import { parsePgn, makePgn, PgnNodeData, Game, ChildNode, Node } from 'chessops/pgn';
import { Chess } from 'chessops/chess';
import { parseFen } from 'chessops/fen';
import { parseSan } from 'chessops/san';

export const pushPGN = async (round: components['schemas']['BroadcastRoundInfo'], pgn: string) => {
  try {
    const res = await client
      .POST('/api/broadcast/round/{broadcastRoundId}/push', {
        params: {
          path: { broadcastRoundId: round.id },
        },
        // @ts-ignore name of body properties due patch param is implicit
        body: pgn,
        bodySerializer: (body: string) => body,
      })
      .then(response => response.data);

    console.log(cl.green(`✓ Successfully pushed PGN for round ${cl.whiteBold(round.id)}.`));
    console.table(
      res?.games
        .map((game, i) => {
          return {
            id: i + 1,
            'White Player': game.tags['White'] || 'Unknown',
            'Black Player': game.tags['Black'] || 'Unknown',
            Result: game.tags['Result'] || 'Unknown',
            'Ply Count': game.moves ?? 'Unknown',
            Error: game.error || 'None',
          };
        })
        .reduce((acc: Record<number, object>, { id, ...rest }) => {
          acc[id] = rest;
          return acc;
        }, {}),
    );
  } catch (error) {
    console.error(cl.red(`Error pushing PGN for round ${cl.whiteBold(round.id)}:`), error);
  }
};

const validateMovesInPGN = (pgn: string) => {
  const parsed = parsePgn(pgn);
  const results: Array<{
    gameIndex: number;
    white: string;
    black: string;
    legalMoves: number;
    totalMoves: number;
    status: string;
  }> = [];
  const cleanPgnLines: string[] = [];

  for (let gameIndex = 0; gameIndex < parsed.length; gameIndex++) {
    const game = parsed[gameIndex];
    const white = game.headers.get('White') || 'Unknown';
    const black = game.headers.get('Black') || 'Unknown';

    // Get initial position (use FEN if available, otherwise standard initial position)
    const initialFen = game.headers.get('FEN') ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const setup = parseFen(initialFen).unwrap();
    const pos = Chess.fromSetup(setup).unwrap();

    // Validate moves sequentially, stop at first illegal move
    let legalMoves = 0;
    let totalMoves = 0;
    let status = 'Valid';
    const validatedMoves: PgnNodeData[] = [];

    for (const move of game.moves.mainline()) {
      totalMoves++;
      const mv = parseSan(pos, move.san);
      if (!mv || !pos.isLegal(mv)) {
        status = `Illegal move at ply ${totalMoves}: ${move.san}`;
        break;
      }
      validatedMoves.push(move);
      pos.play(mv);
      legalMoves++;
    }

    results.push({ gameIndex: gameIndex + 1, white, black, legalMoves, totalMoves, status });

    // Build clean game with only legal moves (reconstruct Node tree)
    let movesNode = new Node();
    for (const moveData of validatedMoves) {
      const childNode = new ChildNode(moveData);
      movesNode.children = [childNode];
      movesNode = childNode;
    }

    const cleanGame: Game<PgnNodeData> = {
      headers: game.headers,
      moves: new Node(),
    };
    // Rebuild the moves tree with validated moves
    let node = cleanGame.moves;
    for (const moveData of validatedMoves) {
      const newNode = new ChildNode(moveData);
      node.children = [newNode];
      node = newNode;
    }
    cleanPgnLines.push(makePgn(cleanGame));
  }

  console.log(cl.green(`✓ PGN validation completed. ${results.length} games processed.`));
  console.table(
    results.reduce((acc: Record<number, object>, { gameIndex, ...rest }) => {
      acc[gameIndex] = rest;
      return acc;
    }, {}),
  );

  return cleanPgnLines.join('\n\n');
};

export const readPGNFromURL = async (pgnURL: string, validateMoves?: boolean) => {
  // url can be a file path or a web URL
  if (pgnURL.startsWith('http://') || pgnURL.startsWith('https://')) {
    // Fetch from web URL
    const response = await fetch(pgnURL, {
      method: 'GET',
      headers: {
        'User-Agent': packageJson.name + '/' + packageJson.version,
      },
    });
    if (!response.ok) {
      console.error(cl.red(`Failed to fetch PGN from URL: ${response.statusText}`));
      return undefined;
    }
    const pgnText = validateMoves ? validateMovesInPGN(await response.text()) : await response.text();

    return pgnText;
  } else {
    // Assume it's a file path
    const resolvedPath = path.resolve(pgnURL);
    const stats = await readFile(resolvedPath, { encoding: 'utf-8' }).catch(err => {
      console.error(cl.red(`Failed to read PGN file: ${err.message}`));
      return undefined;
    });
    if (!stats) return undefined;
    return stats.toString();
  }
};

export const loopChecker = (args: string[]) => {
  // parse arg --loop <timerInSeconds>
  const loopArgIndex = args.findIndex(arg => arg === '--loop');
  let loopTimer: number | undefined = undefined;
  if (loopArgIndex !== -1 && loopArgIndex + 1 < args.length) {
    const loopTimerStr = args[loopArgIndex + 1];
    loopTimer = parseInt(loopTimerStr, 10);
    if (isNaN(loopTimer) || loopTimer <= 0) {
      console.error(cl.red('Loop timer must be a positive integer.'));
      exit(1);
    }
  }
  return loopTimer;
};
