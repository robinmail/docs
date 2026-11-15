---
title: Calendars and contacts
description: Calendars and address books over JMAP and over CalDAV and CardDAV, sharing, and invitations by email.
---

Since phase 9 robinmail keeps calendars and address books next to the mail. The webmail
reaches them over JMAP. Phones and desktop programs reach them over CalDAV and CardDAV.
Invitations go out and come in as email.

To connect a program, see [Calendar and contacts programs](/docs/getting-started/dav-clients/).

## One store, two protocols

Every calendar object and every card is stored once, as text, in the database:

- a calendar object is the VCALENDAR of one UID: the event and its overrides
  (RFC 4791 4.1);
- a card is its vCard.

DAV reads and writes that text. JMAP converts it to JSCalendar or JSContact on every read,
and back on every write, starting from the stored text. So what JSCalendar has no word for
stays: X- properties, parameters, Apple's labels on grouped vCard properties.

Writes work as for mail. Each is one batch with guards for the collection, the ETag
(`If-Match`, `If-None-Match: *`), one UID per collection and the quota. The account's
`modseq` moves. JMAP `/changes`, DAV sync tokens and push all come from the change log.

Calendar objects and cards are not encrypted at rest. They are plain text in the database,
like the search index.

## Standards

| What | Standard |
|---|---|
| JMAP Calendars | draft-ietf-jmap-calendars-33 (14 October 2026) |
| JSCalendar 2.0 | draft-ietf-calext-jscalendarbis-22, converted to and from iCalendar by draft-ietf-calext-jscalendar-icalendar-28 |
| JMAP Contacts | RFC 9610 |
| JSContact | RFC 9553, and RFC 9555 for vCard |
| JMAP Principals and sharing | RFC 9670 |
| CalDAV | RFC 4791, scheduling RFC 6638 |
| CardDAV | RFC 6352 |
| WebDAV | RFC 4918; sync-collection RFC 6578; extended MKCOL RFC 5689; of RFC 3744 the properties clients read |
| Discovery | RFC 6764: well-known URIs and SRV records |
| Invitations | iTIP (RFC 5546) over iMIP (RFC 6047) |

## JMAP

Capabilities: `urn:ietf:params:jmap:calendars`, `calendars:parse`, `contacts`,
`principals`, `principals:owner` and `principals:availability`.

- `Calendar` get, changes and set (with `shareWith`, `onDestroyRemoveEvents`,
  `onSuccessSetIsDefault`).
- `CalendarEvent` get, changes, set, query and parse.
- `ParticipantIdentity` get and changes: the account's addresses. Set is forbidden.
- `AddressBook` and `ContactCard` get, changes, set and query.
- `Principal` get, changes, query and getAvailability.

An event lives in one calendar, a card in one address book. An event's id is `v<n>`, a
card's `p<n>`. An occurrence that `expandRecurrences` makes is `<id>_<recurrence id>`.

Push covers these types, and the accounts that share something with the user.

## CalDAV and CardDAV

The tree is under `/dav/`:

```
/dav/principals/<account>/                the account's principal
/dav/calendars/<account>/                 its calendar home
/dav/calendars/<account>/c<n>/            a calendar
/dav/calendars/<account>/<owner>-c<n>/    a calendar someone shared with it
/dav/calendars/<account>/inbox/           the scheduling inbox
/dav/calendars/<account>/outbox/          the scheduling outbox, for free/busy
/dav/addressbooks/<account>/              its address book home
/dav/addressbooks/<account>/b<n>/         an address book; <owner>-b<n> when shared
```

`<account>` is the account's id, not its address. A collection a DAV client made sits at
the path that client chose. `/.well-known/caldav` and `/.well-known/carddav` lead to
`/dav/`, where a client finds its principal.

- Discovery through the well-known URIs and `current-user-principal`.
- PROPFIND (depth 0 and 1), PROPPATCH with dead properties, MKCALENDAR and extended MKCOL at
  the path the client chose.
- GET of one object, or of a whole collection as `.ics` or `.vcf`: that is the export.
- PUT, DELETE, MOVE.
- Reports: calendar-query with time ranges, calendar-multiget (with `expand`),
  free-busy-query, addressbook-query (with `limit`), addressbook-multiget,
  sync-collection, expand-property, principal-property-search.

**Login.** Basic auth with an app password that allows `dav`, or the account password while
the account has no app password and no TOTP. The webmail's session cookie works too, for
its export and import. `/dav` always answers a missing login with a Basic challenge:
Thunderbird's calendar gives up on a 401 without one.

## Sharing

A calendar or an address book can be shared with another account of the same server, to
read or to read and write.

- Over JMAP, the owner's account shows up in the sharee's session with just what is shared
  (RFC 9670).
- Over DAV, the shared collection shows up in the sharee's own home as `<owner>-c<n>` or
  `<owner>-b<n>`, with the RFC 3744 privileges that say what is allowed.
- A sharee who deletes a shared collection in a DAV client leaves it. The owner keeps it.
- Colour, visibility and alerts are one copy for everyone. A sharee's change of them is
  accepted and kept by no one.

## Invitations

robinmail schedules by itself after a change of an account's event (RFC 6638, implicit
scheduling):

- **As organizer:** a REQUEST to the attendees when more than their answers changed; a
  CANCEL to attendees taken off, and to all when the event is deleted.
- **As attendee:** a REPLY when the account's own answer changed; DECLINED when it deletes
  the event.

Where it goes:

- **To an account on this server:** applied at once. The event or the answer is in its
  calendar, and the message is in its scheduling inbox.
- **To anyone else:** an email (iMIP) with a text part, a `text/calendar; method=...` part
  and `invite.ics`. It goes through submission and the queue and is signed like the
  account's other mail.

CalDAV PUT and DELETE schedule. `Schedule-Reply: F` on a DELETE does not. JMAP schedules
when `sendSchedulingMessages` is true.

**Incoming invitations** are applied at delivery when the mail is not spam, holds an iTIP
part, and comes from the organizer (REQUEST, ADD, CANCEL) or from the attendee it answers
for (REPLY). An older SEQUENCE is ignored. The account's own answer and alarms stay while
the sequence does. Nothing checks that the `From` field is genuine beyond Rspamd's score.

**Free/busy** is known for accounts of this server: the CalDAV outbox POST,
`free-busy-query` and JMAP `Principal/getAvailability`. Transparent, cancelled,
confidential and declined events do not count; tentative ones are busy-tentative.

## Recurrence and time zones

- Every RRULE part (RFC 5545 3.3.10), with RDATE, EXDATE and overrides, in the event's
  zone.
- Zones are IANA names from the data Go carries in the binary, Windows names as Outlook
  writes them, and names that end in an IANA name. Otherwise a VTIMEZONE is compared with
  the IANA zones by its changes. One that matches none becomes its standard offset.
- Bounds: a rule that never fires ends after 2000 empty periods; a period makes at most
  50 000 occurrences, a range at most 10 000.
- RSCALE (RFC 7529) is kept but expanded as Gregorian.

## Alarms

Alarms are stored (VALARM, JSCalendar alerts) and given to clients. robinmail sends no
reminders. The webmail shows none.

## Quota

Calendar objects and cards count like messages, in octets and in number. RFC 9425's
`types` say so.

## Not built

- Notifications of events and shares (JMAP Calendars 7, RFC 9670 5).
- The `/copy` methods, `isDraft`, default alerts, `/queryChanges` of events, cards and
  principals.
- COUNTER, DECLINECOUNTER and REFRESH. Schedule-Tag. `hideAttendees`.
- DAV LOCK, ACL and COPY; calendar proxies and delegation; partial calendar-data; managed
  attachments; VAVAILABILITY; public or subscribable calendar URLs.
- Sharing with accounts of other servers.
- Free/busy of people on other servers.
