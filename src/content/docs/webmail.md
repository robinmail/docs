---
title: Webmail
description: The Angular webmail with mail, calendar and contacts, how it is built, and how mail is shown.
---

The webmail speaks only JMAP and the `/auth` API, on the same origin as the server.
Nothing renders on a server: it is built to static files and embedded in the binary with
`go:embed`. It has mail, calendar and contacts.

| | |
|---|---|
| Directory | `web-ng/` |
| Stack | Angular 22.2, zoneless, signals; Tailwind 4, Angular CDK, own components |
| Build | `make` |
| Binary | `./robinmail` (build tag `webmail`) |
| Unit tests | `make test-web` |
| Browser tests | `make e2e` (Playwright, in `e2e/`) |
| Live reload | `make dev` |

The Docker image carries the webmail. A plain `go build ./cmd/robinmail` needs no Node:
that binary answers with a placeholder page. A first webmail in Vue (`web/`) was removed on
2026-11-15; the git history has it.

## The screens

A switch at the top of the left column goes between Mail, Calendar and Contacts.

- **Mail:** the mailboxes, a message list, threads, search, and the quota in the sidebar.
- **Compose:** rich text, send with undo, drafts saved as you type.
- **Calendar:** day, week and month; the user's calendars and those shared with them, each
  shown or hidden. See below.
- **Contacts:** list, search, detail, and an editor. See below.
- **Identities:** the addresses to send from, aliases among them.
- **Filters:** Sieve rules, made in a form and kept as a Sieve script.
- **Vacation:** an automatic reply, with an optional start and end date.
- **Security:** password, TOTP with recovery codes, app passwords, web sessions, and the
  settings for mail, calendar and contacts programs, with an Apple profile to download.

## Calendar

- An editor with all day, start and end, location, repetition by day, week, month or year
  with a count, guests, a reminder and notes.
- One occurrence or the whole series changed or deleted.
- Invitations with accept, maybe and decline.
- Calendars made, coloured, shared by address, downloaded.
- `.ics` import, through `CalendarEvent/parse`.

Not there: dragging events, a time zone picker (the browser's zone is used), a free/busy
view while inviting, attendees per occurrence, reminders shown by the webmail.

## Contacts

- An editor with names, organization, addresses, numbers, birthday and notes.
- `.vcf` import through CardDAV, and download.

Not there: contact groups and photos in the editor.

## Login

The session is a cookie: `Secure`, `HttpOnly`, `SameSite=Strict`, with the `__Host-`
prefix. Every request to `/auth` and JMAP also has its `Origin` checked, and every request
that changes state must be JSON with its content type. There is no CSRF token; the three
checks leave no cross-site request for one to stop. Sessions are rows in the database, so
any node accepts the cookie.

With OIDC providers in the config, the login page offers "Log in with ..." next to the
password.

## HTML mail

- The server cleans a message's HTML with an allowlist.
- The webmail shows it only from `/jmap/view/...`, in a sandboxed frame, with a content
  security policy that forbids script.
- Remote images are off until the reader turns them on.
- `<style>` blocks are dropped, so mail laid out with a style sheet looks plain.
- The frame has a fixed height and scrolls inside. A frame without script cannot tell the
  page how tall it is.

## The Angular workspace

One workspace in `web-ng/` with three projects:

- `projects/jmap`, the library `@robinmail/jmap`: the JMAP client, sync, push, the mail and
  compose stores, the `/auth` API, Sieve rules. These started as the files of `web/src`
  with their tests.
- `projects/webmail`, the library `@robinmail/webmail`: every screen. It exports
  `webmailRoutes` and `provideWebmail()`.
- `projects/shell`: a thin app that starts the router with those routes.

The libraries are built with `@angular/build:ng-packagr`. A builder named
`@angular/build:library` does not exist in Angular 22.2.

The browser tests in `e2e/` run against the binary with the webmail inside. At the end of
phase 10, 33 pass and 14 are skipped by design.

Left to do: virtual scrolling of the message list, and a linter.
