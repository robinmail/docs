---
title: A mail program
description: Connect Thunderbird or another IMAP client to the development instance.
---

The development instance takes a mail program too: Thunderbird, Apple Mail, mbsync.
IMAP and submission only speak TLS, with the self-signed certificate that
`contrib/dev/seed.sh` made.

## Settings

| | Protocol | Server | Port | Security |
|---|---|---|---|---|
| Incoming | IMAP | `127.0.0.1` | `1993` | SSL/TLS |
| Incoming, other | IMAP | `127.0.0.1` | `1143` | STARTTLS |
| Outgoing | SMTP | `127.0.0.1` | `1465` | SSL/TLS |
| Outgoing, other | SMTP | `127.0.0.1` | `1587` | STARTTLS |

- User name: `dev@robinmail.test`.
- Authentication: normal password.

Thunderbird's automatic set-up finds nothing for `robinmail.test`. Choose "configure
manually". The program shows the certificate once and asks whether to trust it. Make the
exception for incoming and for outgoing.

Mail the program sends to an outside address lands in Mailpit, http://127.0.0.1:8025.

## Which password

- **The account password**, as long as the account has no app password and no two-step
  login. That is how `seed.sh` leaves the dev account, so a program can be set up without
  opening the webmail.
- **An app password**, once the account has one. Make one in the webmail under Security
  (the shield). From then on mail programs are refused the account password, and it only
  opens the webmail.

Revoking the last app password brings the account password back for mail programs, unless
the account has TOTP. The config switch `auth.require_app_passwords` refuses the account
password to mail programs for every account.

## On a real server

`robinmail dns <domain>` prints an `autoconfig.<domain>` record and SRV records (RFC 6186,
RFC 8314). With those, Thunderbird's automatic set-up finds the server. robinmail also
answers Outlook's Autodiscover and serves an Apple configuration profile. See
[DNS records](/docs/reference/dns/).

For calendars and contacts, see [Calendar and contacts programs](/docs/getting-started/dav-clients/).
