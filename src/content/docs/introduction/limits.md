---
title: What it is not
description: What robinmail does not promise, and what has never been tested.
---

robinmail is a learning project. There is no production target yet.

## Not production-hardened

Nobody has run it under real load. No human has audited the code. An AI session that did
not write the code reviewed the Go server on 2026-11-15. Its verdict: fit to face the
internet with throwaway accounts, not yet with real mail. See the
[Security model](/robinmail-docs/security/).

## Never tested against real providers

robinmail has exchanged mail with Postfix, Exim and OpenSMTPD. It has been read by
Thunderbird, mbsync, OfflineIMAP and Dovecot's ImapTest. All of that happened in a closed
lab on one machine, with its own DNS and its own certificate authority.

It has never delivered a message to Gmail, Outlook or any other server on the internet.
How they treat it is unknown. Only real providers can show:

- whether they accept the mail (PTR, SPF, DKIM alignment, their rate limits);
- how their greylisting and temporary errors meet robinmail's retries;
- what their MTA-STS policies and certificates do under `enforce`;
- whether their bounces parse.

Also untested: ACME against a real certificate authority, and iOS Mail, Apple Mail and
Outlook as clients.

## No stable formats

The config, the database schema and the commands change without notice. There are
migrations between schema versions, and no promise. There are no releases, no version
tags and no `version` command.

## No licence

The repository has no LICENSE file. The default applies: you may read the code. Nothing
grants you the right to use, change or distribute it.

## Not in scope

- POP3.
- CalDAV and CardDAV.
- Migration tooling: no import or export of mbox or Maildir.
- A general web server: no static files or reverse proxy in the binary.

## What it needs next to it

robinmail is one binary, but it does not run alone:

- **rqlite** holds all metadata. It runs as a separate service.
- **Rspamd** scans incoming mail and signs outgoing mail with DKIM. Without it, scanning is
  off.
- A certificate, from files or from ACME.
