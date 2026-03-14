# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive CS algorithm visualizations built with Next.js, React, TypeScript, and Tailwind CSS. Canvas-based animations with step-through controls, lofi music, and sound effects. 31 animations across 6 categories with multiple visualization modes per algorithm.

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (next config + typescript)
npm test             # Jest (all tests)
npm run test:watch   # Jest in watch mode
npx jest __tests__/lib/algorithms/bubble-sort.test.ts  # Single test file

node build/generate.js   # Regenerate legacy HTML pages from templates
```

## Next.js App Architecture

**Routing:** `src/app/page.tsx` (homepage) → `src/app/category/[id]/page.tsx` (category listing) → `src/app/animation/[category]/[id]/page.tsx` (animation page).

**Data flow:**
- `src/lib/categories.ts` — `CATEGORIES` array: single source of truth for all categories, animations, and their statuses (`'ready'` | `'coming'`)
- `src/lib/algorithms/index.ts` — `ALGORITHMS` registry mapping algorithm IDs to metadata + step generator functions + renderer types
- `src/lib/animation-engine.ts` — core types (`AnimationState`, `AnimationStep`, `SceneState`) and state machine logic (`applyStep`, `reset`, `getSwapFrames`)
- `src/lib/renderers/index.ts` — `CanvasRenderer` type + registry mapping `RendererType` → draw function (`bar-chart`, `graph`, `tree`, `linear`, `hash-table`, `dp-grid`, `neuron`)
- `src/hooks/useAnimation.ts` — React hook wiring canvas ref, playback controls, and step execution

**Adding a new algorithm (Next.js):**
1. Create `src/lib/algorithms/{id}.ts` exporting a `StepGenerator` function
2. Register it in `src/lib/algorithms/index.ts` (`ALGORITHMS` record with metadata + `rendererType`)
3. Add entry to the matching category in `src/lib/categories.ts` with `status: 'ready'`
4. If a new renderer type is needed, create `src/lib/renderers/{type}.ts` and register in `src/lib/renderers/index.ts`

**Step generator pattern:** Each algorithm exports a function `(arr: number[]) => AnimationStep[] | StepResult` that pre-computes all visualization steps as data objects. Steps describe state transitions (compare, swap, set, highlight) that the engine applies frame-by-frame.

**Tests:** Jest + ts-jest + jsdom. Tests live in `__tests__/lib/algorithms/`. The `@/` path alias maps to `src/`.

## Legacy System Architecture

**Build flow:** `build/data/{category}/{animation}.json` (metadata) + `build/templates/*.html` → `node build/generate.js` → `animations/{category}/{animation}.html`. Animation logic in `animations/{category}/{animation}.js`.

**Key legacy files:**
- `js/categories.js` — `CATEGORIES` array (vanilla JS version)
- `js/colors.js` — `AppColors` shared color constants
- `js/canvas-utils.js` — `CanvasUtils` drawing utilities
- `js/animation-engine.js` — playback state machine
- `js/bar-renderer.js` — bar chart rendering

**Do NOT hand-edit generated HTML files** in `animations/` — edit `build/data/` JSON or `build/templates/` instead.

## Design System

Syntax-highlighting color palette mapped to categories:
- `--syn-number` (gold) → Sorting, `--syn-function` (rose) → Data Structures, `--syn-string` (teal) → Search, `--syn-keyword` (purple) → Graphs, `--syn-comment` (muted) → DP, `--syn-type` (coral) → Neural Networks

Typography: JetBrains Mono (code/labels), Space Grotesk (body), Instrument Serif (headings).

## Conventions

- All IDs use kebab-case (`bubble-sort`, `sorting-algorithms`)
- Legacy CSS follows BEM (`.category-card__icon`); Next.js uses Tailwind
- Animation logic is pure functions returning step arrays — no side effects, no DOM access
- Use existing renderers from `src/lib/renderers/` — never duplicate drawing logic
- Each algorithm is self-contained in its own file under `src/lib/algorithms/`
