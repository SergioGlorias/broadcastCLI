## Installation

```bash
npm install -g libroadcast-cli
```

## Usage

```bash
libroadcast login

libroadcast <command> [options]
```

```bash
Usage: <command> [options]


Commands:
  login [--logout]
     Save your Lichess token and domain for future use.
     This allows you to use the CLI without setting environment variables.
     Options:
       --logout (-lo)   Clear saved credentials and log out.

  delay <broadcastId> <delayInSeconds> [--onlyDelay] [--noDelay] [--rounds <roundsToFix>] 
     Sets the delay for all rounds in the specified broadcast.
     Note:  The delay is specified in seconds. (max 3600 seconds = 1 hour)
     Options:
       --onlyDelay   Set only the delay without changing the start time.
       --noDelay     Do not modify the delay, only adjust the start time.
       --rounds <roundsToFix>   Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.

  setPGN <broadcastId> <sourcePGNUrl> [--withFilter] [--slice <sliceFilter>] [--rounds <roundsToFix>]
     Sets the source PGN URL for all rounds in the specified broadcast.
     (optional) Use "{}" in the URL as a placeholder for the round number.
     Note: For livechesscloud URLs, please ensure it ends with "/{}".
     Options:
       --withFilter             Apply round number filtering based on round number.
       --slice <sliceFilter>    Apply slice filtering using the provided filter string.
       --rounds <roundsToFix>   Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.

  setPGNMulti <broadcastId> <sourcePGNUrl> <gamesNum> [--withFilter] [--onlyGames <sliceFilter>] [--rounds <roundsToFix>]
     Sets the source PGN URLs for all rounds in the specified broadcast.
     Use {r} in the URL as a placeholder for the round number and {g} for the game number.
     Use the gamesNum parameter to specify how many games per round.
     Note: For broadcasts with multiple rounds, the source PGN URLs must include the "{g}" placeholder for round numbers.
     Options:
       --withFilter                Apply round number filtering based on round number.
       --onlyGames <sliceFilter>   Apply slice filtering using the provided filter string.
       --rounds <roundsToFix>      Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.

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

  period <broadcastId> <periodInSeconds>
     Sets the period between polling for all rounds in the specified broadcast.
     Required: Your Lichess token needs the web:mod scope to use this command. (Broadcast/Study Admin perm required)
     Note: The period is specified in seconds.
     Options:
       --rounds <roundsToFix>   Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.

  score <broadcastId> <whiteWin> <whiteDraw> <blackWin> <blackDraw> [--rounds <roundsToFix>]
     Sets the custom scoring for all rounds in the specified broadcast.
     Note: Scores must be numbers between 0 and 10.
     Options:
       --rounds <roundsToFix>   Specify which rounds to fix using formats like '1-4', '8+', '3,5,7', etc.

  push <roundId> <PGNFromPathOrUrl> [--loop <intervalInSeconds>]
     Upload a PGN file from a local path or URL to the specified broadcast round.
     Note: The PGN file must be accessible from the provided path or URL.
     Options:
       --loop <intervalInSeconds>   Continuously push the PGN file at the specified interval in seconds.

  pushFilterID <roundId> <PGNFromPathOrUrl> <FideIds...> [--loop <intervalInSeconds>]
     Upload a PGN file from a local path or URL to the specified broadcast round, filtering games by FIDE ID.
     Note: The PGN file must be accessible from the provided path or URL.
     Options:
       --loop <intervalInSeconds>   Continuously push the PGN file at the specified interval in seconds.


Examples:
   # Login with your Lichess token (interactive)
     $ login
   # Login with token as argument
     $ login lip_yourtoken https://lichess.org
   # Logout and clear saved credentials
     $ login --logout
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
   # Set polling period to 10 seconds for all rounds in a broadcast
     $ period bcast123 10
   # Set custom scoring for all rounds in a broadcast
     $ score bcast123 1.0 0.5 1.0 0.5
   # Push a PGN file in loop mode every 60 seconds
     $ push round456 /path/to/localfile.pgn --loop 60
   # Push a PGN file from URL filtering by FIDE IDs in loop mode every 120 seconds
     $ pushFilterID round456 https://example.com/games.pgn 12345 67890 --loop 120
```
