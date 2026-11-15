---
title: Security model
description: How robinmail protects accounts and mail, what the review of 2026-11-15 found, and what is still open.
---

## Status

An adversarial review of the Go server was done on 2026-11-15 by an AI session that did
not write the code. The webmail clients were left out on purpose. No human has audited
robinmail.

The review came before phases 9 and 10. Calendars and contacts (JMAP, CalDAV, CardDAV,
invitations) and the embedded database have not been reviewed.

| Severity | Found | Fixed | Open |
|---|---|---|---|
| Critical | 0 | 0 | 0 |
| High | 1 | 1 | 0 |
| Medium | 7 | 5 | 2 (one partly fixed) |
| Low | 8 | 1 | 7 |

Every finding of medium severity or higher is a public issue. The tracking issue is
[robinmail/robinmail#44](https://github.com/robinmail/robinmail/issues/44).

**Verdict of the review:** fit to face the internet with throwaway accounts. Not yet with
real mail.

## What the review found no way to do

- Read another account's mail, over JMAP, IMAP, downloads or the HTML view.
- Take over an account, or relay mail as a stranger.
- Run script in the webmail through an HTML message.
- Smuggle a message through SMTP line endings, or inject commands before STARTTLS.

Also found sound: sessions and cookies, the cross-site request checks, account
enumeration, the JWT and OIDC validation, the HTML sanitiser and its content security
policy, the binding of every JMAP method and SQL statement to its account, alias loops and
SRS, blob encryption and key wrapping, the node-to-node API, backup and restore, secrets in
logs. `go vet` is clean and `govulncheck` reports no vulnerabilities.

## What was fixed

| Issue | Severity | What |
|---|---|---|
| [#38](https://github.com/robinmail/robinmail/issues/38) | high | Login rate limits could be outrun by many attempts at once. |
| [#36](https://github.com/robinmail/robinmail/issues/36) | medium | Limits per client address counted every IPv6 address on its own; now per /64. |
| [#39](https://github.com/robinmail/robinmail/issues/39) | medium | JMAP result references could grow a request past the size limit. |
| [#37](https://github.com/robinmail/robinmail/issues/37) | medium | A Sieve script could make one run cost minutes of CPU. |
| [#40](https://github.com/robinmail/robinmail/issues/40) | medium | A submitted message could carry more than one `From` field. |
| [#42](https://github.com/robinmail/robinmail/issues/42) | medium | The outbound queue and HTTPS fetches could be pointed at internal addresses. |
| no issue | low | Turning TOTP on did not end mail sessions opened with the password. |

## What is open

Each issue has the options and a recommendation.

- **[#43](https://github.com/robinmail/robinmail/issues/43), medium.** The process can be
  driven out of memory through the SMTP listener on a small machine. Until it is fixed,
  lower `smtp.max_connections` and `smtp.max_message_bytes` to fit the memory you have.
- **[#41](https://github.com/robinmail/robinmail/issues/41), medium, partly fixed.** Anybody
  can lock an address out of the web login by sending wrong passwords for it. Logins with
  an app password are no longer affected.
- **Low:** no panic recovery in SMTP and IMAP sessions, so a panic in one session ends the
  whole process; OIDC accounts are linked by the e-mail claim; the Docker image runs as
  root; no default quota; no connection limit on the HTTPS listener; unbounded audit
  writes from many client addresses; automatic replies count against the account's
  sending limit.

## The model

### Logins

- **Passwords:** Argon2id, stored as a PHC string.
- **Web sessions:** a cookie that is `Secure`, `HttpOnly`, `SameSite=Strict` and
  `__Host-`. An `Origin` check on every request to `/auth` and JMAP. JSON with its content
  type for everything that changes state.
- **Mail, calendar and contacts programs:** app passwords. 160 random bits made by the
  server, stored as a hash, limited to `imap`, `smtp`, `jmap` or `dav` if wanted, revocable
  one by one.
- **Two steps:** TOTP with recovery codes. The TOTP secret is sealed with the account's key.
- **OIDC:** optional, for the webmail only. Authorization code flow with PKCE.
- **Rate limits:** failures are counted in a 15 minute window for all nodes together: per
  address for the web login, per address for mail programs, per address for TOTP codes, and
  per client address (per /64 for IPv6) for all of them.
- **Audit log:** auth events and what administrators did, read with `robinmail audit`, kept
  for `auth.audit_retention_days`.

### Data at rest

- Message files are encrypted per account under the master key.
- The database is not, nor is its Raft log. It holds addresses, subjects, previews, the
  full-text index (from which a message can be put together again), and calendars and
  contacts as plain text.
- The running server holds the master key. Encryption at rest does not protect against a
  compromised server.

### The database

The database is inside robinmail. It has no port.

- Raft messages, snapshots and the member list travel on the node API, next to the message
  files. That API accepts only the certificates of the Raft members.
- Commands reach the running server over a control listener on `127.0.0.1`, which accepts
  only the node's own certificate.
- Whoever has neither has no way to the database. Whoever has a shell on a node with its
  data directory has every account.

The cluster test checks this: the node API refuses Raft, snapshots, the member list, blobs
and ping to a client without a member's certificate, and the control listener cannot be
reached from another container.

Until phase 10 the database was rqlite, a separate service whose HTTP port had to be locked
down. That section of these docs is gone with it.

### Between nodes

Mutual TLS, with each side accepting exactly the certificates of the Raft members. Who may
join is decided by `robinmail node add` on a member, which names the newcomer's
certificate.

### Outbound

No connection to an address that is not public, unless `outbound.allow_private_addresses`
is set.

### Calendars and contacts

- `/dav` takes Basic auth (an app password with the `dav` scope, or the account password
  while the account has no app password and no TOTP) or the webmail's session cookie. The
  `Origin` check applies when the cookie is there.
- A user reaches only their own calendar and address book homes. What others share with
  them shows up in those homes, with the rights the owner gave: read, or read and write.
- An invitation from outside is added to the calendar by itself when the mail's `From`
  names the organizer and Rspamd did not take it for spam. Nothing more checks that the
  `From` is genuine. This is an open question in PLAN.md.

### Listeners

- IMAP and submission need TLS before any login.
- `web.http_listen` and `metrics.listen` must be on loopback.

## Before it faces the internet

1. Put the data directory on an encrypted disk. It holds the database and the Raft log.
2. Keep the master key file apart from the backups of the data.
3. Let only the other nodes reach the node port (`node.listen`).
4. Set the SMTP limits to fit the machine's memory.
5. Start with throwaway accounts.

## Reporting a problem

Open an issue on [GitHub](https://github.com/robinmail/robinmail/issues). This is an
experiment built in public. There is no private channel.
