---
title: Webmail
description: The Vue webmail and the Angular one, how each is built, and how mail is shown.
---

There are two webmails with the same screens. Both speak only JMAP and the `/auth` API, on
the same origin as the server. Nothing renders on a server: each is built to static files
and embedded in the binary with `go:embed`.

| | Vue | Angular |
|---|---|---|
| Directory | `web/` | `web-ng/` |
| Stack | Vue 3, Vite, Vue Router, Nuxt UI (without Nuxt) | Angular 22.2, zoneless, signals; Tailwind 4, Angular CDK, own components |
| Build | `make` | `make build-ng` |
| Binary | `./robinmail` (build tag `webmail`) | `./robinmail-ng` (build tag `webmail_ng`) |
| Unit tests | `make test-web` | `make test-ng` |
| Browser tests | `make e2e` | `make e2e-ng` |
| Live reload | `make dev` | `make dev-ng` |
| Status | done | in progress |

The default binary and the Docker image carry the Vue webmail. A plain
`go build ./cmd/robinmail` needs no Node: that binary answers with a placeholder page.

## The screens

- **Mail:** the mailboxes, a message list, threads, search, and the quota in the sidebar.
- **Compose:** rich text, send with undo, drafts saved as you type.
- **Identities:** the addresses to send from, aliases among them.
- **Filters:** Sieve rules, made in a form and kept as a Sieve script.
- **Vacation:** an automatic reply, with an optional start and end date.
- **Security:** password, TOTP with recovery codes, app passwords, web sessions, and the
  settings for mail programs with an Apple profile to download.

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
  compose stores, the `/auth` API, Sieve rules. These are the files of `web/src` with their
  tests.
- `projects/webmail`, the library `@robinmail/webmail`: every screen. It exports
  `webmailRoutes` and `provideWebmail()`.
- `projects/shell`: a thin app that starts the router with those routes.

The libraries are built with `@angular/build:ng-packagr`. A builder named
`@angular/build:library` does not exist in Angular 22.2.

The browser tests in `web/e2e` run against both webmails. Against the Angular build, 27
pass and 14 are skipped, the same as against Vue.

Left to do: virtual scrolling of the message list, a linter, a choice of webmail for the
Docker image.
