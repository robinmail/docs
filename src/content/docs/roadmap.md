---
title: Roadmap
description: What is in progress, what is open, and the questions PLAN.md leaves unanswered.
---

robinmail was built in phases, each by its own session, each ending in something shown
working. Phases 0 to 10 are done, and so is the Angular webmail. This page lists what is
not.

## Recently done

- **Phase 9: calendars and contacts.** JMAP Calendars, Contacts and Principals; CalDAV and
  CardDAV; invitations by email; sharing between accounts. The Angular webmail became the
  main one. See [Calendars and contacts](/docs/calendars-contacts/).
- **Phase 10: embedded Raft and SQLite.** rqlite is gone. The robinmail nodes are the whole
  cluster. See [Metadata: embedded Raft and SQLite](/docs/architecture/database/).

## Left from phases 9 and 10

- Try an iPhone, macOS Calendar and Contacts, and DAVx5 against the DAV server. Only
  Thunderbird, vdirsyncer and the Python caldav library have been tried.
- Four JMAP-TestSuite files about calendars, contacts and principals fail.
- Not built: notifications of calendar events and shares, `/copy`, `/queryChanges` of
  events, cards and principals, per-user properties of shared calendars, COUNTER and
  REFRESH, Schedule-Tag, DAV LOCK, ACL and COPY, public calendar links.
- The Vue webmail has no calendar and no contacts.
- A node that lost its data directory joins again as a new member. There is no
  "replace in place".
- Membership changes go one at a time. A snapshot is the whole database, sent at once.
- Five nodes have not been tested.
- Virtual scrolling of the message list and a linter for the Angular webmail.

## Before real mail

- Fix the open security findings: memory use of inbound SMTP
  ([#43](https://github.com/robinmail/robinmail/issues/43)) and the lockout of the web login
  ([#41](https://github.com/robinmail/robinmail/issues/41)).
- Test against real providers and clients: which host and domain is still open
  ([#26](https://github.com/robinmail/robinmail/issues/26)).
- Choose a licence ([#28](https://github.com/robinmail/robinmail/issues/28)).
- Releases, a `version` command and a tested upgrade path
  ([#25](https://github.com/robinmail/robinmail/issues/25)).
- Drop privileges after binding ports, and a systemd unit
  ([#24](https://github.com/robinmail/robinmail/issues/24)).

The other gaps against mox are on [Compared with mox](/docs/mox/).

## Open questions

From [PLAN.md](https://github.com/robinmail/robinmail/blob/main/PLAN.md#open-questions).
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
- The database and the Raft log are not encrypted on disk.

### Calendars and contacts

- Invitations from outside: add them only with a DMARC pass, only from senders in the
  address book, or as now (when the `From` names the organizer and the mail is not spam)?
- Reminders: should robinmail mail them, or push JMAP's CalendarAlert, for users without a
  calendar program?
- Public calendar links, a read-only `.ics` URL to subscribe to: wanted?
- Mailbox delegation and calendar proxies ("send on behalf of", a secretary's access). A
  phase of its own?

### Mail

- A line longer than 998 characters goes out as it came in. Refuse it, or re-encode?
- DKIM keys are files on every Rspamd, copied by hand. Rspamd could take the key with the
  request, which would let robinmail keep keys in its database.
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
