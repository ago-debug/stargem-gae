const fs = require('fs');

let schema = fs.readFileSync('shared/schema.ts', 'utf-8');

// Modifica le colonne category_id
schema = schema.replace(/categoryId: int\("category_id"\)\.references\([^,]+,\s*\{\s*onDelete:\s*"set null"\s*\}\),?/g, 'categoryId: int("category_id"),');

// Rimuove gli imports di relazionali?
// In relations object, we have things like:
/*
  category: one(categories, {
    fields: [instructorRates.categoryId],
    references: [categories.id],
  }),
*/
const relationRegex = /^\s*category:\s*one\([^)]+\),\n/gm;
schema = schema.replace(relationRegex, '');

// Save
fs.writeFileSync('shared/schema.ts', schema, 'utf-8');
console.log("Schema updated for references and relations.");
