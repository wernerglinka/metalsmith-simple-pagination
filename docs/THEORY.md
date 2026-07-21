# Theory of Operation

This document explains how `metalsmith-simple-pagination` works and why it is
built the way it is. The README covers usage; this covers design.

## Problem

A blog or article collection needs to be split across numbered pages, and each
page needs the metadata to render navigation (page number, total pages,
next/previous/first/last URLs, and the list of items on that page). Doing this
by hand is tedious, and the emitted metadata needs to be compatible with what
templates already expect from `metalsmith-pagination` so existing layouts keep
working.

## Approach

The plugin runs as a build step over the in-memory files object. Its pipeline:

1. **Normalize options** (`utils/options.js`) into a fresh object with defaults.
2. **Filter and sort** (`utils/fileProcessing.js`) — select the files in the
   configured `directory` and order them by `sortBy` (supporting nested
   property paths like `post.date`), honoring `reverse`.
3. **Chunk** the sorted list into pages of `perPage` items.
4. **Process each page** (`utils/pageProcessing.js`):
   - For pages 2..N, create an index file at the `outputDir` pattern
     (`:directory/:num`) carrying the pagination metadata.
   - For page 1, attach pagination metadata to the configured `firstIndexFile`
     (e.g. `blog.md`) rather than creating a new index.
   - When `usePermalinks` is true, each content file is **moved** from
     `dir/post.md` to `dir/post/index.md` (permalink-style URLs). When false,
     files keep their original paths and only receive pagination fields.

Pagination URLs are shaped by `usePermalinks`: permalink mode yields
extensionless URLs like `/blog/2`; non-permalink mode yields `/blog/2.html`.

## Compatibility with metalsmith-pagination

The emitted `pagination` object mirrors the shape consuming templates expect —
`name`, `num`, `pages`, `files`, `next`, `previous`, `first`, `last` — plus a
`pageFiles` alias kept for backward compatibility. This is the plugin's real
contract: layouts read these fields, so their names and semantics must stay
stable across releases.

## Key decisions

- **First page is special.** Rather than emitting `dir/1/index.html`, page one
  updates an existing `firstIndexFile`. This keeps the collection's canonical
  landing page (e.g. `/blog/`) as the first page of results.
- **Permalink move is opt-in behavior, not always-on.** Whether content files
  are relocated depends entirely on `usePermalinks`; with it off, the plugin is
  purely additive (it only annotates files).
- **Sorting supports nested keys.** `sortBy` resolves dotted paths so posts can
  be ordered by `post.metadata.publishedAt` without a preprocessing step.
- **Decomposed utilities.** Option normalization, file filtering/moving, page
  processing, and URL/metadata helpers live in separate `utils/` modules so
  each is independently testable and `index.js` reads as a pipeline.

## Invariants and failure modes

- **Empty target directory is a no-op.** If no files match `directory`, the
  plugin logs and returns without creating pages.
- **Errors propagate.** The plugin body is wrapped in try/catch and routes any
  throw to `done(error)`.
- **Options are copied, not mutated.** Defaults merge into a fresh object per
  invocation; the caller's options object is never mutated.
- **Global metadata is preserved on index pages.** Site-level metadata is
  copied onto generated index pages so templates rendering those pages still
  see `siteName`, `siteUrl`, and similar globals.
