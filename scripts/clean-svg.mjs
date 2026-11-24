// Cleans an SVG before it ships: removes <metadata>, comments, editor data
// (inkscape:*, sodipodi:*, sketch:*, figma ids...) and turns style="..."
// into plain attributes, which the site's security policy requires.
//
// Use: node scripts/clean-svg.mjs path/to/drawing.svg > app/src/assets/mascot.svg

import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Use: node scripts/clean-svg.mjs input.svg > output.svg');
  process.exit(1);
}
let svg = readFileSync(file, 'utf8');

svg = svg
  .replace(/<\?xml[^>]*\?>/g, '')
  .replace(/<!DOCTYPE[^>]*>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
  .replace(/<(sodipodi|inkscape|sketch|rdf|cc|dc):[\w-]+[\s\S]*?(\/>|<\/\1:[\w-]+>)/g, '')
  .replace(/<title>[\s\S]*?<\/title>/gi, '')
  .replace(/<desc>[\s\S]*?<\/desc>/gi, '')
  .replace(/\s(xmlns:)?(sodipodi|inkscape|sketch|rdf|cc|dc|serif|figma|xlink:title|data-name)(:[\w-]+)?="[^"]*"/g, '')
  .replace(/\s(id|data-[\w-]+)="[^"]*"/g, (m, name) => (name === 'id' ? m : ''))
  .replace(/\sstyle="([^"]*)"/g, (_m, css) =>
    css
      .split(';')
      .map((rule) => rule.split(':').map((x) => x.trim()))
      .filter(([k, v]) => k && v && /^[a-z-]+$/.test(k))
      .map(([k, v]) => ` ${k}="${v.replace(/"/g, "'")}"`)
      .join(''),
  )
  .replace(/\n\s*\n/g, '\n')
  .trim();

process.stdout.write(svg + '\n');
