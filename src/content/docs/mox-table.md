---
title: mox, feature by feature
description: Every feature compared with mox, by area, with the issue for each gap.
---

The full table behind [Compared with mox](/docs/mox/). "On purpose": yes = robinmail
left it out by decision; no = not built, no stated reason; n/a = both have it or neither.
mox as of commit `b32f0de`, robinmail as of 2026-11-15, before phases 9 and 10. Rows those
phases changed are updated and say so: the JMAP row, the database rows, and calendars and
contacts.

## SMTP receiving and policy

| Feature | mox | robinmail | On purpose | Issue |
|---|---|---|---|---|
| SPF, DKIM verify, DMARC | Own packages `spf/`, `dkim/`, `dmarc/` | Rspamd over HTTP (PLAN Decisions) | yes | [#29](https://github.com/robinmail/robinmail/issues/29) |
| DKIM signing | In the queue, keys in config | Rspamd signs at submission; keys are files on each Rspamd | yes | [#29](https://github.com/robinmail/robinmail/issues/29) |
| ARC | Roadmap | No | n/a | - |
| DNSBL for incoming | `DNSBLs` per listener, only when reputation is unclear | Rspamd's | yes | [#30](https://github.com/robinmail/robinmail/issues/30) |
| Reputation and Bayes per account | `junk/`, learned from flags | Rspamd's score; no learning from users (`internal/rspamd` only scans) | yes / no | [#30](https://github.com/robinmail/robinmail/issues/30), [#10](https://github.com/robinmail/robinmail/issues/10) |
| Greylisting | No; 15 s delay for first-time senders | Rspamd's greylist action gives a temporary error (`delivery.verdict`); needs Redis in Rspamd | yes | [#30](https://github.com/robinmail/robinmail/issues/30) |
| Rejects mailbox | `RejectsMailbox`, `KeepRejects` | Rejected mail is gone | no | [#4](https://github.com/robinmail/robinmail/issues/4) |
| Introbox, subjectpass | Yes | No | yes (part of the Rspamd choice) | [#30](https://github.com/robinmail/robinmail/issues/30) |
| Rate limits, incoming | Per IP and IP class (`ratelimit/`) | `max_connections`, `max_connections_per_ip` | n/a | - |
| Subaddressing | Separators configurable per domain | `+` only (`internal/delivery/alias.go`) | no | [#9](https://github.com/robinmail/robinmail/issues/9) |
| Catch-all | Yes | Yes (phase 8) | n/a | - |
| Case-sensitive local parts | Option per domain | Lowercase only | no | [#9](https://github.com/robinmail/robinmail/issues/9) |
| REQUIRETLS | Yes | No (phase 5 not handled) | no | [#1](https://github.com/robinmail/robinmail/issues/1) |
| SMTPUTF8 | Yes, incl. UTF-8 local accounts | Announced and passed on; local parts ASCII only | yes | [#34](https://github.com/robinmail/robinmail/issues/34) |
| IDNA domains | Yes | Outbound via `x/net/idna`; hosted IDN domains not determined | - | [#34](https://github.com/robinmail/robinmail/issues/34) |
| DSN extension (RFC 3461) | No (todo in source) | No | n/a | - |
| CHUNKING, BINARYMIME | No (roadmap) | No | n/a | - |
| PIPELINING, 8BITMIME, SIZE, ENHANCEDSTATUSCODES | Yes | Yes (`internal/smtp/server.go`) | n/a | - |
| LIMITS (RFC 9422) | `LIMITS RCPTMAX` | No | no | [#2](https://github.com/robinmail/robinmail/issues/2) |
| FUTURERELEASE | Yes | No; `undo_seconds` and JMAP `sendAt` | no | [#2](https://github.com/robinmail/robinmail/issues/2) |
| Size limits | `SMTPMaxMessageSize` (100 MB default) | `smtp.max_message_bytes` | n/a | - |
| Alias as list (members only, member list) | `PostPublic`, `ListMembers`, `AllowMsgFrom` | Open aliases; send-as-alias yes | no | [#9](https://github.com/robinmail/robinmail/issues/9) |
| Forwarding to outside addresses | Roadmap | Yes, with SRS | n/a | - |

## Sending

| Feature | mox | robinmail | On purpose | Issue |
|---|---|---|---|---|
| Queue with retries, bounces | Yes | Yes (`internal/queue`) | n/a | - |
| "Delayed" DSN | Yes (`queue/dsn.go`) | No | no | [#3](https://github.com/robinmail/robinmail/issues/3) |
| Hold, hold rules, fail with bounce, retired list | Yes | `queue list/show/retry/delete` | no | [#3](https://github.com/robinmail/robinmail/issues/3) |
| MTA-STS outbound | Yes, cached policies | Yes (`internal/queue/sts.go`) | n/a | - |
| DANE | Yes, AD bit from local resolver | No | yes (phase 8) | [#31](https://github.com/robinmail/robinmail/issues/31) |
| TLS-RPT send and receive | Yes, with DANE results | Yes, without `tlsa` | n/a | [#31](https://github.com/robinmail/robinmail/issues/31) |
| DMARC reports receive | Parsed, stored, shown | Arrive as mail to postmaster, not parsed | no | [#8](https://github.com/robinmail/robinmail/issues/8) |
| DMARC reports send | Yes | No (Rspamd could) | no | [#8](https://github.com/robinmail/robinmail/issues/8) |
| Transports: smarthost with auth, SOCKS, per account/domain, min attempts | Yes | `outbound.routes`: domain or `*` to host:port, no auth | no | [#5](https://github.com/robinmail/robinmail/issues/5) |
| IPv4/IPv6 choice, source address | `DisableIPv4/6`, listener IPs | Resolver and kernel decide | no | [#5](https://github.com/robinmail/robinmail/issues/5) |
| Suppression list | Per account, automatic | No | no | [#6](https://github.com/robinmail/robinmail/issues/6) |
| Per-account daily limits | Messages and first-time recipients per day | One hourly recipient limit for all | no | [#6](https://github.com/robinmail/robinmail/issues/6) |
| Webhooks | Outgoing and incoming, queued | No; JMAP event source only, no PushSubscription | no | [#7](https://github.com/robinmail/robinmail/issues/7) |
| HTTP API for sending | webapi | JMAP `EmailSubmission` | n/a | [#7](https://github.com/robinmail/robinmail/issues/7) |
| FBL / ARF | Roadmap | No | n/a | - |

## IMAP

Both: IMAP4rev1, IMAP4rev2, ENABLE, LITERAL+, IDLE, SASL-IR, BINARY (robinmail: fetch only), UNSELECT, UIDPLUS, ESEARCH, SEARCHRES, MOVE, UTF8=ACCEPT, LIST-EXTENDED, SPECIAL-USE, LIST-STATUS, ID, CONDSTORE, STATUS=SIZE, QUOTA, QUOTA=RES-STORAGE, NAMESPACE.

| Extension | mox | robinmail | On purpose | Issue |
|---|---|---|---|---|
| QRESYNC | Yes | No (open question) | no | [#11](https://github.com/robinmail/robinmail/issues/11) |
| NOTIFY | Yes | No | no | [#12](https://github.com/robinmail/robinmail/issues/12) |
| METADATA, LIST-METADATA | Yes | No | no | [#13](https://github.com/robinmail/robinmail/issues/13) |
| MULTIAPPEND, REPLACE, WITHIN, SAVEDATE, PREVIEW, CREATE-SPECIAL-USE, APPENDLIMIT, UIDONLY, INPROGRESS, MULTISEARCH | Yes | No | no | [#14](https://github.com/robinmail/robinmail/issues/14) |
| AUTH=SCRAM-*, CRAM-MD5, EXTERNAL | Yes | IMAP: `AUTHENTICATE PLAIN` and the `LOGIN` command; submission: PLAIN and LOGIN | no | [#16](https://github.com/robinmail/robinmail/issues/16), [#17](https://github.com/robinmail/robinmail/issues/17) |
| CHILDREN, QUOTA=RES-MESSAGE | No | Yes | n/a | - |
| SORT, THREAD, CATENATE, URLAUTH, ACL | No (roadmap) | No | n/a | - |
| COMPRESS=DEFLATE | Written, switched off | No | n/a | - |
| IMAP on 443 via ALPN | `EnabledOnHTTPS` | No | no | [#23](https://github.com/robinmail/robinmail/issues/23) |

## Webmail

| Feature | mox | robinmail (`web/`) | On purpose | Issue |
|---|---|---|---|---|
| Threads, search, keyboard, remote images on request | Yes | Yes | n/a | - |
| HTML compose | No | Yes (rich text) | n/a | - |
| Address completion | Yes | No (phase 5 not built) | no | [#15](https://github.com/robinmail/robinmail/issues/15) |
| Drag and drop to move | Yes | Not found in `web/src` | no | [#15](https://github.com/robinmail/robinmail/issues/15) |
| Mute thread, collapse | Yes | Not found | no | [#15](https://github.com/robinmail/robinmail/issues/15) |
| Layout choice | Yes | No | no | [#15](https://github.com/robinmail/robinmail/issues/15) |
| Send later | Yes | Undo only | no | [#15](https://github.com/robinmail/robinmail/issues/15), [#2](https://github.com/robinmail/robinmail/issues/2) |
| Recipient TLS info, REQUIRETLS switch | Yes | No | no | [#15](https://github.com/robinmail/robinmail/issues/15), [#1](https://github.com/robinmail/robinmail/issues/1) |
| Rule from a message | Yes (rulesets) | Filters page (Sieve), not from a message | no | [#15](https://github.com/robinmail/robinmail/issues/15) |
| Filters, vacation, quota bar, security page | Rulesets only | Yes | n/a | - |
| Import/export in account page | Yes | No | yes | [#32](https://github.com/robinmail/robinmail/issues/32) |

`web-ng/` (Angular) was being written by another session during this run and was not compared.

## JMAP

mox: none (roadmap: "JMAP, IMAP OBJECTID extension, IMAP JMAPACCESS extension"). robinmail: core, mail, submission, quota, sieve, vacationresponse, event-source push, and since phase 9 calendars, contacts and principals. Not in robinmail: `PushSubscription`, WebSocket, blob management, MDN. No parity issue; `PushSubscription` is mentioned in [#7](https://github.com/robinmail/robinmail/issues/7).

## Accounts and auth

| Feature | mox | robinmail | On purpose | Issue |
|---|---|---|---|---|
| SCRAM-SHA-256(-PLUS), SCRAM-SHA-1(-PLUS) | Yes | No | no | [#16](https://github.com/robinmail/robinmail/issues/16) |
| CRAM-MD5 | Yes | No | not worth adding | [#16](https://github.com/robinmail/robinmail/issues/16) |
| TLS client certificates | Yes (`store/tlspubkey.go`) | No | no | [#17](https://github.com/robinmail/robinmail/issues/17) |
| App passwords | Not found | Yes (phase 7) | n/a | - |
| TOTP | Not found | Yes | n/a | - |
| OIDC / OAuth | Roadmap | OIDC login for the webmail | n/a | - |
| Login rate limits | Per IP | Per address, and per client address for app passwords | n/a | - |
| Disable account or domain login with a message | Yes | No | no | [#18](https://github.com/robinmail/robinmail/issues/18) |
| User sees own login attempts | Yes | CLI `audit` only | no | [#18](https://github.com/robinmail/robinmail/issues/18) |
| Generated-only passwords | `NoCustomPassword` | No | no | [#18](https://github.com/robinmail/robinmail/issues/18) |

## Administration

| Feature | mox | robinmail | On purpose | Issue |
|---|---|---|---|---|
| Web admin interface | Yes, about 90 methods | CLI only; no administrator role | no | [#19](https://github.com/robinmail/robinmail/issues/19) |
| Quickstart | Yes | Manual setup | no | [#20](https://github.com/robinmail/robinmail/issues/20) |
| Print DNS records | Yes, incl. CAA, TLSA | `robinmail dns`: MX, SPF, DKIM, DMARC, MTA-STS, TLS-RPT, SRV | partly | [#21](https://github.com/robinmail/robinmail/issues/21) |
| Check live DNS | `config dnscheck`, admin page | No | no | [#21](https://github.com/robinmail/robinmail/issues/21) |
| Monitor own IPs on DNSBLs | `MonitorDNSBLs` | No | no | [#21](https://github.com/robinmail/robinmail/issues/21) |
| Config reload | Domains file reloaded | Domains, users, aliases live in the database; JSON needs restart | n/a | - |
| Import/export mbox, Maildir | Yes | No ("Not in scope: migration tooling") | yes | [#32](https://github.com/robinmail/robinmail/issues/32) |
| Backup, verify | `backup`, `verifydata` | `backup`, `restore`, `verify`, `scrub`, `health` | n/a | - |
| Metrics | Prometheus, example rules | Prometheus (`internal/metrics`) | n/a | - |
| Logging | Levels per package, runtime change, trace levels, cid | slog; traces under `dev` | no | [#22](https://github.com/robinmail/robinmail/issues/22) |
| Autoconfig | Thunderbird, Autodiscover, Apple profile with QR, SRV | Thunderbird, Outlook POX, Apple profile, SRV printed | partly yes | - |
| ACME | Any directory, EAB, CAA hint, tls-alpn-01 and http-01 | `autocert` defaults | no | [#23](https://github.com/robinmail/robinmail/issues/23) |
| MTA-STS hosting | Yes | Yes | n/a | - |
| Mailing-list friendliness | `ListAllowDomain`, `IsForward` in rulesets | Rspamd; Sieve for filing | yes | [#30](https://github.com/robinmail/robinmail/issues/30) |
| Retention / auto-delete | Rejects mailbox only | Trims of change log, uploads, audit; no mail retention | n/a | - |
| Rulesets in place of Sieve | Rulesets | Sieve | n/a | - |
| Built-in web server | Static, proxy, redirects | No | yes | [#33](https://github.com/robinmail/robinmail/issues/33) |
| sendmail command, localserve | Yes | No; `make dev` | no | - |

## Operations and safety

| Feature | mox | robinmail | On purpose | Issue |
|---|---|---|---|---|
| Privilege drop | `User` in config, re-exec | No | no | [#24](https://github.com/robinmail/robinmail/issues/24) |
| systemd unit | Printed by `config printservice` | No | no | [#24](https://github.com/robinmail/robinmail/issues/24) |
| Sandboxing | Roadmap | No | n/a | - |
| Fuzzing | 12 files with fuzz tests | Fuzz tests in imap, message, sieve-adjacent packages (10 files) | n/a | - |
| Single binary | Yes, nothing else needed | One binary with its database inside (since phase 10), plus Rspamd | yes | [#29](https://github.com/robinmail/robinmail/issues/29) |
| Embedded database | Yes, one node | SQLite in the binary, replicated between nodes with Raft (since phase 10) | n/a | - |
| Calendars and contacts | No | JMAP, CalDAV, CardDAV, invitations by email (since phase 9) | n/a | - |
| Upgrades | `test-upgrade.sh` over all releases | Migrations, untested across versions | no | [#25](https://github.com/robinmail/robinmail/issues/25) |
| Releases, version, reproducible build | Yes | No tags, no `version` | no | [#25](https://github.com/robinmail/robinmail/issues/25) |
| Licence | MIT | AGPL-3.0-or-later | yes | [#28](https://github.com/robinmail/robinmail/issues/28) |
| Real provider and client tests | Claimed in README | Lab only | open question | [#26](https://github.com/robinmail/robinmail/issues/26) |
| Documentation | Generated config and command reference, RFC table | README, PLAN.md, example JSON | no | [#27](https://github.com/robinmail/robinmail/issues/27) |

