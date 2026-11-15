---
title: Metadata in rqlite
description: How robinmail stores everything but the message files, and how to lock rqlite down.
---

rqlite is SQLite replicated with Raft, reached over HTTP. robinmail keeps all metadata for
all accounts in one rqlite database. Every mail table starts with `account_id`.

## Writes are one batch

rqlite runs a batch of statements atomically. It has no interactive transactions: no
"read, decide in Go, then write". So every store operation is one batch whose statements
compute what they need in SQL: take a counter, look up the thread, take the next IMAP UID.

A precondition, such as "this mailbox exists" or JMAP's `ifInState`, is a guard statement:

```sql
INSERT INTO guard SELECT 1 WHERE NOT (condition)
```

The `guard` table only accepts `0`. An unmet condition breaks its `CHECK` and rolls the
batch back. rqlite says which statement failed, and the store maps that to an error such
as "no such mailbox".

## Rules the store follows

- **Ids.** Email, Mailbox and Thread ids are counters per account. An Email id does not
  depend on its mailbox or its file, so moves and label changes keep it.
- **modseq.** Every write increments the account's `modseq` once and appends to the
  `changes` table. The JMAP state string is the `modseq`. `/changes` and IMAP CONDSTORE
  read from it. The change log is trimmed after 30 days; an older state gets
  `cannotCalculateChanges`.
- **Labels.** An Email can be in several mailboxes. Each placement has its own IMAP UID.
  In IMAP, an Email with three labels shows up in three folders.
- **Threads.** Assigned at delivery from `Message-ID`, `In-Reply-To` and `References`.
  Never changed afterwards.
- **Idempotent delivery.** The delivery key is the SHA-256 of the envelope sender and the
  message as received. A retry of the same delivery changes nothing. A byte-identical
  message from the same sender within a week is dropped as a retry.
- **Reads** use rqlite's `weak` consistency. Deciding whether a blob is still referenced
  uses `strong`.
- **Retries.** When a leader dies mid-write, rqlite cannot say whether the batch was
  applied. A batch is sent again only if a second run is harmless. Others fail with
  "outcome unknown".

## Schema versions

The table `schema_version` is checked at start. An older database is migrated in one
guarded batch per version. There is no promise across versions: see
[What it is not](/robinmail-docs/introduction/limits/).

## rqlite, locked down

:::danger
Whoever reaches rqlite's HTTP API without a login owns every account: the password
hashes, the wrapped keys, the index of every message's words, the sessions. Through the
`node` table they can also admit a node that the others then send message files to.
:::

The deployment model:

1. **One rqlite next to each robinmail node.** robinmail talks to its own (`rqlite.url`).
   rqlite's HTTP API listens on loopback (`-http-addr 127.0.0.1:4001`).
2. **A login on the API** (`-auth <file>`). robinmail's user gets the permissions
   `execute`, `query`, `backup` and `load` and nothing else. It cannot ask about or change
   the members of the cluster. A second user with `join` is what an rqlite node joins as.
3. **robinmail's login from a file:** `rqlite.auth_file`, one line `user:password`,
   readable by its owner only. A URL with a password works and is discouraged.
4. **Mutual TLS between rqlite nodes** (`-node-cert`, `-node-key`, `-node-ca-cert`,
   `-node-verify-client`), with a CA of the cluster's own. That is the only rqlite port on
   the network.
5. **HTTPS on the API** (`-http-cert`, `-http-key`, and `rqlite.ca_file` on robinmail's side)
   where loopback is not possible.

`robinmail health` and `robinmail status` have a line `rqlite link`. It says whether rqlite
refuses a request without a login, whether the connection is HTTPS, and whether it stays on
the machine. `serve` logs the same at start, as a warning when rqlite answers without a
login or when a plain connection leaves the machine.

The cost: a robinmail node whose rqlite is down cannot work until it is back. The other
nodes carry on.

Not handled: a client certificate from robinmail to rqlite, and rotation of the login or the
certificates without a restart.

## The development services

The rqlite nodes in `contrib/compose/compose.yaml` have no login. They are for loopback on a
developer's machine. `contrib/compose/cluster.yaml` runs the locked-down model in Docker:
each rqlite and its robinmail share a network of their own, the API is HTTPS with a login,
and Raft runs over mutual TLS.
