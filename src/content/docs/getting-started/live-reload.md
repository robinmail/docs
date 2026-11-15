---
title: Live reload
description: Work on a webmail with the Go server behind it.
---

For work on a webmail, run it from its sources with live reload. The Go server runs next to
it and answers the API.

## The Angular webmail

The main webmail since phase 9.

```bash
make dev
```

This:

1. runs `contrib/dev/seed.sh`, which builds `dev/robinmail` and sets up `./dev`;
2. starts `dev/robinmail -config dev/robinmail.json serve` on http://127.0.0.1:8080;
3. starts `ng serve` in `web-ng/` on http://localhost:4200.

Open http://localhost:4200. Its proxy (`web-ng/proxy.conf.mjs`) passes the API on to the Go
server and keeps the browser's `Host` and `Origin`, so the server takes the request as its
own page's. Port 4200 needs no entry in `web.dev_origins`.

Ctrl-C stops both.

## What you need first

- Node. The first run installs the packages with `npm ci`.
- Mailpit, for mail to other domains: `docker compose -f contrib/compose/compose.yaml up -d`.

## Changes to the Go code

The Go server does not reload. Stop `make dev` and start it again. `seed.sh` rebuilds
`dev/robinmail` each time.
