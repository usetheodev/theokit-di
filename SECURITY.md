# Security Policy

## Supported versions

These packages are pre-1.0. Fixes land on the latest published version of each
package; there are no maintenance branches for older releases.

| Package | Supported |
| --- | --- |
| `@theokit/di` | latest release |
| `@theokit/di-agent` | latest release |
| `@theokit/orm` | latest release |

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report it privately through GitHub's [security advisory
form](https://github.com/usetheokit/theokit-di/security/advisories/new), or by
email to <admin@usetheo.dev> if you would rather not use GitHub.

What helps most, roughly in order:

- which package and version you tested, and the commit if you built from source
- what an attacker gets — read access, code execution, data loss, denial of service
- the smallest reproduction you can manage, and whether you have actually run it
- anything you are unsure about, said as such; a report with an honest "I could
  not confirm this part" is more useful than one that overstates

Please do not include credentials, tokens or personal data in the report.

## What to expect

We aim to acknowledge a report within three working days and to tell you what we
think of it — including if we think it is not a vulnerability, with the reasoning.
Something we can reproduce and consider exploitable gets a fix and an advisory
crediting you, unless you would rather not be named.

If you do not hear back within a week, assume the message went missing rather
than that it was ignored, and send it again.

## Scope

In scope: the three published packages, this repository's own release workflow,
and anything reachable from a package's public API.

Out of scope: vulnerabilities in dependencies that are already public and have an
upstream fix — report those upstream and, if it affects us, open a normal issue
pointing at the advisory.
