---
title: Commands
description: Every robinmail command, from the binary's own usage text.
---

```
robinmail [-config robinmail.json] <command>
```

`robinmail` without a command prints the list. Every command reads the config and opens
the database, so it needs rqlite and the master key file. The exception is
`key generate`, which makes that file.

- A command has ten minutes. `backup`, `restore`, `restore-blobs`, `scrub`, `repair` and
  `reindex` have 24 hours.
- A `<mailbox>` is an id (`m1`), a role (`inbox`, `junk`) or a path (`Work/Invoices`).
- An `<email>` is an id (`e1`).

## The server

| Command | What it does |
|---|---|
| `serve` | Run the server until SIGINT or SIGTERM. |
| `status` | What the server holds, its queue and nodes, and the checks of `health`. |
| `health` | Check the database, the master key, the blob directory, the certificate, and whether the server answers. Exit status 1 when one fails. |

## Master key

| Command | What it does |
|---|---|
| `key generate` | Write a new master key to `master_key_file`. |
| `key status` | List the keys in the file and how many accounts use each. |
| `key add` | Add a new key to the file, accepted and not used yet. |
| `key rotate <fingerprint>` | Make that key the current one and wrap every account's key under it. |
| `key prune` | Take the keys no account uses out of the file. |

## Backup

| Command | What it does |
|---|---|
| `backup <directory>` | Write the database and all message files into a new directory. |
| `restore <directory>` | Load a backup into an empty database and this node's blob directory. |
| `restore-blobs <directory>` | Copy the message files of a backup that this node lacks, after a failed restore. |

A restore refuses a backup made under another master key, one without its manifest, one
with a changed database file, and a database that is not empty. There is no incremental
backup and no restore of one account.

## Domains and aliases

| Command | What it does |
|---|---|
| `domain add <domain>` | Accept mail for a domain. |
| `domain list` | List the accepted domains. |
| `domain remove <domain>` | Stop accepting mail for a domain that has no users. |
| `alias add <alias> <target>...` | Deliver mail for an alias to accounts here, or forward it elsewhere. An alias is an address, a pattern (`sales-*@example.org`) or `@example.org`. |
| `alias list [domain]` | List the aliases. |
| `alias remove <alias> [target]` | Remove one target of an alias, or the alias. |

## Users

| Command | What it does |
|---|---|
| `user add <address>` | Create a user. The password comes from the prompt or stdin. |
| `user list` | List users. |
| `user show <address>` | Show a user's account: mail, quota, ways in, aliases. |
| `user remove <address> --yes` | Delete a user with all mail. It cannot be undone. |
| `user password <address>` | Set a new password. Ends the user's sessions. |
| `user quota <address> [<storage> <messages>]` | Show a user's quota and use, or set the limits: octets (with `K`, `M` or `G`) and messages; `none` for no limit, `default` for the config's default. |
| `user totp-disable <address>` | Turn TOTP off for a user who lost the authenticator. |
| `user app-passwords <address>` | List a user's app passwords. |
| `user app-password-revoke <address> <id>` | Revoke one. Its open IMAP sessions end. |
| `user sessions <address>` | List a user's web sessions. |
| `user session-revoke <address> <id\|all>` | End one web session, or all. |
| `user oidc-unlink <address>` | Forget the user's subject at the OIDC providers. |
| `audit [address\|all] [count]` | Show the newest auth events and what administrators did. [all, 50] |
| `quota recount [address]` | Count the mail of accounts again and correct their quota counters. |

## Outbound queue and TLS reports

| Command | What it does |
|---|---|
| `queue list [count]` | List outbound messages that still have work. [100] |
| `queue show <address> <id>` | Show one with its recipients. |
| `queue retry <address> <id>` or `queue retry all` | Try now instead of at the next try. |
| `queue delete <address> <id>` | Give a message up. No bounce is sent. |
| `tlsrpt results [days]` | How the TLS of outbound mail went, and the reports made for those days. [2] |
| `tlsrpt received [count]` | The TLS reports other servers sent us. [20] |
| `tlsrpt show <id>` | Print one of them. |

## Mailboxes and messages

| Command | What it does |
|---|---|
| `mailbox list <address>` | List a user's mailboxes. |
| `mailbox create <address> <path>` | Create a mailbox. |
| `mailbox rename <address> <mailbox> <name>` | Rename a mailbox. |
| `deliver <address> [mailbox]` | Store the message on stdin. [inbox] |
| `list <address> [mailbox]` | List the emails in a mailbox. [inbox] |
| `cat <address> <email>` | Print one message. |
| `move <address> <email> <from> <to>` | Move an email to another mailbox. |
| `label <address> <email> <mailbox>` | Also put an email in a mailbox. |
| `unlabel <address> <email> <mailbox>` | Take an email out of a mailbox. |
| `flag <address> <email> <keyword>...` | Set keywords such as `$seen`; `-keyword` removes one. |
| `rm <address> <email>` | Destroy an email. |
| `changes <address> [state]` | Show what changed since a state. [0] |
| `verify <address> [email]` | Check message files against their hashes. [all] |
| `reindex [address]` | Read stored messages again and refresh the cached columns and the search index. |

## Upkeep

`serve` runs these by itself. The commands run them once, by hand.

| Command | What it does |
|---|---|
| `trim` | Remove change log rows, delivery keys, sessions, login failure counters, auth events and the record of vacation replies past their time. `serve` trims a little more once a day: uploads, finished submissions, TLS report data and cached MTA-STS policies. |
| `sweep` | Remove this node's message files that no email refers to. |
| `repair` | Fetch the message files this node lacks from the other nodes. |
| `scrub` | Check this node's message files against their hashes. In a cluster, replace a corrupt one from another node. |
| `node list` | List the nodes of the cluster. |
| `node remove <id>` | Take a stopped node out of the cluster. |

## DNS

| Command | What it does |
|---|---|
| `dns <domain> [dkim-key-file]` | Print the DNS records of a domain. A key file that does not exist is made. |

See [DNS records](/robinmail-docs/reference/dns/).
