const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /await db\.insert\(schema\.auditLogs\)\.values\(\{\s*entityId: existingMember\.id,\s*entityType: 'members',\s*action: 'UPDATE',\s*changes: \{ field: key, old: dbVal, new: fileVal \},\s*performedBy: performedBy,\s*tenantId: '1'\s*\}\);/g,
    \`await db.insert(schema.auditLogs).values({
      entityId: existingMember.id,
      entityType: 'members',
      action: 'UPDATE',
      details: JSON.stringify({ field: key, old: dbVal, new: fileVal }),
      performedBy: performedBy
    });\`
  );
  
  content = content.replace(
    /await db\.insert\(schema\.auditLogs\)\.values\(\{\s*recordId: existingMember\.id,\s*entityType: 'members',\s*action: 'UPDATE',\s*changes: \{ field: key, old: dbVal, new: fileVal \},\s*performedBy: performedBy,\s*tenantId: '1'\s*\}\);/g,
    \`await db.insert(schema.auditLogs).values({
      entityId: existingMember.id,
      entityType: 'members',
      action: 'UPDATE',
      details: JSON.stringify({ field: key, old: dbVal, new: fileVal }),
      performedBy: performedBy
    });\`
  );
  fs.writeFileSync(file, content);
}

fixFile('server/routes/importChunked.ts');
fixFile('server/routes.ts');
