---
title: Configuration
description: Every block of robinmail.json, with its defaults.
---

robinmail reads one JSON file, given with `-config` (default `robinmail.json`).
[`robinmail.example.json`](https://github.com/robinmail/robinmail/blob/main/robinmail.example.json)
in the repository shows every block.

- An unknown field is an error.
- A field left out, or `0`, gets the default in the tables below. One exception:
  `submission.undo_seconds` set to `0` means no wait.
- A relative path is resolved against the directory of the config file.
- A change needs a restart. Domains, users and aliases are not in this file: they live in
  the database and change at once on every node.
- A config with an `rqlite` block is refused. That block was where the metadata lived until
  phase 10; remove it. The database is now in `<data_dir>/db`.
- Numbers below in square brackets are defaults.

## Top level

| Field | What it sets |
|---|---|
| `hostname` | The name the server announces in SMTP and asks certificates for. Required. |
| `data_dir` | This node's database in `<data_dir>/db`, its message files in `<data_dir>/blobs`, its node key and certificate, and the ACME cache. Required. Each node has its own. |
| `master_key_file` | The key file that wraps every account key. Required. Make it with `robinmail key generate`. Every node of a cluster needs the same file. Losing it loses all mail: back it up, apart from the data. |

## `node`

Makes this robinmail a node that other nodes can reach. Without an `id` it runs alone and
the other fields must be empty. With it, the node can form a cluster or join one with the
`node` commands; see [Forming a cluster](/docs/architecture/cluster/#forming-a-cluster).
Every node of a cluster needs this section and the same master key file.

| Field | What it sets |
|---|---|
| `id` | The node's name in the node table: 1 to 32 lowercase letters, digits or `-`. Unique, and should not change. |
| `listen` | Where the node listens for the other nodes, such as `:7443`: Raft messages, snapshots and message files, over mutual TLS. |
| `address` | The `host:port` under which the other nodes reach `listen`. |
| `blob_copies` | How many nodes must have a message file before a write is acknowledged, this one included. With fewer nodes, all of them. [2] |
| `repair_interval_seconds` | How often the node fetches the files it lacks. It also does so at start. [300] |

## `tls`

The certificate of the SMTP, submission, IMAP and HTTPS listeners.

| Field | What it sets |
|---|---|
| `cert_file`, `key_file` | A certificate and its key, in PEM. Both or neither. |
| `acme` | Get certificates automatically, with Go's `autocert` and its defaults (Let's Encrypt). Untested against a real CA. |
| `acme_email` | The contact address for the ACME account. |

Submission, IMAP and `web.listen` refuse to start without a certificate.

## `smtp`

The inbound listener.

| Field | What it sets |
|---|---|
| `listen` | [`:25`] |
| `max_message_bytes` | The largest message. At least 65536 (RFC 5321). [26214400, 25 MiB] |
| `max_recipients` | Recipients per message. At least 100. [100] |
| `max_connections` | Connections at once. [100] |
| `max_connections_per_ip` | Connections from one client address. [10] |

:::caution
The listener holds each message in memory while it arrives. With the defaults that can add
up to several GiB. On a small machine, lower `max_connections` and `max_message_bytes` to
fit the memory you have. This is open issue
[#43](https://github.com/robinmail/robinmail/issues/43).
:::

## `submission`

The listeners users send mail through. Both need a certificate. The size and recipient
limits per message are those of `smtp`. Without a listener only JMAP submits.

| Field | What it sets |
|---|---|
| `listen` | The STARTTLS listener, usually `:587`. |
| `listen_tls` | The listener with TLS from the first byte, usually `:465`. |
| `max_recipients_per_hour` | Recipients one account may send to in an hour, over SMTP and JMAP together, on all nodes. [300] |
| `undo_seconds` | How long a message submitted over JMAP waits before it is sent, so the user can cancel it. 0 to 3600; `0` sends at once. [10] |

## `imap`

Both listeners need a certificate. Without a listener IMAP is off.

| Field | What it sets |
|---|---|
| `listen_tls` | TLS from the first byte, usually `:993`. The one to give to mail programs. |
| `listen` | Starts in the clear and offers STARTTLS, usually `:143`. |
| `max_connections` | Connections at once. [1000] |
| `max_connections_per_ip` | From one client address. [20] |
| `max_connections_per_user` | Logged in as one user. [20] |

## `web`

Login, JMAP and the webmail, on one origin. Without a listener it is off.

| Field | What it sets |
|---|---|
| `listen` | The HTTPS listener, usually `:443`. With ACME, also where the certificate is validated. |
| `http_listen` | A plain HTTP listener for development and tests. Must be on a loopback address. |
| `dev_origins` | Origins besides the server's own that may call the API, such as `http://localhost:5173` for Vite. Development only. |

## `rspamd`

| Field | What it sets |
|---|---|
| `url` | Where Rspamd's HTTP API is. Empty turns scanning off. |
| `fail_open` | When Rspamd does not answer: `true` delivers mail unscanned, `false` tells the sender to retry. [false] |
| `timeout_seconds` | How long to wait for Rspamd. [30] |

## `outbound`

The queue that delivers to other servers.

| Field | What it sets |
|---|---|
| `concurrency` | Messages a node works on at once. [8] |
| `per_destination` | Connections one recipient domain gets. [2] |
| `routes` | A fixed `host:port` per domain instead of its MX hosts; `*` is every other domain. For a relay host, and for development. No login to the relay. |
| `allow_private_addresses` | Let mail, and the fetch of an MTA-STS policy, go to a server whose address is loopback, private or link-local. Keep it off on the internet. Routes are not affected. [false] |

## `auth`

Accounts, app passwords and TOTP need no configuration. This block holds the switches.

| Field | What it sets |
|---|---|
| `require_app_passwords` | Refuse the account password for IMAP, submission and JMAP with Basic auth, for every account. Without it, the password works there until the account has an app password or TOTP. [false] |
| `audit_retention_days` | How long the log of auth events is kept. [90] |
| `oidc` | OpenID Connect providers the webmail's login page offers. A list; see below. |

### `auth.oidc[]`

One provider: Keycloak, Authentik, Zitadel or any other with a discovery document. The
provider needs a client with the redirect URI `https://<hostname>/auth/oidc/<name>/callback`
and the authorization code flow. Mail programs cannot use it; they need an app password.

| Field | What it sets |
|---|---|
| `name` | The provider in URLs: lowercase letters, digits and `-`. Unique. |
| `label` | What the button says after "Log in with". [`name`] |
| `issuer` | The issuer URL, exactly as the discovery document states it. `https`, or `http` on loopback. |
| `client_id` | Required. |
| `client_secret`, `client_secret_file` | One or neither. Without either, robinmail is a public client and PKCE alone protects the code. |
| `scopes` | Must include `openid`. [`["openid", "email"]`] |
| `claim` | The ID token claim that holds the account's address. [`email`] |
| `allow_unverified_email` | Accept the `email` claim without `email_verified: true`. Only for a provider whose addresses the administrator assigns. |
| `require_totp` | Ask for the TOTP code after a provider login too, for accounts that have TOTP. |
| `auto_provision_domains` | Domains for which a provider login creates the account when there is none. Empty: accounts are made by hand. |

## `quota`

Limits for accounts that have none of their own. `robinmail user quota` sets those. Every
node needs the same values.

| Field | What it sets |
|---|---|
| `default_bytes` | Octets of mail per account. `0` is no limit. [0] |
| `default_messages` | Messages per account. `0` is no limit. [0] |

## `mta_sts`

The MTA-STS policy (RFC 8461) robinmail serves for its own domains, at
`https://mta-sts.<domain>/.well-known/mta-sts.txt`. The certificate has to cover those
names.

| Field | What it sets |
|---|---|
| `mode` | `testing`, `enforce` or `none`. Empty serves no policy. [empty] |
| `max_age_seconds` | How long a sender may cache the policy. At most a year. [86400] |
| `mx` | The names, or `*.example.org` patterns, of the domains' mail servers. [`hostname`] |

The example config sets `mode` to `testing`. Left out, no policy is served.

## `tls_rpt`

TLS reporting (RFC 8460). robinmail counts how the TLS of its deliveries went, and once a
day sends a report to each domain that asks for one.

| Field | What it sets |
|---|---|
| `disabled` | Stop sending reports. Counting and receiving go on. [false] |
| `from` | The address reports come from. [`postmaster@` the first domain] |
| `organization` | The organization name in reports. [`hostname`] |

## `metrics`

| Field | What it sets |
|---|---|
| `listen` | Where `/metrics` is served in Prometheus' text format, such as `127.0.0.1:9150`. No login and no TLS, so it must be on loopback. Empty: no listener. |

## `scrub`

The periodic check of this node's message files against their hashes.

| Field | What it sets |
|---|---|
| `interval_hours` | Hours between two scrubs. [168, a week] |
| `disabled` | Turn the periodic scrub off. `robinmail scrub` still works. [false] |

## `dev`

For development and the test lab. Not in the example config, and not for a real
installation.

| Field | What it sets |
|---|---|
| `retry_seconds` | Replace the queue's retry schedule with this fixed wait. `serve` warns at start. |
| `smtp_trace` | Log every SMTP command and reply, without message content and credentials. |
| `imap_trace` | Log every IMAP command and tagged reply, without literals and login arguments. |
