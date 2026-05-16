# Design System

Reference doc. Check here when adding a new component.

All tokens are defined in `app/globals.css`. Never write hex values, rgba, or magic numbers inside a component — use a token.

---

## Colors

Components use only semantic tokens. Never reach into primitives (`--neutral-*`, `--neutral-d-*`) directly.

### Surfaces

| Token | Used for |
|---|---|
| `--color-canvas` | Infinite canvas background |
| `--color-surface` | Modals, sheets, panels |
| `--color-surface-raised` | Popovers, tooltips, floating buttons (+ `backdrop-blur-md`) |
| `--color-surface-raised-hover` | Floating button hover state |
| `--color-surface-sunken` | Segmented control track, kbd badge |
| `--color-surface-input` | Search / text inputs inside panels |
| `--color-surface-embed` | Link / image / twitter card body |
| `--color-surface-action` | Block hover-toolbar (constant across themes) |
| `--color-surface-note` | Yellow sticky-note background |
| `--color-surface-control-active` | Segmented control active pill |
| `--color-bg-hover` | List / menu row hover |
| `--color-bg-active` | List / menu row pressed |
| `--color-bg-hint` | Empty-state hint card |

### Text

| Token | Used for |
|---|---|
| `--color-text-primary` | Headlines, body |
| `--color-text-secondary` | Sub-labels, meta |
| `--color-text-tertiary` | Placeholders, icons |
| `--color-text-muted` | Disabled, timestamps |
| `--color-text-on-action` | Block hover-toolbar icons |
| `--color-text-note-placeholder` | Sticky-note placeholder copy |

### Borders

| Token | Used for |
|---|---|
| `--color-border-subtle` | Internal dividers |
| `--color-border-default` | Card / panel borders |
| `--color-border-strong` | Input borders |

### Overlays & Focus

| Token | Used for |
|---|---|
| `--color-overlay-modal` | Shortcuts modal backdrop |
| `--color-overlay-search` | Search modal backdrop |
| `--color-overlay-sheet` | Items sheet backdrop |
| `--color-ring-selection` | Selected block ring |
| `--color-grid-dot` | Canvas dot grid |
| `--color-marquee-border` | Marquee selection border |
| `--color-marquee-bg` | Marquee selection fill |

### Accent & Status

| Token | Used for |
|---|---|
| `--accent-blue-bg` | Comment button hover bg |
| `--danger` | Destructive action |
| `--danger-bg` | Destructive hover bg |
| `--brand-gradient` | Logo, brand accents |
| `--shadow-brand-logo` | Logo drop shadow |

---

## Shadows

| Token | Used for |
|---|---|
| `--shadow-float-sm` | Light-weight floating surfaces |
| `--shadow-float` | Floating buttons |
| `--shadow-float-hover` | Floating button hover |
| `--shadow-card` | Block cards |
| `--shadow-card-hover` | Block card hover / comment bubble |
| `--shadow-modal` | Menu panel, search modal |
| `--shadow-modal-lg` | Shortcuts modal |
| `--shadow-sheet` | Items sheet |

---

## Radius

| Token | px | Used for |
|---|---|---|
| `--radius-xs` | 1px | Tooltip arrow tip |
| `--radius-sm` | 4px | Kbd badge |
| `--radius-md` | 6px | Logo, small buttons |
| `--radius-lg` | 8px | Inputs, list rows |
| `--radius-xl` | 9px | Segmented control button |
| `--radius-2xl` | 11px | Segmented control track |
| `--radius-3xl` | 12px | Toolbar buttons |
| `--radius-4xl` | 16px | **Default** — popovers, cards, modals, panels |
| `--radius-5xl` | 20px | Oversized surfaces |
| `--radius-full` | 9999px | Pill buttons |

---

## Z-index

| Token | Value | Used for |
|---|---|---|
| `--z-base` | 1 | Default block |
| `--z-block-action` | 10 | Block hover-toolbar |
| `--z-comment-bubble` | 30 | Comment bubble |
| `--z-floating` | 50 | Tooltips, anchored popovers |
| `--z-block-selected` | 100 | Selected block |
| `--z-menu-panel` | 200 | Menu panel, search modal |
| `--z-items-sheet` | 250 | Items sheet |
| `--z-shortcuts` | 300 | Shortcuts modal |

---

## Sizing

| Token | Value | Used for |
|---|---|---|
| `--btn-float-size` | 36px | Free-floating action buttons (menu, items, shortcuts, zoom) |
| `--btn-toolbar-size` | 32px | Bottom toolbar buttons |
| `--btn-mode-size` | 28px | Pan / Select pill |
| `--input-height` | 32px | Search inputs inside panels |
| `--row-height` | 36px | Menu / sheet list rows |
| `--panel-width-menu` | 280px | Menu panel |
| `--panel-width-sheet` | 320px | Items sheet |
| `--panel-width-modal` | 480px | Search & shortcuts modal |
| `--popover-width` | 320px | Comments & add-input popover |

---

## Typography

| Token | Value | Used for |
|---|---|---|
| `--text-3xs` | 9px | Tooltip kbd |
| `--text-2xs` | 10px | Group labels, timestamps |
| `--text-xs` | 12px | Body, list items |
| `--text-sm` | 14px | Headings inside small surfaces |
| `--text-2xl` | 22px | App name display |

Don't write arbitrary values like `text-[11px]` or `text-[13px]` — round to the nearest scale value above.

---

## Motion

| Token | Value | Used for |
|---|---|---|
| `--duration-fast` | 100ms | Color transitions on hover |
| `--duration-base` | 150ms | Transform, shadow |
| `--duration-slow` | 300ms | Image zoom on hover |
| `--ease-out-soft` | `cubic-bezier(0.22,1,0.36,1)` | Modal / sheet entry |

Framer Motion spring configs (`stiffness`, `damping`) stay in component code.

---

## Component recipes

Which tokens to combine for each surface type.

### Floating button
`--btn-float-size` · `--radius-4xl` · `--color-surface-raised` + `backdrop-blur-md` · border `--color-border-default` · `--shadow-float` → hover `--shadow-float-hover` + `--color-surface-raised-hover` · icon `--color-text-tertiary` → hover `--color-text-secondary`

### Toolbar button
`--btn-toolbar-size` · `--radius-3xl` · transparent bg · icon `--color-text-tertiary` → hover bg `--color-bg-hover`, icon `--color-text-secondary`

### Tooltip
`--color-surface-raised` + `backdrop-blur-sm` · `--radius-lg` · border `--color-border-default` · `--shadow-float` · text `--text-xs` `--color-text-primary` · z `--z-floating`

### Popover
`--popover-width` · `--radius-4xl` · `--color-surface-raised` + `backdrop-blur-md` · border `--color-border-default` · `--shadow-modal` · z `--z-floating`

### Modal
`--panel-width-modal` · `--radius-4xl` · `--color-surface` · border `--color-border-default` · `--shadow-modal` · overlay `--color-overlay-search` + `backdrop-blur-md` · z `--z-menu-panel`

### Sheet
`--panel-width-sheet` anchored right · `--color-surface` · border-left `--color-border-default` · `--shadow-sheet` · overlay `--color-overlay-sheet` + `backdrop-blur-sm` · z `--z-items-sheet`

### Menu panel
`--panel-width-menu` · `--radius-4xl` · `--color-surface` · border `--color-border-default` · `--shadow-modal` · z `--z-menu-panel`

### List row
`--row-height` · padding-x `--space-panel-x` · hover bg `--color-bg-hover` · text `--color-text-primary` · icon `--color-text-tertiary`

### Block card
`--radius-4xl` · `--shadow-card` → hover `--shadow-card-hover` · selected: `ring-2` `--color-ring-selection` · z `--z-base` → selected `--z-block-selected`

### Block hover-toolbar
`--color-surface-action` (constant across themes) · `--radius-full` · icon `--color-text-on-action` · z `--z-block-action`

### Embed card
`--color-surface-embed` · radius inherited from block card (`overflow: hidden`)
