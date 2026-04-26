const fs = require('fs');
const path = require('path');

const file = path.resolve(process.cwd(), 'client/src/pages/elenchi.tsx');
let content = fs.readFileSync(file, 'utf8');

const importsBlockMatch = content.match(/import[\s\S]*?from "@shared\/schema";/);
const importsBlock = importsBlockMatch ? importsBlockMatch[0] : '';

const helpers = `
function isLightColor(hex) {
  const c = hex.replace("#", "");
  if (c.length !== 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

function getColorStyle(color) {
  if (!color) return {};
  return {
    backgroundColor: color,
    borderColor: color,
    color: isLightColor(color) ? "#000" : "#fff",
  };
}

function ColorBadge({ name, color, className = "" }) {
  if (color) {
    return (
      <Badge variant="outline" className={\`text-xs border \${className}\`} style={getColorStyle(color)}>
        {name}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={\`status-badge-gold text-xs \${className}\`}>
      {name}
    </Badge>
  );
}
`;

const simpleListSectionStringMatch = content.match(/interface SimpleListSectionProps[\s\S]*?function SimpleListSection\(\{ list, showColors \}: SimpleListSectionProps & \{ showColors\?: boolean \}\) \{[\s\S]*?<\/Card>\s*\n  \);\n}/);
let simpleListSection = simpleListSectionStringMatch ? simpleListSectionStringMatch[0] : '';

// Remove the bad tag
simpleListSection = simpleListSection.replace(
  /<input\s*type="color"\s*value=\{editingColor\}\s*onChange=\{e => setEditingColor\(e\.target\.value\)\}\s*className="h-8 w-10 cursor-pointer rounded border border-gray-300"\s*title="Scegli colore categoria"\s*\/>\}/g,
  '{showColors !== false && <input type="color" value={editingColor} onChange={e => setEditingColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-gray-300" title="Scegli colore categoria" /> }'
);

const mapsAndElenchiMatch = content.match(/const AREA_MAP[\s\S]*/);
const mapsAndElenchi = mapsAndElenchiMatch ? mapsAndElenchiMatch[0] : '';

const newContent = `${importsBlock}
import { getActiveActivities } from "@/config/activities";
${helpers}
${simpleListSection}

${mapsAndElenchi}`;

fs.writeFileSync(file, newContent);
console.log("Cleaned up elenchi.tsx");
