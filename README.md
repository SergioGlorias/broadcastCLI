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
```
