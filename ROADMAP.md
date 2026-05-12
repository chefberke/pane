# Pane — Roadmap

Pane is an infinite canvas where you can drop links, media, and notes as draggable blocks. This document is a living list of near-term priorities — it gives order, not dates.

## Now (1–4 weeks)

**Goal:** Canvas should survive a page reload and feel smooth in daily use.

- **Persistence (localStorage):** Auto-save blocks, camera state (`x/y/scale`), and selection. Restore on load.
- **Undo / Redo:** For add, delete, move, and resize operations. `⌘Z` / `⌘⇧Z`.
- **Keyboard parity:** Shortcuts for all block actions (delete, duplicate, align); `?` opens a cheat-sheet.
- **Basic mobile/touch pan & zoom:** One-finger pan, two-finger zoom; drag works on touch too.
- **New block: Code / Markdown** (`code` block type). Syntax highlighting + editable.

## Next (1–3 months)

**Goal:** Move from a single canvas to multiple workspaces and richer content types.

- **Multiple canvases / workspaces:** Canvas list in a side panel — rename, delete, export.
- **Backend persistence + auth:** Blocks and canvases stored in a database. Magic-link or OAuth sign-in.
- **New block types:**
  - PDF embed (in-page viewer)
  - Audio (mp3 / Spotify)
  - Figma embed
  - File upload (drag & drop → blob storage)
- **Export / Import:** Canvas as JSON; PNG snapshot.
- **Search improvements:** Full-text search within block content, type filter, tags.

## Later

**Goal:** From single-user to sharing and collaboration.

- **Share links:** Read-only public canvas URLs.
- **Realtime collaboration:** Multi-cursor live editing via Yjs / Liveblocks.
- **Comments:** Threaded comments per block.
- **AI helpers:** Auto-tagging, "find similar content", canvas summarization.
- **⌘K command palette expansion:** Not just search — run actions too (new block, switch canvas, etc.).

## Acceptance Criteria (summary)

- Every feature must be added without breaking the feature-folder rules in `AGENTS.md`.
- Each new block type: added to the `types.ts` union, new file under `app/features/blocks/renderers/`, `BLOCK_SIZES`, `detectType`, and `TYPE_LABELS` updated.
- Once persistence is added, no fallback to the in-memory-only behavior — DB/localStorage is the single source of truth.
