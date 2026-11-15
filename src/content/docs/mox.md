---
title: Compared with mox
description: What mox has that robinmail has not, and where that is on purpose.
---

[mox](https://github.com/mjl-/mox) is a complete mail server in Go. It is the closest
project to robinmail and a useful yardstick. The comparison was made on 2026-11-15
against mox commit `b32f0de` (v0.0.17 is its latest tag), from its docs and source. mox
was not built or run.

Each gap has an issue; the tracking issue is
[robinmail/robinmail#35](https://github.com/robinmail/robinmail/issues/35). Issues labelled
`decision` are left out on purpose.

## Where robinmail differs on purpose

| Topic | mox | robinmail | Issue |
|---|---|---|---|
| SPF, DKIM, DMARC | own packages | Rspamd | [#29](https://github.com/robinmail/robinmail/issues/29) |
| Junk filtering | per-account learning | Rspamd's score | [#30](https://github.com/robinmail/robinmail/issues/30) |
| DANE | yes | no; needs a DNSSEC-validating resolver | [#31](https://github.com/robinmail/robinmail/issues/31) |
| mbox and Maildir import, export | yes | no | [#32](https://github.com/robinmail/robinmail/issues/32) |
| Web server for static files, proxy | yes | no | [#33](https://github.com/robinmail/robinmail/issues/33) |
| Internationalised local parts | yes | ASCII only | [#34](https://github.com/robinmail/robinmail/issues/34) |
| Dependencies at run time | none | rqlite and Rspamd | [#29](https://github.com/robinmail/robinmail/issues/29) |

## What robinmail has that mox does not

- JMAP. mox has it on its roadmap.
- Sieve filters and vacation replies.
- A cluster on rqlite with replicated message files.
- Message files encrypted per account, with key rotation.
- Labels: one message in several mailboxes.
- TOTP, app passwords, OIDC login for the webmail.
- Forwarding to outside addresses with SRS.
- Quota on message count.
- An automated lab with Exim, OpenSMTPD and a driven Thunderbird.
- `scrub` and an audit log.

## Gaps by area

### SMTP and sending

- REQUIRETLS ([#1](https://github.com/robinmail/robinmail/issues/1)).
- FUTURERELEASE and LIMITS ([#2](https://github.com/robinmail/robinmail/issues/2)).
- A "delayed" notice, hold and hold rules in the queue ([#3](https://github.com/robinmail/robinmail/issues/3)).
- A mailbox for rejected mail ([#4](https://github.com/robinmail/robinmail/issues/4)).
- Smarthost with login, SOCKS, per-sender rules, IPv4/IPv6 choice ([#5](https://github.com/robinmail/robinmail/issues/5)).
- A suppression list and daily limits ([#6](https://github.com/robinmail/robinmail/issues/6)).
- Webhooks ([#7](https://github.com/robinmail/robinmail/issues/7)).
- DMARC aggregate reports, in and out ([#8](https://github.com/robinmail/robinmail/issues/8)).
- List-style aliases, other subaddress separators ([#9](https://github.com/robinmail/robinmail/issues/9)).
- Training Rspamd from moves into and out of Junk ([#10](https://github.com/robinmail/robinmail/issues/10)).

### IMAP

Both have IMAP4rev1, IMAP4rev2, IDLE, CONDSTORE, MOVE, QUOTA, SPECIAL-USE and most common
extensions. robinmail lacks QRESYNC ([#11](https://github.com/robinmail/robinmail/issues/11)),
NOTIFY ([#12](https://github.com/robinmail/robinmail/issues/12)), METADATA
([#13](https://github.com/robinmail/robinmail/issues/13)) and smaller ones such as MULTIAPPEND,
REPLACE and PREVIEW ([#14](https://github.com/robinmail/robinmail/issues/14)).

### Webmail

Address completion, drag and drop, muting threads, a layout choice, send later, rules from a
message ([#15](https://github.com/robinmail/robinmail/issues/15)). robinmail's webmail has HTML
compose, which mox's has not.

### Accounts and login

- SCRAM-SHA-256 ([#16](https://github.com/robinmail/robinmail/issues/16)).
- TLS client certificates ([#17](https://github.com/robinmail/robinmail/issues/17)).
- Disabling a login with a message, showing users their own logins ([#18](https://github.com/robinmail/robinmail/issues/18)).

### Administration and operations

- A web interface for administrators ([#19](https://github.com/robinmail/robinmail/issues/19)).
- A quickstart command ([#20](https://github.com/robinmail/robinmail/issues/20)).
- A live DNS check, CAA and TLSA records, blocklist monitoring ([#21](https://github.com/robinmail/robinmail/issues/21)).
- Log levels per subsystem ([#22](https://github.com/robinmail/robinmail/issues/22)).
- ACME options, IMAP on 443 through ALPN ([#23](https://github.com/robinmail/robinmail/issues/23)).
- Dropping privileges, a systemd unit ([#24](https://github.com/robinmail/robinmail/issues/24)).
- Releases and a tested upgrade path ([#25](https://github.com/robinmail/robinmail/issues/25)).
- Tests against real providers and clients ([#26](https://github.com/robinmail/robinmail/issues/26)).
- Documentation ([#27](https://github.com/robinmail/robinmail/issues/27)) and a licence
  ([#28](https://github.com/robinmail/robinmail/issues/28)).

The full table, feature by feature, is
[docs/mox-parity.md](https://github.com/robinmail/robinmail/blob/main/docs/mox-parity.md) in
the repository.
