---
title: Overview
description: The parts of robinmail and where the data lives.
---

![Mail servers, mail programs and browsers connect to one robinmail binary. It keeps metadata in rqlite, message files on its own disk, and asks Rspamd about spam.](/robinmail-docs/diagrams/overview.svg)

## One binary

`cmd/robinmail` holds every listener and every worker. The command `serve` runs them all;
the other commands manage domains, accounts and the store. See
[Commands](/robinmail-docs/reference/commands/).

The only dependencies are the Go standard library and `golang.org/x` (`crypto`, `net`,
`term`, `text`). rqlite is reached over HTTP with a client of robinmail's own. JWT, JWK,
PKCE, OIDC, TOTP and the QR code for TOTP are robinmail's own too.

## Packages

Each concern has its own package under `internal/`. Protocol packages know nothing about
storage. They call interfaces that `cmd/robinmail` wires up.

| Package | What it does |
|---|---|
| `smtp` | ESMTP server and client, AUTH |
| `delivery` | from recipient to mailbox, aliases, submission |
| `queue` | outbound delivery: MX, MTA-STS, retries, bounces |
| `rspamd` | the Rspamd client |
| `sieve` | Sieve parser and interpreter |
| `srs` | sender rewriting for forwarded mail |
| `imap` | the IMAP server |
| `jmap` | JMAP core and mail, protocol only |
| `web` | HTTPS, login, sessions, settings, OIDC login, the webmail files |
| `jose`, `oidc`, `totp`, `qr` | the login pieces, on the standard library |
| `users` | Argon2id hashes, app passwords, recovery codes |
| `store` | the schema and every mail operation |
| `rqlite` | the rqlite client |
| `blob` | encrypted message files on disk |
| `cluster` | the node table, mutual TLS, blob transfer between nodes |
| `notify` | who hears of a change: a hub per node, a poll for other nodes |
| `search` | words of a text, search terms, snippets |
| `message` | MIME to JMAP body structure, the HTML view |
| `tlsrpt` | TLS reports (RFC 8460) |
| `metrics` | counters and gauges in Prometheus' text format |
| `config`, `tlsconf`, `address` | the config file, certificates, address parsing |

## Where data lives

```
rqlite                                            every table
<data_dir>/blobs/<account-id>/<2 hex>/<sha256>    a message or an upload, encrypted, never changed
<data_dir>/acme                                   ACME account and certificates, when ACME is on
master key file                                   wraps the account keys; the same on every node
```

A node keeps its config, the master key file, its blob files and the ACME cache on disk.
Everything else is in rqlite.

## What is encrypted at rest

| Data | Encrypted by robinmail |
|---|---|
| Message files | yes, with a key per account |
| TOTP secrets | yes, with the account's key |
| Addresses, subjects, previews (rqlite) | no |
| The full-text index (rqlite) | no |

The full-text index keeps every word of every message and its position. A message can be
put together again from it. So rqlite's data directory, its Raft log and its backups are as
sensitive as the mail. They belong on an encrypted disk.

## Read on

- [Metadata in rqlite](/robinmail-docs/architecture/rqlite/)
- [Message files](/robinmail-docs/architecture/blobs/)
- [A cluster](/robinmail-docs/architecture/cluster/)
- [Protocols](/robinmail-docs/architecture/protocols/)
