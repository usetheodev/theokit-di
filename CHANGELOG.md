# Changelog

Workspace-level changes for the `theokit-di` monorepo. Per-package changes live in each package's `CHANGELOG.md`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Extracted `@theokit/di`, `@theokit/di-agent`, `@theokit/orm` out of the `theokit-sdk` monorepo into this standalone repository (plan `monorepo-cohesion-split`, 2026-06-18), preserving full git history via `git filter-repo`. `@theokit/di-agent` now consumes `@theokit/sdk` as a published npm dependency (`^1.9.0`) instead of a workspace link. npm package names and versions are unchanged (`@theokit/di@0.1.1`, `@theokit/di-agent@0.2.0`, `@theokit/orm@0.1.0-next.1`).
