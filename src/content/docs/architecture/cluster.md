---
title: A cluster
description: Several robinmail nodes that are the whole cluster, how to form one, and what it survives.
---

![Three robinmail nodes. Each has its own database and blob files. They send each other Raft messages, snapshots and blob files over mutual TLS pinned to the members. No node has a database port.](/docs/diagrams/cluster.svg)

A cluster is several robinmail nodes. They are the whole cluster: there is no database
service next to them. Any node serves any account. There is no owner per account. The Raft
leader orders the writes; a node hands its writes to it.

## Nodes are not stateless

Each node holds a full copy of the database and every message file on its own disk. So a
cluster can run in several availability zones without another storage service.

## What it survives

A cluster needs a majority of its members. Three nodes survive one down; five survive two.
Use an odd number. One node of three alone answers nothing, reads included. See
[How many nodes](/docs/architecture/database/#how-many-nodes).

## The node section

Each node has a `node` section in its config, its own `data_dir`, and the same master key
file as the others. See [Configuration](/docs/reference/configuration/#node).

```json
"node": {
  "id": "n1",
  "listen": ":7443",
  "address": "host1.internal:7443",
  "blob_copies": 2,
  "repair_interval_seconds": 300
}
```

- Each node makes a self-signed certificate. Its Raft id is derived from that certificate.
- Nodes talk over mutual TLS on `listen`. Both sides accept exactly the certificates of the
  Raft members. There is no CA and no shared secret.
- Who may join is decided by `robinmail node add` on a member, which names the newcomer's
  certificate.
- Each node writes a heartbeat to the `node` table every 5 seconds, for `node list` and
  `status`.

## Forming a cluster

1. On the first node: `robinmail serve`. An empty data directory starts a cluster of one,
   which elects itself at once.
2. On the new node: `robinmail node id`. It prints the node's id, address and certificate.
3. On the first node: `robinmail node add <id> <address> <certificate>`. It prints a
   `robinmail node join` line.
4. On the new node: run that `node join` line. Its data directory must have no database
   yet. Then `robinmail serve`.
5. Repeat 2 to 4 for the next node.

Add one node at a time. After adding the second node, both must run before the third is
added: a cluster of two has no majority while one of them is down.

`robinmail node list` shows on any node: the members, their Raft ids, the leader, how far
each is, and the last heartbeat. `robinmail status` has a `cluster` line: members, leader,
term, how far this node has applied, and the snapshot.

`contrib/compose/cluster.sh up` does all of this in Docker.

## Removing a node

Stop it. Then run `robinmail node remove <id>` on another node. It leaves Raft, its
certificate is refused from then on, and its row leaves the node table.

A node that lost its data directory joins again as a new member: remove it, then
`node add` it with its new certificate. There is no "replace in place".

Membership changes go one at a time. There is no joint consensus and no learner step.

## Backup and restore

- `robinmail backup <directory>` copies `data.db` online, after a barrier: it holds all that
  was committed when it began. The message files go into the same directory.
- `robinmail restore <directory>` loads into a cluster of one node. Nodes added afterwards
  get the restored database as a snapshot.

## Copies of a message

- A delivery is acknowledged when the message file is on `blob_copies` nodes, this one
  included. The default is 2. With fewer nodes, all of them.
- The other nodes get the file in the background.
- A repair pass on each node fetches what it lacks, every `repair_interval_seconds`
  (default 300) and at start.
- A sweeper on each node removes that node's files nothing refers to. It only looks at its
  own disk.
- `scrub` replaces a corrupt file with a good copy from another node.

## Push across nodes

Each node has a hub for its own changes. Changes made on other nodes are found by a poll of
the node's own copy of the database, once a second. So JMAP push and IMAP IDLE are up to a
second late across nodes.

## The trade-off

Every write goes through the one Raft leader, also from another zone. That is fine at this
scale. If it ever is not, accounts can be spread over several clusters, because every table
is keyed by account.

## How it was tested

`make cluster-test` runs three robinmail nodes in Docker, with a fourth robinmail that the
cluster exchanges mail with. The tests kill, freeze and restart containers.

- **Leader killed.** The node that leads the database was killed while six senders delivered
  through all three nodes. Another leader took over within about a second. 4571 messages
  got a 250: none lost, none doubled, every IMAP UID and modseq consistent. The old leader
  was back in the cluster 3.7 seconds after its start.
- **No port.** The node API refuses Raft, snapshots, the member list, blobs and ping to a
  client without a member's certificate. The control listener cannot be reached from
  another container.
- **Throughput:** 179 deliveries a second with 3 senders, 298 with 12, 376 with 48, on a
  laptop. On rqlite it was 171, 268 and 224.

See [Testing](/docs/testing/#the-cluster).
