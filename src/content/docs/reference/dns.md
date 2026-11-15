---
title: DNS records
description: What robinmail dns prints for a domain, and what to do with it.
---

```bash
robinmail -config robinmail.json dns example.org example.org.robinmail.key
```

prints the records a domain needs, in zone file format, with the config's `hostname` as
the mail server. It changes nothing in DNS.

## What it prints

| Record | Name | Value |
|---|---|---|
| MX | `example.org.` | `10 <hostname>.` |
| SPF | `example.org.` TXT | `v=spf1 a:<hostname> -all` |
| DKIM | `robinmail._domainkey.example.org.` TXT | `v=DKIM1; k=rsa; p=...` |
| DMARC | `_dmarc.example.org.` TXT | `v=DMARC1; p=quarantine; rua=mailto:postmaster@example.org` |
| MTA-STS | `_mta-sts.example.org.` TXT and `mta-sts.example.org.` CNAME | `v=STSv1; id=...`, and the policy as a comment |
| TLS-RPT | `_smtp._tls.example.org.` TXT | `v=TLSRPTv1; rua=mailto:postmaster@example.org` |
| Autoconfig | `autoconfig.example.org.` CNAME | `<hostname>.` |
| SRV | `_imaps`, `_imap`, `_submissions`, `_submission`, `_jmap`, `_autodiscover` | the port of each listener; `0 0 0 .` for one that is off and for POP3 |
| SRV for DAV | `_caldavs._tcp`, `_carddavs._tcp` | the HTTPS port (`web.listen`); `0 0 0 .` for `_caldav` and `_carddav`, which would be plain HTTP |
| TXT for DAV | `_caldavs._tcp.example.org.`, `_carddavs._tcp.example.org.` | `path=/dav/` (RFC 6764); printed only when `web.listen` is set |

## DKIM

The DKIM selector is `robinmail`. The second argument names an RSA key file:

- If it does not exist, `dns` makes it and says so.
- Give that file to Rspamd as `<dkim dir>/example.org.robinmail.key`, readable by Rspamd
  only. Rspamd signs outgoing mail; robinmail does not.
- Without the argument, no DKIM record is printed.

In a cluster, every Rspamd needs the key file. They have to be copied by hand.

## MTA-STS

The MTA-STS records are printed only when `mta_sts.mode` is set in the config. The `id`
changes with the policy: print the records again after changing `mta_sts`.

robinmail serves the policy at `https://mta-sts.example.org/.well-known/mta-sts.txt`.
With certificate files, the certificate has to cover `mta-sts.example.org` and
`autoconfig.example.org` too.

## Before going live

- `<hostname>` needs an A or AAAA record and a PTR record that names it.
- `postmaster@example.org` has to exist, as a user or an alias. DMARC and TLS reports go
  there.
- Start with MTA-STS mode `testing` and DMARC `p=quarantine`. Move to `enforce` and
  `p=reject` when the reports are clean.

Not printed: CAA and TLSA records. robinmail does not check the live DNS of a domain
(issue [#21](https://github.com/robinmail/robinmail/issues/21)).
