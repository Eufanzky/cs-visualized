# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive CS algorithm visualizations built with zero dependencies — pure HTML5, CSS3, and vanilla JavaScript. Canvas-based animations with step-through controls. No build tools, no package manager.

## Architecture

**Data flow:** `js/categories.js` (single source of truth) → rendered by `js/home.js` (homepage cards) and `js/category-page.js` (category listing pages) → individual animation pages are self-contained HTML files with inline scripts.

**Navigation hierarchy:** Homepage → Category listing → Animation page (breadcrumbs on all pages).

**Key files:**
- `js/categories.js` — `CATEGORIES` array defining all categories, their animations, and statuses (`'ready'` or `'coming'`)
- `css/styles.css` — entire design system: CSS custom properties for colors, typography, layout, and all component styles
- `animations/sorting-algorithms/bubble-sort.html` — reference implementation for all future animations

## Design System

Syntax-highlighting color palette mapped to categories:
- `--syn-number` (gold) → Sorting, `--syn-function` (rose) → Data Structures, `--syn-string` (teal) → Search, `--syn-keyword` (purple) → Graphs, `--syn-comment` (muted) → DP, `--syn-type` (coral) → Neural Networks

Typography: JetBrains Mono (code/labels), Space Grotesk (body), Instrument Serif (headings). All from Google Fonts.

## Adding a New Animation

1. Add entry to the appropriate category in `js/categories.js` with `status: 'ready'`
2. Create `animations/{category-id}/{animation-id}.html`
3. Use `bubble-sort.html` as the template — it demonstrates all patterns:
   - IIFE-wrapped inline script (no global scope pollution)
   - **Step queue pattern**: pre-compute all algorithm steps as data objects, then execute them one-by-one with `async/await`
   - Canvas rendering with DPI scaling (`canvas.width = container.clientWidth * dpr`)
   - Standard controls: Play/Pause, Step, Reset, Speed slider, Size slider
   - Color states: comparing (purple `#c4a7e7`), swapping (gold `#f6c177`), sorted (green `#a6da95`)
   - `easeInOutCubic` for smooth value interpolation during swaps

## Conventions

- All IDs use kebab-case (`bubble-sort`, `sorting-algorithms`)
- CSS follows BEM with double underscores (`.category-card__icon`)
- Category index pages use `data-category` attribute on the grid element to identify which category to render
- Animation pages link to `../../css/styles.css` and keep all logic inline — no external JS dependencies per animation
