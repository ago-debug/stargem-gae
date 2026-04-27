const fs = require('fs');
const file = 'client/src/pages/calendar.tsx';
let content = fs.readFileSync(file, 'utf8');

const helper = `
function getContrastYIQ(hexcolor) {
    if (!hexcolor) return '#000000';
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c+c).join('');
    if (hexcolor.length !== 6) return '#000000';
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}
`;

if (!content.includes('getContrastYIQ')) {
    content = content.replace(
        /import \{ getStatusColor \} from "@\/components\/multi-select-status";/,
        `import { getStatusColor } from "@/components/multi-select-status";\n${helper}`
    );
}

// 1. activityBadge (FITNESS / CRS etc)
content = content.replace(
    /currentActType === "course"\s*\?\s*\{\s*backgroundColor:\s*'#f1f5f9',\s*color:\s*\(evt\.colorProps as any\)\.badgeColor \|\|\s*'#64748b'\s*\}\s*:\s*\{\s*backgroundColor:\s*'#f1f5f9',\s*color:\s*ACTIVITY_TYPE_COLORS\[currentActType\] \|\|\s*ACTIVITY_TYPE_COLORS\["course"\]\s*\}/,
    `currentActType === "course" 
        ? { backgroundColor: (evt.colorProps as any).badgeColor || '#64748b', color: getContrastYIQ((evt.colorProps as any).badgeColor || '#64748b') } 
        : { backgroundColor: ACTIVITY_TYPE_COLORS[currentActType] || ACTIVITY_TYPE_COLORS["course"], color: getContrastYIQ(ACTIVITY_TYPE_COLORS[currentActType] || ACTIVITY_TYPE_COLORS["course"]) }`
);

// 2. Status labels
content = content.replace(
    /style=\{color \? \{ backgroundColor: \`\$\{color\}15\`, color, border: \`0\.5px solid \$\{color\}40\` \} : \{ color: s === "ATTIVO" \? "#15803d" : "#b91c1c" \}\}/,
    `style={color ? { backgroundColor: color, color: getContrastYIQ(color), border: \`0.5px solid \${color}\` } : { backgroundColor: s === "ATTIVO" ? "#15803d" : "#b91c1c", color: "#ffffff", border: '0.5px solid transparent' }}`
);

// 3. Internal labels
content = content.replace(
    /style=\{color \? \{ backgroundColor: \`\$\{color\}15\`, color, border: \`0\.5px solid \$\{color\}40\` \} : \{ backgroundColor: '#e0e7ff', color: '#4338ca', border: '0\.5px solid #c7d2fe' \}\}/,
    `style={color ? { backgroundColor: color, color: getContrastYIQ(color), border: \`0.5px solid \${color}\` } : { backgroundColor: '#4338ca', color: '#ffffff', border: '0.5px solid #4338ca' }}`
);

fs.writeFileSync(file, content);
