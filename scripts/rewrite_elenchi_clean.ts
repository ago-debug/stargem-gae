import * as fs from 'fs';
import * as path from 'path';

const file = path.join(__dirname, '../client/src/pages/elenchi.tsx');
let content = fs.readFileSync(file, 'utf8');

// The file currently has:
// 1. imports
// 2. helper functions (isLightColor, getColorStyle, ColorBadge)
// 3. EditableListSection
// 4. SimpleListSectionProps & SimpleListSection
// 5. AREA_MAP, USED_IN_MAP, isColoredList
// 6. Elenchi component

// We will keep imports, helper functions, SimpleListSection, maps, and Elenchi.
// We will remove EditableListSection completely.

// Let's just pull out the code we need using regex or substring.

const importsBlockMatch = content.match(/import[\s\S]*?from "@shared\/schema";/);
const importsBlock = importsBlockMatch ? importsBlockMatch[0] : '';

const helpers = `
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length !== 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

function getColorStyle(color: string | null | undefined): React.CSSProperties {
  if (!color) return {};
  return {
    backgroundColor: color,
    borderColor: color,
    color: isLightColor(color) ? "#000" : "#fff",
  };
}

function ColorBadge({ name, color, className = "" }: { name: string; color?: string | null; className?: string }) {
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

// fix the syntax errors in SimpleListSection
simpleListSection = simpleListSection.replace(
  /<input\s+type="color"\s+value=\{editingColor\}\s+onChange=\{e => setEditingColor\(e\.target\.value\)\}\s+className="h-8 w-10 cursor-pointer rounded border border-gray-300"\s+title="Scegli colore categoria"\s+\/>\}/g,
  '{showColors !== false && <input type="color" value={editingColor} onChange={e => setEditingColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-gray-300" title="Scegli colore categoria" /> }'
);

const mapsAndElenchiMatch = content.match(/const AREA_MAP[\s\S]*/);
const mapsAndElenchi = mapsAndElenchiMatch ? mapsAndElenchiMatch[0] : '';

const newContent = `${importsBlock}\n${helpers}\n${simpleListSection}\n\n${mapsAndElenchi}`;

fs.writeFileSync(file, newContent);
console.log("Cleaned up elenchi.tsx");
