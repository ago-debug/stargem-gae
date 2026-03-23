const fs = require('fs');
let code = fs.readFileSync('shared/schema.ts', 'utf8');

// Function to remove a table definition and its relations + schema + types
function removeTableBlock(tableName, varName) {
  // We'll use regex to strip out everything between `export const varName = mysqlTable(` and the `export type TypeName = ...`
  const regex = new RegExp(`// =+[\r\n]+//.*${tableName}.*[\r\n]+// =+[\r\n]+export const ${varName} = mysqlTable[\\s\\S]*?export type [A-Za-z0-9_]+ = typeof ${varName}\\.\\$inferSelect;`, 'gi');
  code = code.replace(regex, '');
  
  // Also try catching without the top comment banner just in case
  const regex2 = new RegExp(`export const ${varName} = mysqlTable[\\s\\S]*?export type [A-Za-z0-9_]+ = typeof ${varName}\\.\\$inferSelect;`, 'gi');
  code = code.replace(regex2, '');
}

// Remove main activity silos
removeTableBlock('PAID TRIALS', 'paidTrials');
removeTableBlock('FREE TRIALS', 'freeTrials');
removeTableBlock('SINGLE LESSONS', 'singleLessons');

// Remove their enrollments
removeTableBlock('PAID TRIAL ENROLLMENTS', 'paidTrialEnrollments');
removeTableBlock('FREE TRIAL ENROLLMENTS', 'freeTrialEnrollments');
removeTableBlock('SINGLE LESSON ENROLLMENTS', 'singleLessonEnrollments');

// Add participationType to main enrollments table
// Look for `status: varchar("status", ...).notNull().default("active"),`
code = code.replace(
  /status: varchar\("status", \{ length: 50 \}\)\.notNull\(\)\.default\("active"\),/g,
  'status: varchar("status", { length: 50 }).notNull().default("active"),\n  participationType: varchar("participation_type", { length: 50 }).default("iscrizione"), // iscrizione, prova_gratuita, prova_pagamento, lezione_singola'
);

// Also we need to clean up array of schema exports at the bottom if any.
// In Drizzle, usually exports are direct. 

fs.writeFileSync('shared/schema.ts', code);
console.log("Schema cleaned successfully!");
