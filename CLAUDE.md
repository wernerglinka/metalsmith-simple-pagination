# metalsmith-simple-pagination - Development Context

This file gives Claude operational context for working in this plugin. Plugin
behavior is documented in [README.md](README.md) and the architecture
rationale in [docs/THEORY.md](docs/THEORY.md) — don't duplicate them here.

## Project Overview

Paginates a collection of files (e.g. blog posts) into numbered pages and emits
pagination metadata compatible with metalsmith-pagination. Page one annotates
an existing `firstIndexFile`; later pages get generated index files. When
`usePermalinks` is true, content files are moved to `dir/post/index.ext`
(extensionless URLs); when false, files keep their paths and only gain
pagination fields. Logic is split across `src/utils/` (options, fileProcessing,
pageProcessing, helpers).

ESM-only Metalsmith plugin, published directly from `src/` (no build step),
targeting Node.js 22+. CommonJS consumers can still `require()` it via
Node 22's stable `require(esm)` support. It has no runtime dependencies.

## MCP Server Integration (CRITICAL)

**IMPORTANT**: This plugin was created with `metalsmith-plugin-mcp-server`.
When working on this plugin, AI assistants (Claude) MUST use the MCP server
tools rather than improvising equivalents.

### Essential MCP Commands

```bash
list-templates                          # See what's available
get-template plugin/CLAUDE.md           # Retrieve exact template content
get-template configs/biome.json
get-template configs/release-it.json
validate .                              # Plugin validation + recommendations
diff-template .                         # Drift check vs current scaffold
configs .                               # Generate config files
show-template release-it                # Reference config templates
update-deps .                           # Dependency update
```

### CRITICAL RULES for AI Assistants

1. **Use MCP server templates verbatim** — never paraphrase or "simplify"
2. **Run `list-templates` before guessing** at template names
3. **When `validate` produces a recommendation, copy it exactly** — including
   the exact command suggested
4. **Ask the user** before modifying `.release-it.json`, `package.json`,
   `biome.json`, or any other `.json` / `.yml` / `.config.js` file
5. **Never set `npm.publish` to `true`** in `.release-it.json` — releases
   here are deliberately manual

## Plugin Development Rules

### Use Metalsmith's native methods

Prefer the methods Metalsmith provides on the instance over external
packages:

```javascript
// ❌                                    // ✅
require('debug')('')                     metalsmith.debug('')
require('minimatch')(file, pattern)      metalsmith.match(pattern, file)
process.env.NODE_ENV                     metalsmith.env('NODE_ENV')
path.join(dir, file)                     metalsmith.path(file)
```

The validator flags external packages when a native method exists.

### Never mock Metalsmith in tests

Use a real `Metalsmith` instance. Metalsmith is in `devDependencies` for
exactly this reason. Mocking `metalsmith()`, `metalsmith.match`,
`metalsmith.debug`, `metalsmith.env`, `metalsmith.path`, or plugin invocation
has repeatedly hidden integration bugs that only surfaced in production. The
tests here build in-memory `files` objects but pass a real `Metalsmith`
instance (`Metalsmith('/tmp').metadata({})`) so `metalsmith.debug()` and
`metalsmith.metadata()` are genuine.

Mocking unrelated systems (network, non-Metalsmith fs concerns) is fine.

### Metalsmith goes in devDependencies, never peerDependencies

The plugin code itself never imports Metalsmith — it receives the instance
as a parameter. Tests import Metalsmith directly. Users have their own
Metalsmith install in their project.

## Pre-commit workflow

Before any commit or release, run in order:

```bash
npm run lint       # Biome: lint + format with autofix
npm run format     # Format only
npm test           # node:test runner against src/
```

If any step fails, fix the underlying issue and re-run. Don't skip hooks.

## Release commands

Only after the pre-commit workflow succeeds:

```bash
npm run release:patch   # Bug fix (1.0.0 → 1.0.1)
npm run release:minor   # New feature, backwards-compatible (1.0.0 → 1.1.0)
npm run release:major   # Breaking change (1.0.0 → 2.0.0)
```

This plugin is now at 1.0+, so standard semver applies: breaking changes are
major releases.

Releases use `./scripts/release.sh` which retrieves the GitHub token from
`gh auth token` and calls release-it. npm publishing is intentionally
manual.

## Before releasing: re-read the user-facing docs

Before any `npm run release:*`, read the user-facing docs end-to-end and
update anything that's drifted from current behavior. Drift goes unnoticed
during code-focused work, then ships, then needs a follow-up patch release
purely for docs.

Files to audit:

- [README.md](README.md) — installation, usage examples, options, badges
- [docs/THEORY.md](docs/THEORY.md) — architecture and design rationale

Specific things to grep for: option names and defaults (`directory`, `perPage`,
`sortBy`, `reverse`, `outputDir`, `indexLayout`, `firstIndexFile`,
`usePermalinks`) that no longer match `src/`, code examples that import removed
exports, "What's New" callouts referencing past releases, broken links to
renamed sections. Note the top-of-file JSDoc in `src/index.js` understates
behavior (the plugin does move content files when `usePermalinks` is true).

If the change being released doesn't affect any user-visible surface, say so
explicitly when reporting the audit — don't claim drift you didn't find. But
default to reading.

## File organization

```
/
├── src/
│   ├── index.js              # Plugin entry — normalize, sort, chunk, paginate
│   └── utils/                # options, fileProcessing, pageProcessing, helpers
├── test/
│   ├── index.test.js         # node:test against src/ directly
│   └── fixtures/             # basic, options
├── docs/
│   └── THEORY.md             # Architecture + invariants
└── .github/
    ├── workflows/            # test.yml, test-matrix.yml, claude-code.yml
    └── dependabot.yml
```

## Tooling

- **Biome** for lint + format (single tool, single config: `biome.json`)
- **node:test** + `node:assert/strict` for testing
- **Native coverage** via `node --test --experimental-test-coverage`
- **Node >= 22** required

## When validation flags something

The MCP server's `validate` tool can return:

- `failed` — must-fix (license missing, wrong package shape)
- `warnings` — quality concern (low coverage, stub THEORY.md)
- `recommendations` — optional with exact command to run

Implement recommendations as written. The validator catches real maintainer
feedback patterns (marketing language, hardcoded values that should be
options, CJS examples in ESM-only plugins, performance anti-patterns,
English-only output strings). Run `validate .` and copy the suggested fixes.
