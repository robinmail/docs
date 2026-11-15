---
title: A development instance
description: Run robinmail on your own machine, with mail that never leaves it.
---

A development instance runs on loopback. It sends mail for other domains to Mailpit, a
mail catcher, so it never sends real mail.

You need Go, Node and Docker, and a checkout of
[robinmail](https://github.com/robinmail/robinmail).

## 1. Start the services

```bash
docker compose -f contrib/compose/compose.yaml up -d
```

This starts:

| Service | Port on 127.0.0.1 | For |
|---|---|---|
| rqlite | `4001` | the Go tests |
| rqlite | `4003` | the second server in the Go tests |
| rqlite-dev | `4005` | the development instance only |
| Mailpit | `1025` (SMTP), `8025` (web) | mail for other domains |
| Rspamd | `11333` | the tests that scan mail |

These rqlite nodes have no login. That is fine on loopback on your own machine, and
nowhere else. See [Metadata in rqlite](/docs/architecture/rqlite/).

## 2. Seed the instance

```bash
contrib/dev/seed.sh
```

The script makes the instance in `./dev`, which git ignores:

- a config, `dev/robinmail.json`, from `contrib/dev/robinmail.dev.json`;
- a master key;
- a self-signed certificate for `localhost`, `127.0.0.1` and `mail.robinmail.test`;
- the domain `robinmail.test`;
- two users, `dev@robinmail.test` with some sample mail and `other@robinmail.test`
  without;
- `dev/robinmail`, a binary without the webmail.

The password of both users is in `contrib/dev/seed.sh`. Set `ROBINMAIL_DEV_PASSWORD` to use
another. Run the script again any time. It rebuilds the binary and leaves existing users,
mail and config alone.

## 3. Build with the webmail and run

```bash
make
```

```bash
./robinmail -config dev/robinmail.json serve
```

`make` builds the Vue webmail and then `./robinmail` with the webmail inside.

| What | Where |
|---|---|
| Webmail and JMAP | http://127.0.0.1:8080 |
| IMAP | `127.0.0.1:1993` (TLS), `127.0.0.1:1143` (STARTTLS) |
| Submission | `127.0.0.1:1465` (TLS), `127.0.0.1:1587` (STARTTLS) |
| Inbound SMTP | `127.0.0.1:2525` |
| Mail for other domains | Mailpit, http://127.0.0.1:8025 |

Log in as `dev@robinmail.test`.

## What the instance does with mail

- Mail to `robinmail.test` is delivered in the instance itself.
- Mail to any other domain goes to Mailpit. The config routes every other domain there:
  `"outbound": {"routes": {"*": "127.0.0.1:1025"}}`. Mailpit shows it and passes nothing
  on.
- Without Mailpit running, such mail stays in the queue and bounces after five days.
- The development config names no Rspamd, so incoming mail is not scanned.

## Next

- [A mail program](/docs/getting-started/mail-program/) such as Thunderbird.
- [Live reload](/docs/getting-started/live-reload/) for work on the webmail.
