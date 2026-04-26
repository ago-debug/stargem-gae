const fs = require('fs');
const path = require('path');

// =======================
// FIX B3: planning.tsx
// =======================
let filePlanning = path.join(__dirname, '../client/src/pages/planning.tsx');
let contentPlanning = fs.readFileSync(filePlanning, 'utf8');

contentPlanning = contentPlanning.replace(
  "const eStart = e.startDate?.split('T')[0];\n                const eEnd = (e.endDate || e.startDate)?.split('T')[0];",
  "if (!e.startDate) return false;\n                const eStart = format(new Date(e.startDate), 'yyyy-MM-dd');\n                const eEnd = format(new Date(e.endDate || e.startDate), 'yyyy-MM-dd');"
);
fs.writeFileSync(filePlanning, contentPlanning);

// =======================
// FIX 10c: CourseUnifiedModal.tsx
// =======================
let fileModal = path.join(__dirname, '../client/src/components/CourseUnifiedModal.tsx');
let contentModal = fs.readFileSync(fileModal, 'utf8');

contentModal = contentModal.replace(
  "const mergedTags = [...opStates.map(s => `STATE:${s}`), ...promoFlags.map(p => `PROMO:${p}`)];",
  "const mergedTags = Array.from(new Set([...opStates.map(s => `STATE:${s}`), ...promoFlags.map(p => `PROMO:${p}`)]));"
);
// replace globally (it appears twice)
contentModal = contentModal.replace(
  "const mergedTags = [...opStates.map(s => `STATE:${s}`), ...promoFlags.map(p => `PROMO:${p}`)];",
  "const mergedTags = Array.from(new Set([...opStates.map(s => `STATE:${s}`), ...promoFlags.map(p => `PROMO:${p}`)]));"
);
fs.writeFileSync(fileModal, contentModal);

