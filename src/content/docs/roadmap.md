---
title: Roadmap
description: What is in progress, what is open, and the questions PLAN.md leaves unanswered.
---

robinmail was built in phases, each by its own session, each ending in something shown
working. Phases 0 to 8 are done. This page lists what is not.

## In progress

**The Angular webmail** (`web-ng/`). The screens are there and pass the same browser tests
as the Vue webmail. Left: virtual scrolling of the message list, a linter, a choice of
webmail for the Docker image. See [Webmail](/robinmail-docs/webmail/).

## Before real mail

- Fix the open security findings: memory use of inbound SMTP
  ([#43](https://github.com/mikepage/robinmail/issues/43)) and the lockout of the web login
  ([#41](https://github.com/mikepage/robinmail/issues/41)).
- Test against real providers and clients: which host and domain is still open
  ([#26](https://github.com/mikepage/robinmail/issues/26)).
- Choose a licence ([#28](https://github.com/mikepage/robinmail/issues/28)).
- Releases, a `version` command and a tested upgrade path
  ([#25](https://github.com/mikepage/robinmail/issues/25)).
- Drop privileges after binding ports, and a systemd unit
  ([#24](https://github.com/mikepage/robinmail/issues/24)).

The other gaps against mox are on [Compared with mox](/robinmail-docs/mox/).

## Open questions

From [PLAN.md](https://github.com/mikepage/robinmail/blob/main/PLAN.md#open-questions).
A selection; the file has them all.

### Logins

- Passkeys (WebAuthn) as a second factor that cannot be phished. The work is the
  ceremonies, CBOR and COSE on the standard library. Worth a phase?
- OAUTHBEARER for mail programs, so a provider's users can do without app passwords.
- Tell users about a run of failed logins, or a login from a new device, by mail.
- A limit per address and client address together, with a far higher one per address alone,
  to keep the owner in during an attack.
- Logging out at the OIDC provider, and hearing when the provider ends a session.
- A user's own audit events in the webmail.

### IMAP

- `\Deleted` is the keyword `$deleted`, and the webmail shows such mail like any other.
- A message with several labels is one message per folder. A client that deletes it in one
  folder leaves it in the others.
- `HIGHESTMODSEQ` is the account's modseq, so it moves for a mailbox in which nothing
  changed.
- QRESYNC needs a record of which UID left which mailbox at which modseq.
- Every header `FETCH` reads and decrypts the whole message.
- `SEARCH BODY` and `TEXT` match whole words, not substrings.

### Storage and the cluster

- The master key is a file, read at start. Nothing else holds it.
- The repair pass lists every blob directory every five minutes. With millions of
  messages it wants to work from the change log.
- Every RCPT reads the domain table, and every node writes a heartbeat every 5 seconds.
- Push and IDLE are up to a second late across nodes.
- A backup takes the list of blobs from the live database, not from the copy.
- `user remove` deletes a large account in one large Raft entry.

### Mail

- A line longer than 998 characters goes out as it came in. Refuse it, or re-encode?
- DKIM keys are files on every Rspamd, copied by hand. Rspamd could take the key with the
  request, which would let robinmail keep keys in rqlite.
- `undo_seconds` is a server setting. FUTURERELEASE would let a message choose.
- A bounce the queue makes skips the user's Sieve script.

### Webmail

- The HTML view drops `<style>` blocks. Keeping them needs a CSS sanitiser.
- The assets are served uncompressed: 680 kB of script and 210 kB of CSS.
- Every autosave of a draft is a new Email, with a new id.
- When the answer to a send is lost, sending again may send it twice.
- The rich text editor stands on `document.execCommand`, which browsers mark obsolete.

### Operations

- `/healthz` answers anybody, under any host name. Bind it to the metrics listener?
- The `dev` section is in every binary. A build tag would keep it out.
- A TLS report is claimed before it is sent, so a node that dies in between loses it.
