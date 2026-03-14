#!/usr/bin/env node

/**
 * One-time script: extracts metadata from existing animation HTML files
 * into JSON data files for the template system.
 *
 * Run once, then delete this file.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const ANIMATIONS_DIR = path.join(ROOT, 'animations');

const categories = [
  'sorting-algorithms',
  'data-structures',
  'search-algorithms',
  'graph-algorithms',
  'dynamic-programming',
  'neural-networks',
];

function extractBetween(html, startTag, endTag) {
  var si = html.indexOf(startTag);
  if (si === -1) return '';
  si += startTag.length;
  var ei = html.indexOf(endTag, si);
  if (ei === -1) return '';
  return html.substring(si, ei);
}

function extractText(html, startTag, endTag) {
  return extractBetween(html, startTag, endTag).trim();
}

function parseControls(html) {
  var controlsSection = extractBetween(html, '<div class="controls">', '</div>\n\n') ||
                         extractBetween(html, '<div class="controls">', '</div>\n    <div class="info-panel">');
  if (!controlsSection) {
    // Fallback: find controls div
    var ci = html.indexOf('<div class="controls">');
    if (ci === -1) return [];
    var ce = html.indexOf('</div>', ci);
    controlsSection = html.substring(ci, ce);
  }

  var controls = [];
  var lines = controlsSection.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    // Button
    var btnMatch = line.match(/<button\s+class="([^"]+)"\s+id="([^"]+)"[^>]*>(.*?)<\/button>/);
    if (btnMatch) {
      var cls = btnMatch[1];
      var id = btnMatch[2];
      var label = btnMatch[3];

      if (id === 'btnSound') {
        controls.push({ type: 'sound-button' });
        continue;
      }

      var ctrl = { type: 'button', id: id, label: label };
      if (cls.includes('--primary')) ctrl.primary = true;
      controls.push(ctrl);
      continue;
    }

    // Separator
    if (line.includes('controls__separator')) {
      controls.push({ type: 'separator' });
      continue;
    }

    // Slider (label on previous line or same scope)
    var sliderMatch = line.match(/<input\s+type="range"\s+class="controls__slider"\s+id="([^"]+)"\s+min="([^"]+)"\s+max="([^"]+)"\s+value="([^"]+)">/);
    if (sliderMatch) {
      var sliderId = sliderMatch[1];
      var min = sliderMatch[2];
      var max = sliderMatch[3];
      var value = sliderMatch[4];

      // Look for label on previous line
      var sliderLabel = 'Speed';
      for (var j = i - 1; j >= Math.max(0, i - 3); j--) {
        var lm = lines[j].match(/controls__label[^>]*>([^<]+)/);
        if (lm) {
          sliderLabel = lm[1];
          break;
        }
      }

      controls.push({
        type: 'slider',
        id: sliderId,
        label: sliderLabel,
        min: parseInt(min),
        max: parseInt(max),
        value: parseInt(value)
      });
      continue;
    }

    // Label line (consumed by slider above, skip)
    if (line.includes('controls__label')) continue;
  }

  return controls;
}

function parseComplexity(html) {
  var infoBlocks = html.split('info-block__title');
  var complexityBlock = '';
  for (var i = 0; i < infoBlocks.length; i++) {
    if (infoBlocks[i].includes('Complexity')) {
      complexityBlock = infoBlocks[i];
      break;
    }
  }

  if (!complexityBlock) return { lines: [], note: '' };

  var contentStart = complexityBlock.indexOf('info-block__content');
  if (contentStart === -1) return { lines: [], note: '' };
  var content = complexityBlock.substring(contentStart);

  var lines = [];
  var note = '';

  // Extract <p> tags
  var pRegex = /<p([^>]*)>(.*?)<\/p>/gs;
  var match;
  while ((match = pRegex.exec(content)) !== null) {
    var attrs = match[1];
    var text = match[2].trim();
    if (attrs.includes('margin-top') || attrs.includes('text-muted')) {
      note = text;
    } else {
      lines.push(text);
    }
  }

  return { lines: lines, note: note };
}

function parseSteps(html) {
  var infoBlocks = html.split('info-block__title');
  var stepsBlock = '';
  for (var i = 0; i < infoBlocks.length; i++) {
    if (infoBlocks[i].includes('How It Works')) {
      stepsBlock = infoBlocks[i];
      break;
    }
  }

  if (!stepsBlock) return [];

  var steps = [];
  var stepRegex = /<span class="step-num">\d+<\/span>\s*(.*?)<\/div>/g;
  var match;
  while ((match = stepRegex.exec(stepsBlock)) !== null) {
    steps.push(match[1].trim());
  }

  return steps;
}

function parseScripts(html) {
  var shared = [];
  var animation = '';

  // Find all script src tags
  var srcRegex = /<script\s+src="([^"]+)"[^>]*><\/script>/g;
  var match;
  while ((match = srcRegex.exec(html)) !== null) {
    var src = match[1];
    if (src.includes('lofi-music')) continue; // handled by template
    if (src.startsWith('../../js/')) {
      shared.push(src.replace('../../js/', '').replace('.js', ''));
    } else if (!src.startsWith('http')) {
      animation = src;
    }
  }

  // If no external animation script found, the file still has inline script
  // Use the animation id as the expected script name
  return { shared: shared, animation: animation };
}

// ── Main ─────────────────────────────────────────────────────────

var categoriesData = [];

for (var ci = 0; ci < categories.length; ci++) {
  var categoryId = categories[ci];
  var categoryDir = path.join(ANIMATIONS_DIR, categoryId);

  if (!fs.existsSync(categoryDir)) continue;

  // Parse category index page
  var indexPath = path.join(categoryDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    var indexHtml = fs.readFileSync(indexPath, 'utf8');
    var catTitle = extractText(indexHtml, '<h1 class="category-hero__title">', '</h1>');
    var catDesc = extractText(indexHtml, '<p class="category-hero__desc">', '</p>');
    categoriesData.push({
      id: categoryId,
      title: catTitle,
      description: catDesc
    });
  }

  // Parse animation pages
  var htmlFiles = fs.readdirSync(categoryDir)
    .filter(function (f) { return f.endsWith('.html') && f !== 'index.html'; });

  var outDir = path.join(DATA_DIR, categoryId);
  fs.mkdirSync(outDir, { recursive: true });

  for (var fi = 0; fi < htmlFiles.length; fi++) {
    var fileName = htmlFiles[fi];
    var animId = fileName.replace('.html', '');
    var filePath = path.join(categoryDir, fileName);
    var html = fs.readFileSync(filePath, 'utf8');

    var title = extractText(html, '<h1 class="animation-page__title">', '</h1>');
    var pageTitle = extractText(html, '<title>', '</title>');
    var subtitle = extractText(html, '<p class="animation-page__subtitle">', '</p>');

    var controls = parseControls(html);
    var complexity = parseComplexity(html);
    var steps = parseSteps(html);
    var scripts = parseScripts(html);

    // If animation script not yet extracted, set expected name
    if (!scripts.animation) {
      scripts.animation = animId + '.js';
    }

    var data = {
      id: animId,
      categoryId: categoryId,
      title: title,
      pageTitle: pageTitle,
      subtitle: subtitle,
      scripts: scripts,
      controls: controls,
      complexity: complexity.lines,
      complexityNote: complexity.note || undefined,
      steps: steps
    };

    // Remove undefined fields for clean JSON
    var cleaned = JSON.parse(JSON.stringify(data));

    var outPath = path.join(outDir, animId + '.json');
    fs.writeFileSync(outPath, JSON.stringify(cleaned, null, 2) + '\n');
    console.log('  extracted: ' + path.relative(ROOT, outPath));
  }
}

// Write categories.json
var catPath = path.join(DATA_DIR, 'categories.json');
fs.writeFileSync(catPath, JSON.stringify(categoriesData, null, 2) + '\n');
console.log('  extracted: ' + path.relative(ROOT, catPath));

console.log('\nDone — extracted metadata for ' + categories.length + ' categories.');
