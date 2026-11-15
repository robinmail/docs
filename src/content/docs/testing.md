---
title: Testing
description: Every make target, the lab and the cluster, and what no test covers.
---

## The make targets

| Command | What it runs | Needs |
|---|---|---|
| `make test` | `go vet` and `go test -race`, with and without the webmail in the binary; unit tests of the Angular webmail | Node |
| `make test-web` | only the Angular webmail's unit tests | Node |
| `make test-vue` | the Vue webmail's type check and unit tests, and the Go tests of the binary with it | Node |
| `make e2e` | the browser tests (Playwright) against `./robinmail` with the Angular webmail, on port 8085 | Mailpit for one test |
| `make e2e-vue` | the same tests against `./robinmail-vue`; the calendar and contacts tests are skipped | Mailpit for one test |
| `make keycloak-test` | the OIDC login against a real Keycloak in Docker | Docker |
| `make cluster-test` | three robinmail nodes; nodes are killed and restarted, the database leader included | Docker |
| `make lab-test` | robinmail next to Postfix, Exim and OpenSMTPD, with real IMAP clients, DAV clients and Thunderbird | Docker |
| `make thunderbird-test` | only the Thunderbird tests of the lab | Docker |

`KEEP=1` leaves the Keycloak, the cluster or the lab running after the test. The names of
before phase 9 (`test-ng`, `e2e-ng`, `build-ng`, `dev-ng`) still work.

## Go tests

```bash
go test -race ./...
```

Nothing needs to run. The tests make their databases themselves, in temporary
directories: one node, or a cluster of several nodes in the test's own process
(`internal/raftdb/raftdbtest`). The variables `ROBINMAIL_TEST_RQLITE` and
`ROBINMAIL_TEST_RQLITE_B` are gone with rqlite.

- The end-to-end test of `serve` with Rspamd wants `ROBINMAIL_TEST_RSPAMD`
  (`http://127.0.0.1:11333` with the compose services) and is skipped without it.
- `internal/raftdb` tests a single node with restart, a proposal applied three times, apply
  determinism, the leader killed under six writers, a partition, compaction, adding and
  removing members, and backup and load.
- At the end of phase 10: 1021 tests and subtests pass, 25 skip (the lab, the cluster, the
  Rspamd tests and a latency measurement, each run on its own).

## The browser tests

```bash
cd web && npx playwright install chromium
```

once, then `make e2e`. They take about three minutes: the tests that send mail wait out the
server's undo time and its queue. One test sends to an outside address and is skipped when
Mailpit is not running.

`make e2e` runs on port 8085, so a development server on 8080 can stay up. It has a config
(`dev/robinmail.e2e.json`) and a data directory (`dev/e2e-data`) of its own, seeded like the
development instance. At the end of phase 10: 33 passed, 14 skipped by design. Among them
are the calendar (a repeating event, an invitation accepted and cancelled, `.ics` import, a
calendar shared to read) and the contacts (made, found, changed, downloaded, deleted,
`.vcf` import).

The e2e config adds a fake OpenID provider, started with the tests, that logs the dev user
in without asking.

## The cluster

`make cluster-test` builds the image, starts `contrib/compose/cluster.yaml`, runs
`internal/clustertest`, and removes the cluster, also when a test failed. About six
minutes after the first build.

- Three robinmail nodes. They are the whole cluster. `contrib/compose/cluster.sh` forms it
  with `node id`, `node add` and `node join`.
- A fourth robinmail with a database of its own, which the cluster exchanges mail with.
- Rspamd, optional.

The tests kill, freeze and restart containers while mail arrives. Parts a to k:

| Part | What |
|---|---|
| a | the node that leads the database killed and restarted during deliveries |
| b | a robinmail node killed during deliveries |
| c | a node with a wiped blob directory catches up |
| d | a read through a node that lacks the message file |
| e | throughput |
| f | sending while a node that holds queue claims is killed |
| g | logins, revocation and limits across the nodes |
| h | a quota under deliveries at once through three nodes |
| i | Sieve under deliveries at once through three nodes |
| j | a scrub replaces a damaged message file from another node |
| k | the database has no port but the members' mutual TLS |

They check that nothing is lost or doubled and that IMAP UIDs and modseq stay consistent.
Numbers are on [A cluster](/docs/architecture/cluster/#how-it-was-tested).

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
| `davclients` | the Python caldav library and vdirsyncer |
| `thunderbird` | a real Thunderbird, driven over Marionette, for mail, calendars and contacts |

The lab has its own certificate authority. Its network is internal: no container has a
route to the outside. Mail goes both ways through the real servers, and the tests read it
back from the peers' Maildirs and from robinmail over JMAP. At the end they print a matrix:
one row per case, one column per peer.

Since phase 9 the lab also tests calendars and contacts: the DAV clients, Thunderbird's
CalDAV and CardDAV both ways, and invitations from robinmail to robinmail, to Postfix and to
Exim, with the reply coming back by mail. Since phase 10 the lab has no database container;
the tests read and fix rows with `robinmail db`.

### The JMAP test suite

Fastmail's JMAP-TestSuite is not part of `make lab-test`. Run it by hand against the lab:

```bash
contrib/lab/lab.sh up
contrib/lab/lab.sh suite
```

Its container runs on robinmail's node, in the same network namespace and on the same data
volume, so its `robinmail user add` reaches the server.

At the end of phase 10: 158 files pass, 4 skip, 11 fail.

- 7 are the failures known since phase 8. One is `updatedProperties` of `Mailbox/changes`,
  which robinmail leaves null. Six are over readings of the RFC.
- 4 are calendar, contacts and principals files that were skipped before phase 9: the
  `foreign-account` files of CalendarEvent, ContactCard and Principal (`queryChanges`
  answers `cannotCalculateChanges` before it says `accountNotFound`) and
  `CalendarEvent/set/update`. They are left for a follow-up.

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
- An iPhone, macOS Calendar and Contacts, and DAVx5 against the DAV server.
- A cluster of five nodes.
- TLS reports against a real receiver of reports.
- A restore of a backup made by an older schema.
