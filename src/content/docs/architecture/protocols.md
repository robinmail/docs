---
title: Protocols
description: What robinmail speaks on each port, and what it leaves out.
---

## Inbound SMTP (25)

- Extensions: `PIPELINING`, `SIZE`, `8BITMIME`, `SMTPUTF8`, `ENHANCEDSTATUSCODES`,
  `STARTTLS`.
- Rspamd decides about spam, SPF, DKIM and DMARC. When Rspamd does not answer, mail gets a
  temporary error, unless `rspamd.fail_open` is set.
- A greylist answer from Rspamd gives a temporary error, only when its `GREYLIST` symbol
  fired.
- Sieve scripts run at delivery: `fileinto`, `redirect`, `vacation` and the other
  extensions robinmail implements.
- Aliases: an address, a pattern with one `*` (`sales-*@example.org`) or a catch-all
  (`@example.org`). An alias delivers to accounts here or forwards elsewhere. Forwarded
  mail gets a rewritten sender (SRS).
- Subaddresses with `+`.
- Local parts are ASCII only.

Limits: `smtp.max_message_bytes` (25 MiB), `max_recipients` (100), `max_connections` (100),
`max_connections_per_ip` (10).

## Submission (465, 587)

- 465 has TLS from the first byte. 587 starts in the clear and offers `STARTTLS`. No login
  without TLS.
- `AUTH PLAIN` and `AUTH LOGIN`.
- The sender must be one of the account's addresses or aliases. One `From` and at most one
  `Sender` field.
- A limit of recipients per account per hour, over SMTP and JMAP together and across all
  nodes (`submission.max_recipients_per_hour`, 300).
- Rspamd signs with DKIM. The keys are files on each Rspamd.

## Outbound

- MX lookup, then delivery with STARTTLS.
- MTA-STS (RFC 8461) for recipient domains, with the policies cached in the database for
  all nodes.
- Retries: five minutes, doubling up to four hours, for five days. Then a bounce.
- Bounces as RFC 3464 delivery status notifications.
- TLS reports (RFC 8460) sent once a day to domains that ask for them.
- No connection to an address that is not public (loopback, private, link-local), unless
  `outbound.allow_private_addresses` is set. Fixed `outbound.routes` are not affected.
- No DANE.

## IMAP (993, 143)

- IMAP4rev1 (RFC 3501) is the default.
- IMAP4rev2 (RFC 9051) is used when the client sends `ENABLE IMAP4rev2`. Then mailbox names
  are UTF-8, `SEARCH` answers with `ESEARCH`, `SELECT` gives no `RECENT` and no `UNSEEN`,
  `[CLOSED]` comes when another mailbox is selected, and `STATUS` has `SIZE` and `DELETED`.
  The rev1 commands keep working.
- Both are announced in `CAPABILITY`.
- 993 has TLS from the first byte. 143 offers `STARTTLS` and announces `LOGINDISABLED`
  until then.
- After login: `IDLE`, `NAMESPACE`, `UNSELECT`, `UIDPLUS`, `MOVE`, `SPECIAL-USE`,
  `CHILDREN`, `LIST-EXTENDED`, `LIST-STATUS`, `CONDSTORE`, `ESEARCH`, `SEARCHRES`, `BINARY`
  (fetch only), `STATUS=SIZE`, `UTF8=ACCEPT`, `QUOTA`, and before login `LITERAL+`,
  `SASL-IR`, `ID`, `ENABLE`.
- Login: `AUTHENTICATE PLAIN` and the `LOGIN` command.
- A label is a folder. A message with three labels is in three folders.
- `SEARCH BODY` and `TEXT` match whole words, as the index does. RFC 9051 asks for
  substrings.
- Not built: `QRESYNC`, `NOTIFY`, `METADATA`, `COMPRESS`, SCRAM.

### Mail clients by IMAP version

| Client | Version tried | Spec it runs | What it enables |
|---|---|---|---|
| Thunderbird | 153.7.0 ESR | IMAP4rev1 | `UTF8=ACCEPT`, seen in the lab's trace |
| mbsync (isync) | 1.5.1 | IMAP4rev1 | `UTF8=ACCEPT`, from its source |
| OfflineIMAP | 8.0.0 (Debian 13's `offlineimap3`) | IMAP4rev1 | nothing; it sends no `ENABLE` and writes folder names in modified UTF-7 itself |
| Apple Mail, iOS Mail, Outlook | not tried | unknown | unknown |

- Each version above is the one the lab runs. Every lab test passes with them.
- No client tried so far sends `ENABLE IMAP4rev2`. The rev2 behaviour is tested by the Go
  tests of `internal/imap` (`TestRFC9051Rev2`), not by a real client.
- `UTF8=ACCEPT` alone gives UTF-8 mailbox names and leaves the rest IMAP4rev1.
- Dovecot's ImapTest also runs in the lab. It is a test tool, not a client, so it is not in
  the table.

## JMAP (443)

Capabilities:

- `urn:ietf:params:jmap:core` and `mail` (RFC 8620, RFC 8621)
- `urn:ietf:params:jmap:submission`
- `urn:ietf:params:jmap:quota` (RFC 9425)
- `urn:ietf:params:jmap:sieve` (RFC 9661)
- `urn:ietf:params:jmap:vacationresponse`
- `urn:ietf:params:jmap:calendars` and `calendars:parse` (draft-ietf-jmap-calendars-33)
- `urn:ietf:params:jmap:contacts` (RFC 9610)
- `urn:ietf:params:jmap:principals`, `principals:owner` and `principals:availability`
  (RFC 9670)

Push over EventSource. A message submitted over JMAP waits `submission.undo_seconds` (10)
before it is sent, so the user can still cancel it.

Not built: `PushSubscription`, JMAP over WebSocket, blob management, MDN.

## CalDAV and CardDAV (443)

- Under `/dav/`, found through `/.well-known/caldav` and `/.well-known/carddav`.
- CalDAV (RFC 4791) with scheduling (RFC 6638), CardDAV (RFC 6352), sync-collection
  (RFC 6578).
- Invitations to people on other servers go out as email (iMIP) through the queue.
- Not built: LOCK, ACL, COPY, calendar proxies, public calendar URLs.

See [Calendars and contacts](/docs/calendars-contacts/).

## The web side (443)

One hostname. robinmail serves the API under `/jmap`, `/.well-known/jmap` and `/auth`,
CalDAV and CardDAV under `/dav/`, and the webmail everywhere else. It also serves:

- the MTA-STS policy of its domains at `https://mta-sts.<domain>/.well-known/mta-sts.txt`;
- autoconfig for Thunderbird, Autodiscover for Outlook, and an Apple configuration
  profile that sets up mail, calendars and contacts;
- `/healthz`.

`/metrics` is on its own listener (`metrics.listen`), which must be on loopback.

## Logins

| Who | How |
|---|---|
| Browser | account password (Argon2id), then TOTP if the account has it; or OIDC |
| Mail program (IMAP, SMTP) | app password; the account password until the account has an app password or TOTP |
| JMAP client with Basic auth | as a mail program |
| Calendar or contacts program (`/dav`) | as a mail program, with an app password that allows `dav`; or the webmail's cookie |

Ten wrong passwords close an address's web login for fifteen minutes. See the
[Security model](/docs/security/).
