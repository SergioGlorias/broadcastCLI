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
       --noDelay     Remove the delay from the rounds.

  setPGN <broadcastId> <sourcePGNUrl> [--withFilter] [--slice <sliceFilter>]
     Sets the source PGN URL for all rounds in the specified broadcast.
     (optional) Use "{}" in the URL as a placeholder for the round number.
     Note: For livechesscloud URLs, please ensure it ends with "/{}".
     Options:
       --withFilter            Apply round number filtering based on round number.
       --slice <sliceFilter>   Apply slice filtering using the provided filter string.

  setLichessGames <broadcastRoundId> <gameIds...>
     Sets the games for the specified broadcast round using Lichess game IDs.
     Note: Maximum of 64 game IDs can be provided.


Examples:
   # Set a 5-minute delay without changing start time
     $ delay bcast123 300 --onlyDelay
   # Set source PGN URL with round and slice filters
     $ setPGN bcast123 https://example.com/pgns/round-{}/game.pgn --withFilter --slice "1-5,7,9-12"
   # Set Lichess games for a broadcast round
     $ setLichessGames round456 gameId1 gameId2 gameId3   
```
