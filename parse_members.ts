import fs from 'fs';
const schema = fs.readFileSync('shared/schema.ts', 'utf8');

const membersMatch = schema.match(/export const members = mysqlTable\("members", \{([\s\S]*?)\}\);/);
if (membersMatch) {
  const fields = membersMatch[1].split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).map(line => line.trim().split(':')[0]);
  console.log(fields.join(', '));
}

const membershipsMatch = schema.match(/export const memberships = mysqlTable\("memberships", \{([\s\S]*?)\}\);/);
if (membershipsMatch) {
  console.log('\n--- memberships ---');
  console.log(membershipsMatch[1].split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).map(line => line.trim().split(':')[0]).join(', '));
}

const medicalMatch = schema.match(/export const medical_certificates = mysqlTable\("medical_certificates", \{([\s\S]*?)\}\);/);
if (medicalMatch) {
  console.log('\n--- medical_certificates ---');
  console.log(medicalMatch[1].split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).map(line => line.trim().split(':')[0]).join(', '));
}
