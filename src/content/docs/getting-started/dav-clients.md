---
title: Calendar and contacts programs
description: Connect Thunderbird, an iPhone or a Mac to the calendars and address books of the development instance.
---

Calendar and contacts programs speak CalDAV and CardDAV. robinmail serves both under
`/dav/`. Start a [development instance](/docs/getting-started/dev-instance/) first.

## Which password

The same rule as for [mail programs](/docs/getting-started/mail-program/#which-password):

- **the account password**, while the account has no app password and no TOTP;
- **an app password** that allows "Calendars and contacts (CalDAV, CardDAV)", or all
  protocols. Make one in the webmail under Security.

## Thunderbird

The development instance serves DAV on plain HTTP, on loopback:
`http://127.0.0.1:8080/dav/`.

**Calendar:**

1. Calendar → New Calendar → On the Network.
2. User name: `dev@robinmail.test`. Location: `http://127.0.0.1:8080/dav/`.
3. Thunderbird finds "Calendar" and offers the address book too. Give the password.

**Address book:**

1. Address Book → New CardDAV Address Book.
2. The same user name and location.

Make an event in the webmail at http://127.0.0.1:8080, then Synchronize in Thunderbird. To
try an invitation, invite `other@robinmail.test`, log in as that user, and accept.

## An iPhone, an iPad or a Mac

These want HTTPS on an address they can reach. The development instance listens on
127.0.0.1 only. `contrib/dev/phone.sh` writes a second config on this machine's address in
the local network, with a self-signed certificate for that address. It uses the same
database and users.

```bash
contrib/dev/phone.sh
```

It takes the first private IPv4 address it finds. Give one if that is the wrong one:
`contrib/dev/phone.sh 192.168.1.20`.

```bash
./robinmail -config dev/robinmail.phone.json serve
```

| What | Where |
|---|---|
| Webmail, CalDAV and CardDAV | `https://<address>:8443/`, DAV under `/dav/` |
| IMAP | `<address>:2993`, TLS |
| Submission | `<address>:2465`, TLS |

The ports differ from the development instance, so both can run. Mail to other domains
still goes to Mailpit.

**With the profile** (the easy way):

1. On the iPhone, open `https://<address>:8443/` in Safari and accept the certificate.
2. Log in as `dev@robinmail.test`.
3. Security → "Profile for iPhone, iPad and Mac". The profile sets up mail, calendars and
   contacts. It is not signed and holds no password.
4. Settings → General → VPN & Device Management: install it. It asks for the password.

**By hand:**

1. Settings → Calendar → Accounts → Add Account → Other → Add CalDAV Account.
2. Server `<address>:8443`, user `dev@robinmail.test`, the password.
3. The same for CardDAV under Contacts.

iOS warns about the certificate once. Choose Continue.

:::caution[Untried]
No iPhone, iPad or Mac has been connected to robinmail yet. These steps follow the code and
the profile it serves. Thunderbird, vdirsyncer and the Python caldav library are tested in
the lab.
:::

## Other programs

- **DAVx5** on Android: give it `https://<hostname>/dav/` or your address. Untried.
- **Outlook** speaks no CalDAV or CardDAV.
- **vdirsyncer** and the **Python caldav library** are tested in the lab.

## On a real server

`robinmail dns <domain>` prints `_caldavs._tcp` and `_carddavs._tcp` SRV records and their
`path=/dav/` TXT records. With those a program finds the server from the address alone. See
[DNS records](/docs/reference/dns/).
