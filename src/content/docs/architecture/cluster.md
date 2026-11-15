---
title: A cluster
description: Several robinmail nodes on one rqlite cluster.
---

![Three nodes. Each runs robinmail next to its own rqlite on loopback. rqlite nodes form one Raft cluster over mutual TLS. robinmail nodes copy blob files over mutual TLS.](/robinmail-docs/diagrams/cluster.svg)

A cluster is several robinmail nodes on one rqlite cluster. Any node serves any account.
There is no owner per account and no forwarding between nodes. rqlite's leader orders the
writes.

## Nodes are not stateless

Metadata is in rqlite. Message files are on each node's own disk. Every node holds every
file, so a cluster can run in several availability zones without another storage service.

## Joining

A node joins by having a `node` section in its config. See
[Configuration](/robinmail-docs/reference/configuration/#node).

```json
"node": {
  "id": "a",
  "listen": ":7443",
  "address": "node-a.internal:7443",
  "blob_copies": 2,
  "repair_interval_seconds": 300
}
```

Every node needs the same master key file and the same rqlite cluster.

- Each node makes a self-signed certificate and writes its id, address and the SHA-256 of
  that certificate into the `node` table.
- Nodes talk over mutual TLS. Both sides accept exactly the certificates whose fingerprint
  is in that table. There is no CA and no shared secret.
- Who may join is decided by who can write to rqlite, which holds everything anyway.
- Each node writes a heartbeat every 5 seconds.

`robinmail node list` lists the nodes. `robinmail node remove <id>` takes a stopped node
out.

## Copies of a message

- A delivery is acknowledged when the message file is on `blob_copies` nodes, this one
  included. The default is 2. With fewer nodes registered, all of them.
- The other nodes get the file in the background.
- A repair pass on each node fetches what it lacks, every `repair_interval_seconds`
  (default 300) and at start.
- A sweeper on each node removes that node's files nothing refers to. It only looks at its
  own disk.
- `scrub` replaces a corrupt file with a good copy from another node.

## Push across nodes

Each node has a hub for its own changes. Changes made on other nodes are found by a poll of
rqlite, once a second. So JMAP push and IMAP IDLE are up to a second late across nodes.

## The trade-off

Every write goes through the one rqlite leader, also from another zone. That is fine at
this scale. If it ever is not, accounts can be spread over several rqlite clusters, because
every table is keyed by account.

## How it was tested

`make cluster-test` runs three rqlite and three robinmail nodes in Docker, with a fourth
robinmail that the cluster exchanges mail with. The tests kill, freeze and restart
containers. In the test that kills the rqlite leader, the node next to it took 870 of 6094
deliveries and the other two the rest. Nothing was lost or doubled. See
[Testing](/robinmail-docs/testing/).
