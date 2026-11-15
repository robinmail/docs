---
title: "Metadata: embedded Raft and SQLite"
description: How robinmail keeps everything but the message files in SQLite, replicated with Raft inside the binary.
---

robinmail keeps all metadata for all accounts in one SQLite database. Every node has a full
copy. The copies are kept equal with Raft, inside the robinmail process. There is no
database service next to robinmail, and no SQL on any network port.

- Raft is etcd's library, `go.etcd.io/raft/v3`.
- SQLite is `modernc.org/sqlite`, in pure Go, without cgo. FTS5, which the search index
  needs, is compiled in.
- The code is `internal/db` (what the store needs) and `internal/raftdb` (the
  implementation).

Until phase 10 the database was rqlite, a separate service. A config that still has an
`rqlite` block is refused, with a sentence that says why. There is no migration from
rqlite. A backup made by an older binary still restores: the file is SQLite either way.

## Files

```
<data_dir>/db/data.db     every table; WAL, synchronous NORMAL
<data_dir>/db/raft.db     this node's Raft log, state and snapshot metadata; synchronous FULL
<data_dir>/db/lock        one process per node
<data_dir>/db/control     the address of the control listener, while the server runs
```

`raft.db` is written before anything is sent. What a crash loses of `data.db`, the log
applies again.

Neither file is encrypted. See [What is encrypted at rest](/docs/architecture/overview/#what-is-encrypted-at-rest).

## Writes are one batch

A write is a batch of statements. It becomes one Raft log entry. Every node applies the
entry itself, in log order, in one SQLite transaction. There are no interactive
transactions: no "read, decide in Go, then write". So every store operation is one batch
whose statements compute what they need in SQL: take a counter, look up the thread, take
the next IMAP UID.

A precondition, such as "this mailbox exists" or JMAP's `ifInState`, is a guard statement:

```sql
INSERT INTO guard SELECT 1 WHERE NOT (condition)
```

The `guard` table only accepts `0`. An unmet condition breaks its `CHECK` and rolls the
batch back. The database says which statement failed, and the store maps that to an error
such as "no such mailbox".

More about writes:

- **One id per batch.** Every batch carries a random id. A node applies an id once and keeps
  its outcome for 200 000 entries. A batch whose answer was lost is proposed again, with the
  same id, every 3 seconds, until 15 seconds have passed. Only then is the outcome
  "unknown".
- **Through the leader.** A follower hands its batch to the leader over Raft and waits until
  it has applied the entry itself. So a write is visible on the node that made it as soon
  as the call returns.
- **Deterministic.** Every node runs every statement. So no statement may read the clock or
  chance (`now`, `random()`). The store passes times and random ids in as values. A test,
  `TestSQLIsDeterministic`, reads the store's SQL for them.
- **Errors.** A refused statement rolls its batch back and is the batch's outcome. An I/O
  error, a full disk or a damaged file is not an outcome: the node stops and says why. A
  restart applies again from where it stopped.

## Reads

| Level | How | Used for |
|---|---|---|
| `weak`, `strong` | Raft's ReadIndex: one round from the node to the leader and from the leader to a majority, shared by every read waiting at that moment | nearly everything |
| `none` | the node's own copy, refused after 5 seconds without a leader | login failure counters, the poll for changes made on other nodes |

A read at `weak` or `strong` on any node sees every write acknowledged before it, on any
node. A node cut off from the majority does not answer it.

Raft runs with CheckQuorum and PreVote. A leader cut off from the majority steps down within
an election timeout, 1 to 2 seconds.

## Snapshots

`data.db` is durable on its own, so a snapshot is a checkpoint plus metadata.

- Every 10 000 applied entries the node checkpoints `data.db` and drops the log to 5 000
  entries behind.
- A member that is further behind than the log reaches gets a snapshot. It fetches the
  sender's `data.db` over the node-to-node mutual TLS, as an online backup, and installs it.
- A restart replays the log from the snapshot.

A snapshot is the whole `data.db`, sent at once. A large database takes as long as copying
the file. There is no rate limit and no resume.

## How many nodes

A cluster needs a majority of its members to work. It answers nothing without one, reads
included.

| Members | Majority | May be down |
|---|---|---|
| 1 | 1 | none |
| 2 | 2 | none |
| 3 | 2 | one |
| 4 | 3 | one |
| 5 | 3 | two |

- Use an odd number. A fourth node adds a machine and no tolerance.
- Three is the smallest cluster that survives a node down. Five survives two.
- The cluster test runs three nodes. Five work as far as Raft is concerned and have not been
  tested.
- A single node of three answers nothing on its own. Before phase 10 a robinmail node next
  to a healthy rqlite could.

Forming a cluster is on [A cluster](/docs/architecture/cluster/#forming-a-cluster).

## Rules the store follows

- **Ids.** Email, Mailbox and Thread ids are counters per account. An Email id does not
  depend on its mailbox or its file, so moves and label changes keep it.
- **modseq.** Every write increments the account's `modseq` once and appends to the
  `changes` table. The JMAP state string is the `modseq`. `/changes`, IMAP CONDSTORE and DAV
  sync tokens read from it. The change log is trimmed after 30 days; an older state gets
  `cannotCalculateChanges`.
- **Labels.** An Email can be in several mailboxes. Each placement has its own IMAP UID.
  In IMAP, an Email with three labels shows up in three folders.
- **Threads.** Assigned at delivery from `Message-ID`, `In-Reply-To` and `References`.
  Never changed afterwards.
- **Idempotent delivery.** The delivery key is the SHA-256 of the envelope sender and the
  message as received. A retry of the same delivery changes nothing. A byte-identical
  message from the same sender within a week is dropped as a retry.
- **Calendars and contacts.** Stored once, as iCalendar or vCard text, in the same
  database. See [Calendars and contacts](/docs/calendars-contacts/).

## Schema versions

The table `schema_version` is checked at start. An older database is migrated in one
guarded batch per version. There is no promise across versions: see
[What it is not](/docs/introduction/limits/).

## Commands and the database

The running server holds the database. A command on the same node reaches it through a
control listener:

- on `127.0.0.1`, on a port the server picks;
- with TLS that accepts only this node's own certificate;
- its address is in `<data_dir>/db/control`.

Without a running server, a command opens the database itself. On a node of a cluster of
several, a command needs the server running.

`robinmail db query <sql>` and `robinmail db exec <sql>` are a console for the operator.
`db exec` writes through the log, on every node. See [Commands](/docs/reference/commands/#the-database).

## Who can reach it

- Raft messages, snapshots and the member list are on the node API, next to the blob
  transfers. That API takes only the certificates of members.
- The control listener is on loopback and takes only the node's own certificate.
- Whoever has neither has no way to the database. Whoever has a shell on a node with its
  data directory has all of it.

See the [Security model](/docs/security/).
