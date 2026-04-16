import fs from 'fs';
import path from 'path';

const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

// 1. Fix imports
content = content.replace(
  /payments,\s*members,\s*users,\s*teamNotifications\s*}\s*from\s*["']@shared\/schema["'];/,
  'payments, members, users, notifications } from "@shared/schema";'
);

// 2. Fix notifications table usages
content = content.replace(/db\.insert\(teamNotifications\)/g, 'db.insert(notifications)');

// 3. Fix membership properties in memberContext assignments
content = content.replace(/cardStatus:\s*memberRecord\?\.membershipStatus/g, 'cardStatus: memberRecord?.active ? "Attiva" : "Inattiva"');
content = content.replace(/cardExpiry:\s*memberRecord\?\.membershipExpiryDate/g, 'cardExpiry: memberRecord?.cardExpiryDate');

content = content.replace(/cardStatus:\s*mems\[0\]\.membershipStatus/g, 'cardStatus: mems[0].active ? "Attiva" : "Inattiva"');
content = content.replace(/cardExpiry:\s*mems\[0\]\.membershipExpiryDate/g, 'cardExpiry: mems[0].cardExpiryDate');

// Also handle the string templates if any
content = content.replace(/mems\.membershipStatus/g, 'mems.active ? "Attiva" : "Inattiva"');
content = content.replace(/mems\.membershipExpiryDate/g, 'mems.cardExpiryDate');

fs.writeFileSync(routesPath, content, 'utf8');
console.log('Fixed typescript errors in routes.ts');
