## Installation

```bash
npm install -g libroadcast-cli
```

## Usage

```bash
export LICHESS_TOKEN=lip_yourtoken
export LICHESS_DOMAIN=http://localhost:8080/ # optional

libroadcast
```

```bash
Usage: <command> [options]


Commands:
  delay <broadcastId> <delayInSeconds> [--onlyDelay] [--noDelay]
     Sets the delay for all rounds in the specified broadcast.
     Note:  The delay is specified in seconds. (max 3600 seconds = 1 hour)
     Options:
       --onlyDelay   Set only the delay without changing the start time.
       --noDelay     Do not modify the delay, only adjust the start time.

  setPGN <broadcastId> <sourcePGNUrl> [--withFilter] [--slice <sliceFilter>]
     Sets the source PGN URL for all rounds in the specified broadcast.
     (optional) Use "{}" in the URL as a placeholder for the round number.
     Note: For livechesscloud URLs, please ensure it ends with "/{}".
     Options:
       --withFilter            Apply round number filtering based on round number.
       --slice <sliceFilter>   Apply slice filtering using the provided filter string.

  setPGNMulti <broadcastId> <sourcePGNUrl> <gamesNum> [--withFilter] [--onlyGames <sliceFilter>]
     Sets the source PGN URLs for all rounds in the specified broadcast.
     Use {r} in the URL as a placeholder for the round number and {g} for the game number.
     Use the gamesNum parameter to specify how many games per round.
     Note: For broadcasts with multiple rounds, the source PGN URLs must include the "{g}" placeholder for round numbers.
     Options:
       --withFilter            Apply round number filtering based on round number.
       --onlyGames <sliceFilter>   Apply slice filtering using the provided filter string.

  setLichessGames <broadcastRoundId> <gameIds...>
     Sets the games for the specified broadcast round using Lichess game IDs.
     Note: Maximum of 64 game IDs can be provided.

  fixSchedule <broadcastId> <timeDiff> [--rounds <roundsToFix>]
     Fixes the schedule of rounds in the specified broadcast by applying a time difference.
     Note: The time difference should be in a format like "1h", "30m", "15s", etc.
     Options:
       --rounds <roundsToFix>   Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.

  startsPrevious <broadcastId> <startsPrevious>
     Sets the startsAfterPrevious flag for all rounds in the specified broadcast.


Examples:
   # Set a 5-minute delay without changing start time
     $ delay bcast123 300 --onlyDelay
   # Set source PGN URL with round and slice filters
     $ setPGN bcast123 https://example.com/pgns/round-{}/game.pgn --withFilter --slice "1-5,7,9-12"
  # Set source PGN URLs for multiple games per round
     $ setPGNMulti bcast123 https://example.com/pgns/round-{r}/game-{g}.pgn 12 --withFilter --onlyGames "1-5,7,9-12"
   # Set Lichess games for a broadcast round
     $ setLichessGames round456 gameId1 gameId2 gameId3
   # Fix schedule of rounds 1 to 4 and all rounds after 8 by adding 15 minutes
     $ fixSchedule bcast123 15m --rounds 1-4,8+
  # Set startsAfterPrevious to true for all rounds in a broadcast
     $ startsPrevious bcast123 true
```
