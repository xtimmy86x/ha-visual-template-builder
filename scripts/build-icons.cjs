/* Regenerate the icon list used by the panel's icon picker from @mdi/svg (npm run build:icons). */
const fs = require('node:fs');
const path = require('node:path');
const meta = require('@mdi/svg/meta.json');
const icons = meta.filter(icon => !icon.deprecated).sort((a, b) => a.name.localeCompare(b.name))
  .map(icon => icon.aliases.length ? [icon.name, ...icon.aliases] : icon.name);
const target = path.join(__dirname, '..', 'custom_components', 'visual_template_builder', 'frontend', 'mdi-icons.json');
fs.writeFileSync(target, JSON.stringify(icons) + '\n');
console.log(`Wrote ${icons.length} icons to ${path.relative(process.cwd(), target)}`);
