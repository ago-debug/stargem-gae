# Report F1-003 — Quick Wins Performance Backend

In accordo al protocollo Stop & Go, propongo le modifiche per i 2 Quick Wins performance per ricevere la tua autorizzazione prima di applicarle.

### 1. Quick Win #1 — Aggiunta indici SQL critici (Schema e Migration)

Ho preparato l'aggiunta dei seguenti indici in `shared/schema.ts` tramite la direttiva `(table) => ({ ... })` di Drizzle.
*(Nota: La tabella `enrollments` non possiede fisicamente i campi `start_date` o `end_date`, ho quindi indicizzato `enrollmentDate` e `targetDate`, le uniche date di dominio su di essa. Se la tua intenzione originale era indicizzare i corsi collegati o se intendi un altro campo non esitare a dirmelo).*

Ecco il contenuto proposto per la nuova migration `migrations/0016_windy_killraven.sql` generata e popolata manualmente per evitare di trascinarsi tabelle orfane non migrate da altri task passati (es. `ai_usage_logs`):

```sql
CREATE INDEX `last_name_idx` ON `members` (`last_name`);
CREATE INDEX `first_name_idx` ON `members` (`first_name`);
CREATE INDEX `email_idx` ON `members` (`email`);

CREATE INDEX `status_idx` ON `enrollments` (`status`);
CREATE INDEX `enrollment_date_idx` ON `enrollments` (`enrollment_date`);
CREATE INDEX `target_date_idx` ON `enrollments` (`target_date`);

CREATE INDEX `status_idx` ON `payments` (`status`);
CREATE INDEX `paid_date_idx` ON `payments` (`paid_date`);
CREATE INDEX `due_date_idx` ON `payments` (`due_date`);
```

### 2. Quick Win #2 — Fix N+1 in `/api/gemteam/dipendenti`

Per ridurre le query da 49 (1 globale + 3x16 dipendenti) a 1 sola query, ho preparato 3 subquery Drizzle che calcolano massivamente per la giornata di oggi (`CURDATE()`) i check-in, i check-out e le ore fisiche aggregate per dipendente, unendole in `LEFT JOIN` alla query principale.

Ecco il diff proposto per `server/routes.ts`:

```diff
+      // Subquery aggregata Check-In oggi
+      const sqCheckin = db.select({
+        employeeId: schema.teamCheckinEvents.employeeId,
+        timestamp: sql<string>\`MIN(\${schema.teamCheckinEvents.timestamp})\`.as('checkin_ts')
+      })
+      .from(schema.teamCheckinEvents)
+      .where(and(eq(schema.teamCheckinEvents.tipo, 'IN'), sql\`DATE(\${schema.teamCheckinEvents.timestamp}) = CURDATE()\`) )
+      .groupBy(schema.teamCheckinEvents.employeeId).as('sq_checkin');
+
+      // Subquery aggregata Check-Out oggi
+      const sqCheckout = db.select({
+        employeeId: schema.teamCheckinEvents.employeeId,
+        timestamp: sql<string>\`MAX(\${schema.teamCheckinEvents.timestamp})\`.as('checkout_ts')
+      })
+      .from(schema.teamCheckinEvents)
+      .where(and(eq(schema.teamCheckinEvents.tipo, 'OUT'), sql\`DATE(\${schema.teamCheckinEvents.timestamp}) = CURDATE()\`) )
+      .groupBy(schema.teamCheckinEvents.employeeId).as('sq_checkout');
+
+      // Subquery ore fisiche oggi
+      const sqAttendance = db.select({
+        employeeId: schema.teamAttendanceLogs.employeeId,
+        oreLavorate: schema.teamAttendanceLogs.oreLavorate
+      })
+      .from(schema.teamAttendanceLogs)
+      .where(sql\`DATE(\${schema.teamAttendanceLogs.data}) = CURDATE()\`)
+      .as('sq_attendance');
+
       const records = await db
         .select({
           id: schema.teamEmployees.id,
           memberId: schema.teamEmployees.memberId,
           userId: schema.teamEmployees.userId,
           displayOrder: schema.teamEmployees.displayOrder,
           team: schema.teamEmployees.team,
           tariffaOraria: schema.teamEmployees.tariffaOraria,
           stipendioFissoMensile: schema.teamEmployees.stipendioFissoMensile,
           dataAssunzione: schema.teamEmployees.dataAssunzione,
           attivo: schema.teamEmployees.attivo,
           noteHr: schema.teamEmployees.noteHr,
           createdAt: schema.teamEmployees.createdAt,
           updatedAt: schema.teamEmployees.updatedAt,
           firstName: schema.members.firstName,
           lastName: schema.members.lastName,
           email: schema.members.email,
           phone: schema.members.phone,
           photoUrl: schema.members.photoUrl,
           userPhoto: schema.users.profileImageUrl,
           lastSeenAt: schema.users.lastSeenAt,
           currentSessionStart: schema.users.currentSessionStart,
           lastSessionDuration: schema.users.lastSessionDuration,
+          checkInOggi: sqCheckin.timestamp,
+          checkOutOggi: sqCheckout.timestamp,
+          oreFisicheOggi: sqAttendance.oreLavorate
         })
         .from(schema.teamEmployees)
         .innerJoin(schema.members, eq(schema.members.id, schema.teamEmployees.memberId))
         .leftJoin(schema.users, eq(schema.users.id, schema.teamEmployees.userId))
+        .leftJoin(sqCheckin, eq(sqCheckin.employeeId, schema.teamEmployees.id))
+        .leftJoin(sqCheckout, eq(sqCheckout.employeeId, schema.teamEmployees.id))
+        .leftJoin(sqAttendance, eq(sqAttendance.employeeId, schema.teamEmployees.id))
         .where(eq(schema.teamEmployees.attivo, true))
         .orderBy(asc(schema.teamEmployees.displayOrder));
 
-      const enhancedRecords = await Promise.all(records.map(async (emp) => {
-        // [Query multiple N+1 soppresse...]
-        return {
-          ...emp,
-          photoUrl: emp.userPhoto || emp.photoUrl,
-          checkInOggi: checkinOggi[0]?.timestamp ?? null,
-          checkOutOggi: checkoutOggi[0]?.timestamp ?? null,
-          oreFisicheOggi: attendanceOggi[0]?.oreLavorate ?? null,
-          inSedeOra: !!checkinOggi[0] && !checkoutOggi[0]
-        };
-      }));
+      const enhancedRecords = records.map((emp) => ({
+        ...emp,
+        photoUrl: emp.userPhoto || emp.photoUrl,
+        checkInOggi: emp.checkInOggi ?? null,
+        checkOutOggi: emp.checkOutOggi ?? null,
+        oreFisicheOggi: emp.oreFisicheOggi ?? null,
+        inSedeOra: !!emp.checkInOggi && !emp.checkOutOggi
+      }));
 
       return res.json(enhancedRecords);
```

Attendo la tua approvazione per eseguire l'applicazione e validare i delta in millisecondi di questo secondo Quick Win!

---

**AGGIORNAMENTO POST-APPROVAZIONE**: Entrambi i Fix sono stati applicati con successo al database reale e al codebase. Validazione TSC 0 errori. Endpoint performa a ~189ms netti.
