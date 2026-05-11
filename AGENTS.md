<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Architecture

## Feature-based structure

All application code lives under `app/features/`. Every feature is a folder that owns its component, constants, types, utils, and sub-components. Nothing bleeds into a neighbour's folder.

```
app/
  features/
    <feature>/
      <Feature>.tsx     ← default export, the main component
      constants.ts      ← exported consts (no logic)
      types.ts          ← exported TypeScript types/interfaces (no logic)
      utils.ts          ← exported pure functions (no React, no side effects)
      <SubComponent>.tsx ← named sub-components used only by this feature
      hooks/            ← custom hooks owned by this feature (one file per hook)
      renderers/        ← one file per variant when a feature has multiple render modes
  api/
    <route>/
      route.ts          ← Next.js route handler (stays here, not in features/)
  globals.css
  layout.tsx
  page.tsx
```

Current features:

| Folder | Owns |
|---|---|
| `canvas` | infinite pan/zoom viewport, block placement, keyboard shortcuts |
| `blocks` | draggable block container, all block renderers |
| `toolbar` | floating bottom toolbar, Tip tooltip, Btn/Sep primitives |
| `search` | ⌘K search modal |
| `add-input` | double-click URL/text popover |

---

## File roles

### `constants.ts`
- Only `export const` declarations.
- No functions, no imports from within the feature (only from `@/types` if needed).
- Named clearly enough to be self-documenting (`DRAG_THRESHOLD`, not `T`).

### `types.ts`
- Only `export type` / `export interface` declarations.
- No runtime code.
- Prefer keeping domain-wide types in the root `types.ts`; put feature-local types here.

### `utils.ts`
- Pure functions only — no React hooks, no `useState`, no side effects.
- Every function must be exported (tree-shakeable).
- Add a one-line TSDoc (`/** ... */`) to every exported function.

### `<Feature>.tsx` (main component)
- Imports constants, types, and utils from siblings — never re-declares them inline.
- Contains only component logic (hooks, handlers, JSX).
- Add a one-line TSDoc above the `export default function`.

### `<SubComponent>.tsx`
- Create a separate file when a sub-component has its own props interface, local state, or is longer than ~30 lines.
- Small presentational components that are a few lines (e.g. a divider) can share a file.

### `hooks/`
- One file per custom hook (`use<Name>.ts`).
- Hooks must be owned by one feature — no cross-feature hook imports. If two features need the same hook, extract it to a shared location (e.g. a small inline copy for tiny primitives).
- Every exported hook gets a one-line TSDoc.

### `renderers/`
- One file per render variant. Use when a parent component switches on a discriminated union type.
- Each renderer receives only the specific block type it renders, not the union.

---

## Rules

1. **No cross-feature imports.** Features must not import from each other's internals. If two features share something, it belongs in the root `types.ts` or a new shared utility.

2. **No magic numbers in component files.** All numeric literals with non-obvious meaning go in `constants.ts`.

3. **No inline type declarations in component files.** Anything beyond a one-liner prop type goes in `types.ts`.

4. **No logic in `constants.ts` or `types.ts`.** If it has a function body, it goes in `utils.ts`.

5. **TSDoc on every export.** One line is enough. Skip only when the name is completely self-evident (e.g. `export const MIN_SCALE = 0.1`).

6. **Group props when there are more than ~5.** Use `status`/`actions` (or similar named bags) instead of a flat list of unrelated props. Memoize the bags with `useMemo` so referential stability is preserved for `memo`-wrapped children.

7. **Extract custom hooks for distinct concerns.** When a component has more than ~4 `useState`/`useRef` pairs or multiple `useEffect` blocks, split each logical concern into its own hook under `hooks/`. The main component should read like an orchestrator, not an implementation.

---

## Adding a new feature

1. Create `app/features/<name>/`.
2. Start with a single `<Name>.tsx`. Split into `constants.ts`, `types.ts`, `utils.ts` as soon as any of those categories have more than one item.
3. Wire it into the canvas or page — don't create a new top-level route unless it truly needs one.
4. Do not create an `index.ts` barrel — import the file directly (`'../toolbar/Toolbar'`, not `'../toolbar'`).
5. If the component grows beyond ~4 state/ref pairs or has multiple distinct concerns, add a `hooks/` subfolder and extract each concern into its own `use<Name>.ts`.

## Adding a new block type

1. Add the TypeScript interface to root `types.ts` and add it to the `Block` union.
2. Create `app/features/blocks/renderers/<Type>Embed.tsx` (or `<Type>Note.tsx` for text-like).
3. Add a case in `app/features/blocks/Block.tsx` to render it.
4. Add dimensions to `BLOCK_SIZES` in `app/features/canvas/constants.ts`.
5. Add detection logic in `app/features/canvas/utils.ts` (`detectType`, and an extractor if needed).
6. Add a label to `TYPE_LABELS` in `app/features/search/SearchModal.tsx`.
