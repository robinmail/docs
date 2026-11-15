---
title: Testing
description: Every make target, the lab and the cluster, and what no test covers.
---

## The make targets

| Command | What it runs | Needs |
|---|---|---|
| `make test` | `go vet` and `go test -race`, with and without the webmail in the binary; type check and unit tests of the Vue webmail | the compose services for the database tests |
| `make test-web` | only the Vue webmail's type check and unit tests | Node |
| `make test-ng` | unit tests of the Angular libraries, and the Go tests of the binary with the Angular webmail | Node |
| `make e2e` | the browser tests (Playwright) against `./robinmail` and the dev instance, on port 8080 | the compose services |
| `make e2e-ng` | the same tests against `./robinmail-ng`, on port 8085 | the compose services |
| `make keycloak-test` | the OIDC login against a real Keycloak in Docker | Docker |
| `make cluster-test` | three rqlite and three robinmail nodes; nodes are killed and restarted | Docker |
| `make lab-test` | robinmail next to Postfix, Exim and OpenSMTPD, with real IMAP clients and Thunderbird | Docker |
| `make thunderbird-test` | only the Thunderbird tests of the lab | Docker |

`KEEP=1` leaves the Keycloak, the cluster or the lab running after the test.

## Go tests with a database

They are skipped unless told where rqlite is. Start the compose services, then:

```bash
ROBINMAIL_TEST_RQLITE=http://127.0.0.1:4001 ROBINMAIL_TEST_RQLITE_B=http://127.0.0.1:4003 go test -race ./...
```

- `ROBINMAIL_TEST_RQLITE_B` is the second database, for the test that sends mail between
  two servers.
- The tests of backup, restore and master key rotation start an rqlite container of their
  own and are skipped without Docker.
- The tests fill these databases with throwaway domains and accounts. The development
  instance uses its own, on port 4005.

## The browser tests

```bash
cd web && npx playwright install chromium
```

once, then `make e2e`. They take about three minutes: the tests that send mail wait out the
server's undo time and its queue. One test sends to an outside address and is skipped when
Mailpit is not running.

`make e2e` wants port 8080. With a development server there, use another port:

```bash
ROBINMAIL_E2E_PORT=8085 contrib/dev/e2e.sh
```

The e2e config adds a fake OpenID provider, started with the tests, that logs the dev user
in without asking.

## The cluster

`make cluster-test` builds the image, starts `contrib/compose/cluster.yaml`, runs
`internal/clustertest`, and removes the cluster, also when a test failed. About six
minutes after the first build.

- Three rqlite nodes, locked down: HTTPS API with a login, Raft over mutual TLS.
- Three robinmail nodes, each next to its rqlite.
- A fourth robinmail with a database of its own, which the cluster exchanges mail with.
- Rspamd.

The tests kill, freeze and restart containers while mail arrives. They check that nothing
is lost or doubled, that quota and Sieve hold under deliveries at once on three nodes, that
`scrub` repairs a damaged file from another node, and that rqlite refuses requests without
the right login.

## The lab

`make lab-test` builds the images, starts `contrib/lab/compose.yaml`, runs
`internal/labtest` and removes the lab. About seven minutes after the first build.

| Host | What |
|---|---|
| `dns` | CoreDNS. Answers for `.test` and says "no such name" to everything else. |
| `web` | nginx: MTA-STS policies of the peers, and a gate to the host |
| `robinmail` | `robin.test` |
| `postfix`, `exim`, `opensmtpd` | a domain each, plus a `late.` domain that bounces after accepting |
| `badtls`, `notls` | Postfix with a self-signed certificate, and without STARTTLS |
| `imapclients` | Dovecot's ImapTest, mbsync, OfflineIMAP |
| `thunderbird` | a real Thunderbird, driven over Marionette |

The lab has its own certificate authority. Its network is internal: no container has a
route to the outside. Mail goes both ways through the real servers, and the tests read it
back from the peers' Maildirs and from robinmail over JMAP. At the end they print a matrix:
one row per case, one column per peer.

### The JMAP test suite

Fastmail's JMAP-TestSuite is not part of `make lab-test`. Run it by hand against the lab:

```bash
contrib/lab/lab.sh up
contrib/lab/lab.sh suite
```

At the end of phase 8: 119 pass, 7 fail. One failure is `updatedProperties` of
`Mailbox/changes`, which robinmail leaves null. Six are over readings of the RFC.

## Rules the tests follow

- Every protocol package has tests written from the RFC, naming the section, with the RFC's
  examples where it has them.
- The parsers that face the network have fuzz targets. An input that found a bug is kept.
- What the lab finds wrong is fixed with a test in the package concerned that needs no
  Docker.
- No test sends mail beyond loopback or a private Docker network.

## What no test covers

- Real providers: Gmail, Outlook and the rest. That needs a host with port 25 and a PTR
  record.
- ACME against a real certificate authority.
- iOS Mail, Apple Mail and Outlook as clients. Outlook's Autodiscover against a real
  Outlook.
- TLS reports against a real receiver of reports.
- A restore of a backup made by an older schema.
