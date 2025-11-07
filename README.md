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
     Options:
       --onlyDelay   Set only the delay without changing the start time.
       --noDelay     Remove the delay from the rounds.
  setLCC <broadcastId> <sourceLCCUrl>
     Sets the source LCC URL for all rounds in the specified broadcast.
  setPGN <broadcastId> <sourcePGNUrl>
     Sets the source PGN URL for all rounds in the specified broadcast.
     (optional) Use '{}' in the URL as a placeholder for the round number.

Examples:
  delay bcast123 300 --onlyDelay # Set a 5-minute delay without changing start time
  setLCC bcast123 https://view.livechesscloud.com/#47c48351-034a-4860-9b94-087490742803
  setPGN bcast123 https://example.com/pgns/round-{}/game.pgn
```
