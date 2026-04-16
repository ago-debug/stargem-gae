import { db } from '../server/db';
import { members } from '../shared/schema';

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const propCost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + propCost);
    }
  }
  return matrix[b.length][a.length];
}

async function main() {
  const allMembers = await db.select({
    id: members.id,
    firstName: members.firstName,
    lastName: members.lastName,
    fiscalCode: members.fiscalCode,
    email: members.email,
    mobile: members.mobile,
    phone: members.phone,
    dateOfBirth: members.dateOfBirth
  }).from(members);

  let excludedFamilies = 0;
  let remainingClusters = 0;
  const visited = new Set<number>();
  
  for (let i = 0; i < allMembers.length; i++) {
    const m1 = allMembers[i];
    if (visited.has(m1.id)) continue;

    const currentCluster = [m1];
    visited.add(m1.id);

    let isFamilyCluster = false;

    for (let j = i + 1; j < allMembers.length; j++) {
      const m2 = allMembers[j];
      if (visited.has(m2.id)) continue;

      // Old isMatch
      let matches = 0;
      let firstNameMatch = false;
      let emailMatch = false;
      let contactOrDemographicMatch = false;

      const f1 = (m1.firstName || '').toLowerCase().trim();
      const f2 = (m2.firstName || '').toLowerCase().trim();
      if (f1 && f2 && f1 === f2) { matches++; firstNameMatch = true; }

      const l1 = (m1.lastName || '').toLowerCase().trim();
      const l2 = (m2.lastName || '').toLowerCase().trim();
      if (l1 && l2 && l1 === l2) { matches++; }

      const e1 = (m1.email || '').toLowerCase().trim();
      const e2 = (m2.email || '').toLowerCase().trim();
      if (e1 && e2 && e1 === e2) { matches++; contactOrDemographicMatch = true; emailMatch = true; }

      const p1 = (m1.mobile || m1.phone || '').trim();
      const p2 = (m2.mobile || m2.phone || '').trim();
      if (p1 && p2 && p1 === p2) { matches++; contactOrDemographicMatch = true; }

      if (m1.dateOfBirth && m2.dateOfBirth && m1.dateOfBirth === m2.dateOfBirth) {
        matches++; contactOrDemographicMatch = true;
      }

      let isOldMatch = false;
      if (m1.fiscalCode && m2.fiscalCode && m1.fiscalCode.toUpperCase().trim() === m2.fiscalCode.toUpperCase().trim()) {
        isOldMatch = true;
      } else {
        if (firstNameMatch && !(matches === 2 && !contactOrDemographicMatch) && matches >= 2) {
          isOldMatch = true;
        }
      }

      if (isOldMatch) {
         // NEW LOGIC
         const name1 = (m1.firstName || '') + (m1.lastName || '');
         const name2 = (m2.firstName || '') + (m2.lastName || '');
         const nameDistance = levenshtein(name1, name2);
         const matchReason = emailMatch && matches === 2 ? 'email_only' : 'other'; 
         // wait! if matches == 2 and emailMatch == true, the other match must be firstName (since firstNameMatch is required)
         
         if (nameDistance > 3 && matchReason === 'email_only') {
            isFamilyCluster = true;
            excludedFamilies++;
            continue;
         }

         currentCluster.push(m2);
         visited.add(m2.id);
      }
    }

    if (currentCluster.length > 1) {
      remainingClusters++;
    }
  }

  console.log('Famiglie escluse:', excludedFamilies);
  console.log('Duplicati stimati dopo fix:', remainingClusters);

  process.exit(0);
}

main().catch(console.error);
