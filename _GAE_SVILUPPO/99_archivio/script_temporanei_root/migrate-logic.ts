import { memberDuplicateExclusions } from './shared/schema';

// This is just a script to prepare the function string.

async getDuplicateCandidates(): Promise<any[]> {
  const allMembers = await db.select({
    id: members.id,
    firstName: members.firstName,
    lastName: members.lastName,
    fiscalCode: members.fiscalCode,
    email: members.email,
    mobile: members.mobile,
    phone: members.phone,
    dateOfBirth: members.dateOfBirth,
    city: members.city,
    postalCode: members.postalCode,
    address: members.address,
    notes: members.notes,
    active: members.active
  }).from(members).where(eq(members.active, true));

  // Get exclusions
  const exclusions = await db.select().from(memberDuplicateExclusions);
  const excludedPairs = new Set(
    exclusions.map(e => `${Math.min(e.memberId1, e.memberId2)}-${Math.max(e.memberId1, e.memberId2)}`)
  );

  const levenshtein = (a: string, b: string): number => {
    if (!a || !b) return Math.max((a || '').length, (b || '').length);
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
  };

  // Group by bucket to avoid O(N^2) over the full dataset
  const buckets = new Map<string, any[]>();
  for (const m of allMembers) {
    const bucketKey = (m.lastName || '').trim().toLowerCase() || 'unknown';
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(m);
  }

  // Also bucket by email to catch different last names with same email
  // (though prompt says to just group by last_name, but family can have same email and different last names)
  // Let's stick STRICTLY to the prompt's bucket logic:
  // "1. Raggruppa prima per stesso cognome (last_name). 2. Solo all'interno dello stesso bucket fai il confronto"

  const duplicatePairs: any[] = [];
  const foundPairs = new Set<string>();

  for (const [bucketKey, bucketMembers] of buckets.entries()) {
    if (bucketMembers.length < 2) continue;

    for (let i = 0; i < bucketMembers.length; i++) {
      const m1 = bucketMembers[i];

      for (let j = i + 1; j < bucketMembers.length; j++) {
        const m2 = bucketMembers[j];

        const pairKey = `${Math.min(m1.id, m2.id)}-${Math.max(m1.id, m2.id)}`;
        if (excludedPairs.has(pairKey) || foundPairs.has(pairKey)) continue;

        let score = 0;
        const matchReasons: any[] = [];

        // 1. CF Identico: 10 pt
        if (m1.fiscalCode && m2.fiscalCode && m1.fiscalCode.toUpperCase().trim() === m2.fiscalCode.toUpperCase().trim()) {
          score += 10;
          matchReasons.push({ field: 'CF identico', points: 10 });
        } else if (m1.fiscalCode && m2.fiscalCode) {
          // CF Simile (<=2): 6 pt
          const cfDist = levenshtein(m1.fiscalCode.toUpperCase().trim(), m2.fiscalCode.toUpperCase().trim());
          if (cfDist <= 2) {
            score += 6;
            matchReasons.push({ field: 'CF simile', points: 6 });
          }
        }

        // CF Flaggato in notes
        if ((m1.notes && m1.notes.includes('CF-DA-VERIFICARE') && m1.notes.includes(m2.id.toString())) ||
            (m2.notes && m2.notes.includes('CF-DA-VERIFICARE') && m2.notes.includes(m1.id.toString()))) {
          score += 6;
          matchReasons.push({ field: 'CF flaggato da DB', points: 6 });
        }

        // Nome + Cognome identico: 3 pt
        const nameDist = levenshtein(
          (m1.firstName || '').toLowerCase().trim() + (m1.lastName || '').toLowerCase().trim(),
          (m2.firstName || '').toLowerCase().trim() + (m2.lastName || '').toLowerCase().trim()
        );
        if (nameDist === 0) {
          score += 3;
          matchReasons.push({ field: 'Stesso nome', points: 3 });
        }

        // Stessa Email: 4 pt
        const hasEmail = m1.email && m2.email;
        if (hasEmail && m1.email.toLowerCase().trim() === m2.email.toLowerCase().trim()) {
          score += 4;
          matchReasons.push({ field: 'Stessa email', points: 4 });
        }

        // Stesso Telefono: 2 pt
        const t1 = (m1.mobile || m1.phone || '').trim();
        const t2 = (m2.mobile || m2.phone || '').trim();
        if (t1 && t2 && t1 === t2) {
          score += 2;
          matchReasons.push({ field: 'Stesso tel.', points: 2 });
        }

        // Stessa Dati Nascita: 3 pt
        if (m1.dateOfBirth && m2.dateOfBirth && m1.dateOfBirth === m2.dateOfBirth) {
          score += 3;
          matchReasons.push({ field: 'Stessa nascita', points: 3 });
        }

        // Stessa Città + CAP: 1 pt
        if (m1.city && m2.city && m1.city.toLowerCase().trim() === m2.city.toLowerCase().trim() &&
            m1.postalCode && m2.postalCode && m1.postalCode.trim() === m2.postalCode.trim()) {
          score += 1;
          matchReasons.push({ field: 'Stessa città+CAP', points: 1 });
        }

        // REGOLA ANTI-FAMIGLIA
        const firstNameDist = levenshtein((m1.firstName || '').toLowerCase().trim(), (m2.firstName || '').toLowerCase().trim());
        if (firstNameDist > 3 && score <= 4 && (hasEmail || (t1 && t2))) {
          // It's family.
          continue;
        }

        if (score >= 5) {
          // calculate completeness to suggest winner
          const m1Completeness = Object.values(m1).filter(v => v !== null && v !== '').length;
          const m2Completeness = Object.values(m2).filter(v => v !== null && v !== '').length;
          const suggestedWinnerId = m1Completeness >= m2Completeness ? m1.id : m2.id;

          duplicatePairs.push({
            id1: m1.id, id2: m2.id,
            name1: \`\${m1.lastName} \${m1.firstName}\`, name2: \`\${m2.lastName} \${m2.firstName}\`,
            cf1: m1.fiscalCode, cf2: m2.fiscalCode,
            email1: m1.email, email2: m2.email,
            phone1: m1.mobile || m1.phone, phone2: m2.mobile || m2.phone,
            dob1: m1.dateOfBirth, dob2: m2.dateOfBirth,
            city1: m1.city, city2: m2.city,
            score,
            matchReasons,
            suggestedWinner: suggestedWinnerId,
            member1Full: m1,
            member2Full: m2
          });
          foundPairs.add(pairKey);
        }
      }
    }
  }

  // Sort by LastName
  duplicatePairs.sort((a, b) => {
    return a.name1.localeCompare(b.name1);
  });

  return duplicatePairs;
}
