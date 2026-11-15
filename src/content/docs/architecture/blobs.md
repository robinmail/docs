---
title: Message files
description: How messages are stored on disk, encrypted, and kept healthy.
---

A message is a file on the node's own disk. So is a blob a client uploaded. There is no
object store.

## The path

```
<data_dir>/blobs/<account-id>/<2 hex>/<sha256>
```

The name is the SHA-256 of the plaintext. For a message and for an upload, that is also
its JMAP blobId. A body part has no file of its own; its id is `<blob>-<partId>`.

A file is never changed after it is written.

## Encryption

Each file is encrypted with XChaCha20-Poly1305 (from `golang.org/x/crypto`) under a key of
its account.

- The account key is in the `account` row in rqlite, wrapped by the master key.
- The master key is in the master key file. Every node has the same file.
- Without the master key file, the stored mail cannot be read. Back it up, apart from the
  data and apart from the backups.

The file format:

- a 27-byte header: magic `RMB1`, the chunk size, a random nonce prefix;
- then the plaintext in chunks of 64 KiB, each sealed on its own.

A chunk's position and whether it is the last are part of its nonce. The header, the
account id and the SHA-256 are associated data. So a changed, moved, missing or extra chunk
fails, and so does a file under another name. A reader holds one chunk in memory.

The file does not depend on the node that wrote it. Replication copies it as it is, and a
node can check a copy by decrypting it and comparing the hash with the name.

This protects the files against stolen disks and backups. It does not protect against a
compromised running server, which holds the master key.

## Writing

A file is written to a temporary file, synced and renamed into place before the batch in
rqlite that refers to it. A crash leaves a file nothing refers to, never a row without a
file.

## Master key rotation

```bash
robinmail key add
robinmail key status
robinmail key rotate <fingerprint>
robinmail key prune
```

`key add` puts a new key in the file without using it. Give every node the new file. `key
rotate` makes it the current key and wraps every account's key under it. `key prune` takes
out keys no account uses. A node reads the file only at start.

## Keeping files healthy

| Command | What it does | Automatic |
|---|---|---|
| `sweep` | removes this node's files that nothing refers to and that are older than a day | once a day, with the trim |
| `repair` | fetches the files this node lacks from other nodes | every 300 seconds and at start |
| `scrub` | checks this node's files against their hashes; in a cluster, replaces a corrupt one from another node | every 168 hours |
| `verify <address>` | checks one account's files against their hashes | no |

The intervals are `node.repair_interval_seconds` and `scrub.interval_hours`.
