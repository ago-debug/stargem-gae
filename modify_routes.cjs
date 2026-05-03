const fs = require('fs');

let content = fs.readFileSync('server/routes.ts', 'utf8');

// Insert import
if (!content.includes('import { registerPaymentRoutes }')) {
    content = content.replace('import { log } from "./vite";', 'import { registerPaymentRoutes } from "./routes/payments";\nimport { log } from "./vite";');
}

// Insert register call
const callStr = '  registerPaymentRoutes(app, { checkPermission, logUserActivity });';
if (!content.includes(callStr)) {
    content = content.replace('  // ==========================================\n  // AGENTE AI', callStr + '\n\n  // ==========================================\n  // AGENTE AI');
}

// Remove blocks
// block 1: payment-methods
const regex1 = /\/\/ ==== Payment Methods Routes ====[\s\S]*?\/\/ ==== Payments Routes ====/;
content = content.replace(regex1, '// ==== Payments Routes ====');

// block 2: payments
const regex2 = /\/\/ ==== Payments Routes ====[\s\S]*?\/\/ ==== Public CRM Form ====/;
content = content.replace(regex2, '// ==== Public CRM Form ====');

// block 3: payment-notes
const regex3 = /\/\/ ==== Payment Notes Routes ====[\s\S]*?\/\/ ==== Enrollment Details Routes ====/;
content = content.replace(regex3, '// ==== Enrollment Details Routes ====');

fs.writeFileSync('server/routes.ts', content);
console.log("Modification complete.");
