# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive CS algorithm visualizations built with zero runtime dependencies — pure HTML5, CSS3, and vanilla JavaScript. Canvas-based animations with step-through controls. HTML pages are generated from templates via a zero-dependency Node.js build script.

## Architecture

**Data flow:** `js/categories.js` (single source of truth) → rendered by `js/home.js` (homepage cards) and `js/category-page.js` (category listing pages) → individual animation pages are generated HTML files loading external JS scripts.

**Build flow:** `build/data/{category}/{animation}.json` (metadata) + `build/templates/*.html` (templates) → `node build/generate.js` → `animations/{category}/{animation}.html` (generated output). Animation logic lives in `animations/{category}/{animation}.js`.

**Navigation hierarchy:** Homepage → Category listing → Animation page (breadcrumbs on all pages).

**Key files:**
- `js/categories.js` — `CATEGORIES` array defining all categories, their animations, and statuses (`'ready'` or `'coming'`)
- `css/styles.css` — entire design system: CSS custom properties for colors, typography, layout, and all component styles
- `js/colors.js` — `AppColors` shared color constants (mirrors CSS custom properties for canvas use)
- `js/canvas-utils.js` — `CanvasUtils` shared canvas drawing utilities (roundedRect, drawBlock, drawNode, glow helpers, easing)
- `js/animation-engine.js` — `AnimationEngine` shared orchestration (canvas setup, playback state machine, control wiring)
- `js/bar-renderer.js` — `BarRenderer` bar-chart rendering for sorting/search animations
- `animations/sorting-algorithms/bubble-sort.html` — reference implementation for all future animations

## Design System

Syntax-highlighting color palette mapped to categories:
- `--syn-number` (gold) → Sorting, `--syn-function` (rose) → Data Structures, `--syn-string` (teal) → Search, `--syn-keyword` (purple) → Graphs, `--syn-comment` (muted) → DP, `--syn-type` (coral) → Neural Networks

Typography: JetBrains Mono (code/labels), Space Grotesk (body), Instrument Serif (headings). All from Google Fonts.

## Adding a New Animation

1. Add entry to the appropriate category in `js/categories.js` with `status: 'ready'`
2. Create `build/data/{category-id}/{animation-id}.json` with metadata (title, subtitle, controls, complexity, steps)
3. Create `animations/{category-id}/{animation-id}.js` with the animation logic (IIFE-wrapped)
4. Run `node build/generate.js` to generate the HTML page
5. Use `bubble-sort.js` as the reference — it demonstrates all patterns:
   - IIFE-wrapped script (no global scope pollution)
   - **Step queue pattern**: pre-compute all algorithm steps as data objects, then execute them one-by-one with `async/await`
   - Canvas rendering with DPI scaling (handled by `AnimationEngine`)
   - Use `var COLORS = AppColors;` (from `js/colors.js`) — never redefine color constants locally
   - Use `CanvasUtils.drawBlock()` for rounded rectangles, `CanvasUtils.drawNode()` for graph/tree nodes
   - Use `CanvasUtils.easeInOutCubic()` for smooth value interpolation

**Do NOT hand-edit generated HTML files** — edit the JSON data or template instead, then re-run the generator.

## Conventions

- All IDs use kebab-case (`bubble-sort`, `sorting-algorithms`)
- CSS follows BEM with double underscores (`.category-card__icon`)
- Category index pages use `data-category` attribute on the grid element to identify which category to render
- Animation logic lives in external `.js` files (one per animation), loaded by the generated HTML
- Use `AppColors` for colors, `CanvasUtils` for canvas drawing, `BarRenderer` for bar charts — never duplicate these utilities
- HTML files in `animations/` are generated — edit `build/data/` JSON or `build/templates/` instead
