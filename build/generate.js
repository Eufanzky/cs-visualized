#!/usr/bin/env node

/**
 * Static site generator for CS Animations.
 * Generates animation HTML pages and category index pages from
 * JSON data files and HTML templates. Zero npm dependencies.
 *
 * Usage:
 *   node build/generate.js          # Generate all pages
 *   node build/generate.js --check  # Verify generated files match (dry run)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DATA_DIR = path.join(__dirname, 'data');

const dryRun = process.argv.includes('--check');
let generated = 0;
let mismatches = 0;

// ── Templates ────────────────────────────────────────────────────

const animationTemplate = fs.readFileSync(
  path.join(TEMPLATES_DIR, 'animation-page.html'), 'utf8'
);
const categoryTemplate = fs.readFileSync(
  path.join(TEMPLATES_DIR, 'category-index.html'), 'utf8'
);

// ── Simple template renderer ─────────────────────────────────────

function render(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, function (match, key) {
    return data[key] !== undefined ? data[key] : match;
  });
}

// ── Control rendering ────────────────────────────────────────────

function renderControl(ctrl) {
  switch (ctrl.type) {
    case 'button': {
      var cls = 'controls__btn';
      if (ctrl.primary) cls += ' controls__btn--primary';
      return '      <button class="' + cls + '" id="' + ctrl.id + '">' + ctrl.label + '</button>';
    }
    case 'separator':
      return '      <div class="controls__separator"></div>';
    case 'slider':
      return '      <span class="controls__label">' + ctrl.label + '</span>\n' +
             '      <input type="range" class="controls__slider" id="' + ctrl.id +
             '" min="' + ctrl.min + '" max="' + ctrl.max + '" value="' + ctrl.value + '">';
    case 'sound-button':
      return '      <button class="controls__btn controls__btn--sound" id="btnSound" title="Toggle sound">&#9834;</button>';
    default:
      return '';
  }
}

// ── Pre-render dynamic sections ──────────────────────────────────

function prepareAnimationData(data) {
  // Controls HTML
  data.controlsHtml = data.controls.map(renderControl).join('\n');

  // Complexity HTML
  var lines = data.complexity.map(function (line) {
    return '          <p>' + line + '</p>';
  });
  if (data.complexityNote) {
    lines.push('          <p style="margin-top:0.75rem; color: var(--text-muted);">' + data.complexityNote + '</p>');
  }
  data.complexityHtml = lines.join('\n');

  // Steps HTML
  data.stepsHtml = data.steps.map(function (step, i) {
    var num = String(i + 1).padStart(2, '0');
    return '          <div class="step"><span class="step-num">' + num + '</span> ' + step + '</div>';
  }).join('\n');

  // Scripts HTML
  var scriptLines = data.scripts.shared.map(function (name) {
    return '  <script src="../../js/' + name + '.js"></script>';
  });
  scriptLines.push('  <script src="' + data.scripts.animation + '"></script>');
  data.scriptsHtml = scriptLines.join('\n');

  return data;
}

// ── Write or check a file ────────────────────────────────────────

function outputFile(filePath, content) {
  if (dryRun) {
    if (fs.existsSync(filePath)) {
      var existing = fs.readFileSync(filePath, 'utf8');
      if (existing !== content) {
        console.log('MISMATCH: ' + path.relative(ROOT, filePath));
        mismatches++;
      }
    } else {
      console.log('MISSING:  ' + path.relative(ROOT, filePath));
      mismatches++;
    }
  } else {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    console.log('  generated: ' + path.relative(ROOT, filePath));
  }
  generated++;
}

// ── Generate animation pages ─────────────────────────────────────

var categories = fs.readdirSync(DATA_DIR).filter(function (f) {
  var stat = fs.statSync(path.join(DATA_DIR, f));
  return stat.isDirectory();
});

for (var ci = 0; ci < categories.length; ci++) {
  var categoryDir = categories[ci];
  var dataPath = path.join(DATA_DIR, categoryDir);
  var files = fs.readdirSync(dataPath).filter(function (f) {
    return f.endsWith('.json');
  });

  for (var fi = 0; fi < files.length; fi++) {
    var raw = fs.readFileSync(path.join(dataPath, files[fi]), 'utf8');
    var data = JSON.parse(raw);
    prepareAnimationData(data);

    var html = render(animationTemplate, data);
    var outPath = path.join(ROOT, 'animations', data.categoryId, data.id + '.html');
    outputFile(outPath, html);
  }
}

// ── Generate category index pages ────────────────────────────────

var categoriesFile = path.join(DATA_DIR, 'categories.json');
if (fs.existsSync(categoriesFile)) {
  var cats = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
  for (var i = 0; i < cats.length; i++) {
    var cat = cats[i];
    var html = render(categoryTemplate, cat);
    var outPath = path.join(ROOT, 'animations', cat.id, 'index.html');
    outputFile(outPath, html);
  }
}

// ── Summary ──────────────────────────────────────────────────────

console.log('');
if (dryRun) {
  if (mismatches === 0) {
    console.log('OK — all ' + generated + ' files match.');
  } else {
    console.log('FAIL — ' + mismatches + ' of ' + generated + ' files differ.');
    process.exit(1);
  }
} else {
  console.log('Done — generated ' + generated + ' files.');
}
