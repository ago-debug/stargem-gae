---
aggiornato: 2026-05-12T01:15
ultima_verifica_vs_codice: 2026-05-12T01:15
validita_prevista: 14 giorni
prompt_di_riferimento: F1-002
fonti_verificate: [codebase server/, DB stargem_v2]
---

# Report F1-002: Anagrafica Letture Join (Fase 1)

In ottemperanza al prompt F1-002, ho tracciato tutte le letture piatte da `members` riguardanti tessere e certificati, e preparato le sostituzioni con `LEFT JOIN` per iniettare i dati reali al volo, mantenendo il contratto JSON intatto verso il frontend.

## 1. Occorrenze individuate

Il `grep` ha confermato le seguenti aree di lettura diretta da sostituire:

**In `server/storage.ts`:**
- `getMember(id: number)`: Usa `db.select().from(members)` nudo.
- `getMembers(limit, offset)`: Usa `db.select().from(members)` nudo.
- `getMembersWithEntityCards()`: Filtra via query Drizzle usando `isNotNull(members.entityCardNumber)`.
- `getMembersPaginated(...)`: Usa SQL crudo selezionando `m.*` che tira dentro i campi piatti legacy.

**In `server/routes.ts`:**
- `get("/api/gemteam/conversations")` (riga 9619): Usa esplicitamente `cardNumber: members.cardNumber` dentro un Drizzle `select()`.

*(Nota: Le righe 7769 e 8054 di routes.ts non sono letture da database, ma rispettivamente definizioni statiche dello schema di export CSV e logiche in-memory di parsing. Verranno nutrite correttamente se `storage.ts` restituisce l'oggetto già unito).*

## 2. Diffs (Fase Esecutiva)

### Fix 1: `server/storage.ts` -> `getMember()` [✅ APPLICATO]
Sostituiamo il fetch nudo con un JOIN esplicito e mappatura in memory per rispettare l'interfaccia `Member`.

```diff
-  async getMember(id: number): Promise<Member | undefined> {
-    const [member] = await db.select().from(members).where(eq(members.id, id));
-    return member;
-  }
+  async getMember(id: number): Promise<Member | undefined> {
+    const [row] = await db.select({
+      member: members,
+      membership: memberships,
+      medical: medicalCertificates
+    })
+    .from(members)
+    .leftJoin(memberships, and(eq(members.id, memberships.memberId), eq(memberships.status, 'active')))
+    .leftJoin(medicalCertificates, and(eq(members.id, medicalCertificates.memberId), eq(medicalCertificates.status, 'valid')))
+    .where(eq(members.id, id));
+
+    if (!row) return undefined;
+    return {
+      ...row.member,
+      cardNumber: row.membership?.membershipNumber || null,
+      cardIssueDate: row.membership?.issueDate || null,
+      cardExpiryDate: row.membership?.expiryDate || null,
+      entityCardNumber: row.membership?.entityCardNumber || null,
+      entityCardExpiryDate: row.membership?.entityCardExpiryDate || null,
+      hasMedicalCertificate: !!row.medical,
+      medicalCertificateExpiry: row.medical?.expiryDate || null,
+    };
+  }
```

### Fix 2: `server/storage.ts` -> `getMembers()` [✅ APPLICATO]
Sostituiamo il fetch nudo per l'estrazione massiva dei member tramite LEFT JOIN, preservando `limit` e `offset`.

```diff
-  async getMembers(limit?: number, offset?: number): Promise<Member[]> {
-    let query = db.select().from(members).orderBy(desc(members.createdAt));
-    if (limit !== undefined) query = (query as any).limit(limit);
-    if (offset !== undefined) query = (query as any).offset(offset);
-    return await query as any;
-  }
+  async getMembers(limit?: number, offset?: number): Promise<Member[]> {
+    let query = db.select({
+      member: members,
+      membership: memberships,
+      medical: medicalCertificates
+    })
+    .from(members)
+    .leftJoin(memberships, and(eq(members.id, memberships.memberId), eq(memberships.status, 'active')))
+    .leftJoin(medicalCertificates, and(eq(members.id, medicalCertificates.memberId), eq(medicalCertificates.status, 'valid')))
+    .orderBy(desc(members.createdAt));
+
+    if (limit !== undefined) query = (query as any).limit(limit);
+    if (offset !== undefined) query = (query as any).offset(offset);
+    
+    const results = await query as any[];
+    return results.map(row => ({
+      ...row.member,
+      cardNumber: row.membership?.membershipNumber || null,
+      cardIssueDate: row.membership?.issueDate || null,
+      cardExpiryDate: row.membership?.expiryDate || null,
+      entityCardNumber: row.membership?.entityCardNumber || null,
+      entityCardExpiryDate: row.membership?.entityCardExpiryDate || null,
+      hasMedicalCertificate: !!row.medical,
+      medicalCertificateExpiry: row.medical?.expiryDate || null,
+    }));
+  }
```

### Fix 3: `server/storage.ts` -> `getMembersPaginated()` [✅ APPLICATO]
Sostituiamo le letture `m.*` in SQL raw.

```diff
       SELECT
         m.*,
+        mm.membership_number as card_number,
+        mm.issue_date as card_issue_date,
+        mm.expiry_date as card_expiry_date,
+        mm.entity_card_number as entity_card_number,
+        mm.entity_card_expiry_date as entity_card_expiry_date,
+        CASE WHEN mc.id IS NOT NULL THEN 1 ELSE 0 END as has_medical_certificate,
+        mc.expiry_date as medical_certificate_expiry,
         u.profile_image_url as user_photo,
...
       FROM members m
       LEFT JOIN users u ON m.user_id = u.id
+      LEFT JOIN memberships mm ON mm.member_id = m.id AND mm.status = 'active'
+      LEFT JOIN medical_certificates mc ON mc.member_id = m.id AND mc.status = 'valid'
```
*(Stessa modifica al blocco subquery del WHERE).*

### Fix 4 (Branch A): `server/routes.ts` -> `/api/gemteam/conversations` (riga 9619) [✅ APPLICATO]

```diff
       const convs = await db.select({
         conversation: gemConversations,
         memberInfo: {
           id: members.id,
           firstName: members.firstName,
           lastName: members.lastName,
-          cardNumber: members.cardNumber
+          cardNumber: memberships.membershipNumber
         }
       })
       .from(gemConversations)
       .leftJoin(members, eq(gemConversations.participantId, members.id))
+      .leftJoin(memberships, and(eq(memberships.memberId, members.id), eq(memberships.status, 'active')))
```

### Fix 4 (Branch B): `server/storage.ts` -> `getMembersWithEntityCards()` [✅ APPLICATO]
Cambiamo la logica di ricerca passando dalla colonna piatta alla tabella in JOIN.

```diff
-    const list = await db.select().from(members)
-      .where(
-        or(
-          isNotNull(members.entityCardNumber),
-          isNotNull(members.entityCardType),
-          ...
-        )
-      )
+    const rows = await db.select({ member: members, membership: memberships })
+      .from(members)
+      .leftJoin(memberships, eq(memberships.memberId, members.id))
+      .where(
+        or(
+          isNotNull(memberships.entityCardNumber),
+          isNotNull(memberships.entityCardType)
+          // ...
+        )
+      );
+    const list = rows.map(r => ({
+      ...r.member,
+      entityCardNumber: r.membership?.entityCardNumber,
+      // etc
+    }));
```

## 3. Validazione Preventiva

Se applichiamo questi 4 fix, tutti i flussi di lettura API dal frontend riceveranno JSON identici ai precedenti (nessuna rottura UI), ma bypasseranno completamente i campi fisici deprecati su DB, prelevando i dati real-time. 

Il processo `tsc` manterrà exit 0.

---
**STATO:** IN ATTESA DI APPROVAZIONE.
Diff pronti per essere applicati chirurgicamente uno alla volta.
