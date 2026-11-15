---
title: Overview
description: The parts of robinmail and where the data lives.
---

![Mail servers, mail programs, browsers and calendar programs connect to one robinmail binary. It keeps metadata in its own SQLite database replicated with Raft, message files on its own disk, and asks Rspamd about spam.](/docs/diagrams/overview.svg)

## One binary

`cmd/robinmail` holds every listener and every worker. The command `serve` runs them all;
the other commands manage domains, accounts and the store. See
[Commands](/docs/reference/commands/).

The rule for dependencies: the Go standard library and `golang.org/x` (`crypto`, `net`,
`term`, `text`). Since phase 10 it has two approved exceptions, which replace a separate
database service:

- `go.etcd.io/raft/v3`, etcd's Raft library. It brings `google.golang.org/protobuf`.
- `modernc.org/sqlite`, SQLite in pure Go. It brings `modernc.org/libc` and a few small
  helpers.

JWT, JWK, PKCE, OIDC, TOTP, the QR code for TOTP, iCalendar, vCard and recurrence are
robinmail's own.

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
| `ical` | iCalendar and vCard text, dates, time zones, recurrence |
| `jscal`, `jscontact` | iCalendar to JSCalendar and back, vCard to JSContact and back |
| `pim` | calendars and contacts: rights, checks, invitations (iTIP, iMIP), free/busy |
| `dav` | WebDAV, CalDAV, CardDAV |
| `jose`, `oidc`, `totp`, `qr` | the login pieces, on the standard library |
| `users` | Argon2id hashes, app passwords, recovery codes |
| `store` | the schema and every mail operation |
| `db`, `raftdb` | the database interface, and SQLite replicated with Raft |
| `blob` | encrypted message files on disk |
| `cluster` | mutual TLS between nodes, pinned to the members; blob transfer |
| `notify` | who hears of a change: a hub per node, a poll for other nodes |
| `search` | words of a text, search terms, snippets |
| `message` | MIME to JMAP body structure, the HTML view |
| `tlsrpt` | TLS reports (RFC 8460) |
| `metrics` | counters and gauges in Prometheus' text format |
| `config`, `tlsconf`, `address` | the config file, certificates, address parsing |

## Where data lives

```
<data_dir>/db/data.db                             every table
<data_dir>/db/raft.db                             this node's Raft log
<data_dir>/blobs/<account-id>/<2 hex>/<sha256>    a message or an upload, encrypted, never changed
<data_dir>/acme                                   ACME account and certificates, when ACME is on
master key file                                   wraps the account keys; the same on every node
```

Everything a node has is on its own disk: its config, the master key file, the database,
the blob files and the ACME cache.

## What is encrypted at rest

| Data | Encrypted by robinmail |
|---|---|
| Message files | yes, with a key per account |
| TOTP secrets | yes, with the account's key |
| Addresses, subjects, previews (database) | no |
| The full-text index (database) | no |
| Calendar events and contact cards (database) | no |
| The Raft log | no |

The full-text index keeps every word of every message and its position. A message can be
put together again from it. Calendars and contacts are plain text. So `<data_dir>/db` and the
backups are as sensitive as the mail. They belong on an encrypted disk.

## Read on

- [Metadata: embedded Raft and SQLite](/docs/architecture/database/)
- [Message files](/docs/architecture/blobs/)
- [A cluster](/docs/architecture/cluster/)
- [Protocols](/docs/architecture/protocols/)
