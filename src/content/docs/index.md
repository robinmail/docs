---
title: What robinmail is
description: A mail server in Go built around JMAP. A learning project.
---

robinmail is a mail server in Go that is built around JMAP. It receives mail over SMTP,
stores it, sends it, and serves it over JMAP (RFC 8620, RFC 8621) and IMAP. A webmail in
Vue ships inside the binary. The same webmail in Angular can be built in instead.

It is built in public, by AI sessions, as an experiment:
[github.com/robinmail/robinmail](https://github.com/robinmail/robinmail).

:::caution[A learning project]
robinmail has never exchanged mail with a server on the internet. Nobody has run it under
real load, and no human has audited it. Read [What it is not](/docs/introduction/limits/)
and the [Security model](/docs/security/) before it faces the internet.
:::

## In short

- **One binary.** `cmd/robinmail` holds inbound SMTP, submission, the outbound queue, IMAP,
  JMAP, the web login and the webmail. It uses the Go standard library and `golang.org/x`,
  nothing else.
- **Metadata in rqlite.** rqlite is SQLite replicated with Raft. robinmail reaches it over
  HTTP with a small client of its own.
- **Messages as files.** Each message is a file on the node's own disk, encrypted with a key
  per account. There is no object store.
- **Any node serves any account.** A cluster is several robinmail nodes on one rqlite
  cluster. Nodes copy message files to each other over mutual TLS.
- **Spam filtering, SPF, DKIM and DMARC are Rspamd's**, asked over HTTP.

## What works

Built and tested, phase by phase:

- Inbound SMTP with Rspamd, aliases, catch-all addresses and forwarding with SRS.
- Sieve filters at delivery (RFC 5228), managed over JMAP (RFC 9661). Vacation replies.
- Submission on ports 465 and 587, an outbound queue with MTA-STS, retries and bounces.
- JMAP core, mail, submission, quota, Sieve and vacation response, with push over
  EventSource.
- IMAP4rev1 and IMAP4rev2 with IDLE and CONDSTORE.
- Logins with Argon2id passwords, TOTP, app passwords and optional OIDC for the webmail.
- Full-text search, quotas, MTA-STS policy serving, TLS reports, client autoconfig.
- Backup, restore, master key rotation, scrub and repair of message files.
- A three-node cluster, tested by killing and restarting nodes.

The full record, with what was left out and why, is
[PLAN.md](https://github.com/robinmail/robinmail/blob/main/PLAN.md) in the repository.

## Where to start

- To run it on your machine: [A development instance](/docs/getting-started/dev-instance/).
- To understand how it works: [Architecture](/docs/architecture/overview/).
- To set it up: [Configuration](/docs/reference/configuration/) and
  [Commands](/docs/reference/commands/).
