import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db, pool } from "../db";
import { eq, desc, asc, and, isNull, isNotNull, sql, gt, gte, lte, lt, or, like, ne, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";
import { insertMemberSchema } from "@shared/schema";

export function registerMembersRoutes(app: Express, isAuthenticated: any, upload: any) {
  // ==== Members Routes ====

  // CRM Profiling routes
  app.post("/api/crm/profile/recalculate-all", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const { recalculateAllActiveMembers } = await import("./utils/crm-profiling");
      const updatedCount = await recalculateAllActiveMembers();
      await logUserActivity(req, "UPDATE", "crm_profiling", "all", { count: updatedCount });
      res.json({ success: true, updatedCount });
    } catch (error: any) {
      console.error("[API Error] Failed to recalculate CRM profiles:", error);
      res.status(500).json({ message: "Failed to recalculate profiles" });
    }
  });

  app.post("/api/crm/profile/:memberId/recalculate", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const { calculateCrmProfileForMember } = await import("./utils/crm-profiling");
      const result = await calculateCrmProfileForMember(memberId);
      await logUserActivity(req, "UPDATE", "crm_profiling", memberId.toString(), { action: "manual_recalculation", result });
      
      const updatedMember = await storage.getMember(memberId);
      res.json(updatedMember);
    } catch (error: any) {
      console.error("[API Error] Failed to recalculate CRM profile for member:", error);
      res.status(500).json({ message: "Failed to recalculate profile" });
    }
  });

  app.post("/api/crm/profile/:memberId/override", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const { level, reason, override } = req.body;
      
      const updatedMember = await storage.updateMember(memberId, {
        crmProfileLevel: level || null,
        crmProfileReason: reason || null,
        crmProfileOverride: override,
      } as any);
      
      await logUserActivity(req, "UPDATE", "crm_profiling", memberId.toString(), { level, reason });
      res.json(updatedMember);
    } catch (error: any) {
      console.error("[API Error] Failed to override CRM profile:", error);
      res.status(500).json({ message: "Failed to update profile override" });
    }
  });

  // --- Route contatori per tipo ---
  app.get('/api/members/counts-by-type', isAuthenticated, async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT
          -- Partecipanti = soci (NULL o SOCIO)
          SUM(CASE WHEN participant_type IS NULL
            OR participant_type = 'SOCIO'
            THEN 1 ELSE 0 END) AS partecipanti,
          -- Staff = insegnanti + personal trainer
          SUM(CASE WHEN participant_type IN (
            'INSEGNANTE','PERSONAL_TRAINER')
            THEN 1 ELSE 0 END) AS staff,
          -- Team = dipendenti
          SUM(CASE WHEN participant_type =
            'DIPENDENTE'
            THEN 1 ELSE 0 END) AS team,
          -- Medici
          SUM(CASE WHEN participant_type
            LIKE '%MEDIC%'
            THEN 1 ELSE 0 END) AS medici,
          -- Totale generale
          COUNT(*) AS totale
        FROM members WHERE active = 1
      `);
      res.json((result[0] as unknown as any[])[0] || {
        partecipanti: 0, staff: 0,
        team: 0, medici: 0, totale: 0
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/api/members", isAuthenticated, checkPermission("/anagrafica_a_lista", "read"), async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const search = req.query.search as string || "";
      const seasonFilter = req.query.season as string || "all";
      const statusFilter = req.query.status as string || "all";
      const genderFilter = req.query.gender as string || "all";
      const hasMedicalCertFilter = req.query.hasMedicalCert as string || "all";
      const isMinorFilter = req.query.isMinor as string || "all";
      const participantTypeFilter = req.query.participantType as string || "all";
      const hasCardFilter = req.query.hasCard as string || "all";
      const hasEntityCardFilter = req.query.hasEntityCard as string || "all";
      const hasEmailFilter = req.query.hasEmail as string || "all";
      const hasPhoneFilter = req.query.hasPhone as string || "all";
      const missingFiscalCodeFilter = req.query.missingFiscalCode as string || "all";
      const issuesFilter = req.query.issuesFilter as string || "all";

      console.log("Filters received in /api/members:", {
        search, seasonFilter, statusFilter, genderFilter, hasMedicalCertFilter, isMinorFilter, participantTypeFilter, hasCardFilter, hasEntityCardFilter, hasEmailFilter, hasPhoneFilter, missingFiscalCodeFilter, issuesFilter
      });

      // Always use paginated query for performance
      const result = await storage.getMembersPaginated(
        page, pageSize, search, seasonFilter, statusFilter, genderFilter,
        hasMedicalCertFilter, isMinorFilter, participantTypeFilter,
        hasCardFilter, hasEntityCardFilter, hasEmailFilter,
        hasPhoneFilter, missingFiscalCodeFilter, issuesFilter
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/test-member/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/members/merge", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const { winnerId, loserId, fieldOverrides } = req.body;

      if (!winnerId || !loserId) {
        return res.status(400).json({ message: "Parametri di fusione non validi" });
      }

      await storage.mergeMembersAdvanced(winnerId, loserId, fieldOverrides || {});
      await logUserActivity(req, "MERGE", "members", winnerId.toString(), {
        action: `Uniti ID ${loserId} nel profilo principale ${winnerId}`
      });

      res.json({ success: true, message: "Anagrafiche unite con successo", winnerId });
    } catch (error: any) {
      console.error("[API Error] Failed to merge members:", error);
      res.status(500).json({ message: error.message || "Errore durante l'unione dei contatti" });
    }
  });

  app.post("/api/members/not-duplicate", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const { id1, id2 } = req.body;
      if (!id1 || !id2) return res.status(400).json({ message: "Missing pairs" });
      
      const operator = req.user?.username || 'system';
      await storage.excludeDuplicatePair(id1, id2, operator);

      res.json({ success: true, message: "Coppia esclusa." });
    } catch (e: any) {
      console.error("Not duplicate exclusion failed:", e);
      res.status(500).json({ message: "Errore durante l'esclusione." });
    }
  });

  app.get("/api/members/duplicates", isAuthenticated, async (req, res) => {
    try {
      const duplicates = await storage.getDuplicateFiscalCodes();
      res.json(duplicates);
    } catch (error) {
      console.error("Error fetching duplicate fiscal codes:", error);
      res.status(500).json({ message: "Failed to fetch duplicate fiscal codes" });
    }
  });

  app.get("/api/members/duplicate-stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDuplicateStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching duplicate stats:", error);
      res.status(500).json({ message: "Failed to fetch duplicate stats" });
    }
  });

  app.get("/api/members/missing-data", isAuthenticated, async (req, res) => {
    try {
      const counts = await storage.getMissingDataCounts();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching missing data counts:", error);
      res.status(500).json({ message: "Failed to fetch missing data counts" });
    }
  });

  app.get("/api/members/entity-cards", isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getMembersWithEntityCards();
      res.json(members);
    } catch (error) {
      console.error("Error fetching entity cards:", error);
      res.status(500).json({ message: "Failed to fetch entity cards" });
    }
  });

  function isMinorAge(dob: string | Date | null): boolean {
    if (!dob) return false;
    const age = differenceInYears(new Date(), new Date(dob));
    return age < 18;
  }

  async function checkCF(cf: string, excludeId?: number) {
    const existing = await db.select()
      .from(schema.members)
      .where(
        and(
          eq(schema.members.fiscalCode, cf.toUpperCase()),
          ne(schema.members.id, excludeId || 0),
          eq(schema.members.active, true)
        )
      ).limit(1);

    if (existing.length === 0) {
      return { available: true };
    }
    return {
      available: false,
      conflict: {
        id: existing[0].id,
        name: existing[0].firstName + ' ' + existing[0].lastName,
        email: existing[0].email || null,
        phone: existing[0].phone || null,
        fiscalCode: existing[0].fiscalCode,
        membershipNumber: null 
      }
    };
  }

  async function checkEmail(email: string, isMinorParam: string | boolean, excludeId?: number) {
    const existing = await db.select()
      .from(schema.members)
      .where(
        and(
          eq(schema.members.email, email.toLowerCase()),
          ne(schema.members.id, excludeId || 0),
          eq(schema.members.active, true)
        )
      );

    if (existing.length === 0) {
      return { available: true };
    }

    if (isMinorParam === '1' || isMinorParam === true) {
      return {
        available: true,
        warning: 'email_famiglia',
        conflicts: existing.map(m => ({
          id: m.id,
          name: m.firstName + ' ' + m.lastName,
          isMinor: m.isMinor
        }))
      };
    }

    return {
      available: false,
      conflict: {
        id: existing[0].id,
        name: existing[0].firstName + ' ' + existing[0].lastName,
        email: existing[0].email,
        fiscalCode: existing[0].fiscalCode || null
      }
    };
  }

  async function checkPhone(phone: string, isMinorParam: string | boolean, excludeId?: number) {
    const normalized = phone.replace(/\s/g, '').replace(/^(\+39|0039)/, '');
    
    // Fetch potential matches containing the normalized digits
    const existingRaw = await db.select()
      .from(schema.members)
      .where(
        and(
          or(
            like(schema.members.phone, `%${normalized}%`),
            like(schema.members.mobile, `%${normalized}%`)
          ),
          ne(schema.members.id, excludeId || 0),
          eq(schema.members.active, true)
        )
      );

    const existing = existingRaw.filter(m => {
       const mPhone = (m.phone || '').replace(/\s/g, '').replace(/^(\+39|0039)/, '');
       const mMobile = (m.mobile || '').replace(/\s/g, '').replace(/^(\+39|0039)/, '');
       return (mPhone && mPhone === normalized) || (mMobile && mMobile === normalized);
    });

    if (existing.length === 0) {
      return { available: true };
    }

    if (isMinorParam === '1' || isMinorParam === true) {
      return {
        available: true,
        warning: 'telefono_famiglia',
        conflicts: existing.map(m => ({
          id: m.id,
          name: m.firstName + ' ' + m.lastName,
          isMinor: m.isMinor
        }))
      };
    }

    return {
      available: false,
      conflict: {
        id: existing[0].id,
        name: existing[0].firstName + ' ' + existing[0].lastName,
        phone: existing[0].phone || existing[0].mobile,
        fiscalCode: existing[0].fiscalCode || null
      }
    };
  }

  app.get("/api/members/check-cf", isAuthenticated, async (req, res) => {
    try {
      const { cf, excludeId } = req.query;
      if (!cf || typeof cf !== 'string') return res.json({ available: true });
      const result = await checkCF(cf, excludeId ? parseInt(excludeId as string) : undefined);
      res.json(result);
    } catch (e) {
      res.status(500).json({ available: true });
    }
  });

  app.get("/api/members/check-email", isAuthenticated, async (req, res) => {
    try {
      const { email, isMinor, excludeId } = req.query;
      if (!email || typeof email !== 'string') return res.json({ available: true });
      const result = await checkEmail(email, isMinor as string, excludeId ? parseInt(excludeId as string) : undefined);
      res.json(result);
    } catch (e) {
      res.status(500).json({ available: true });
    }
  });

  app.get("/api/members/check-phone", isAuthenticated, async (req, res) => {
    try {
      const { phone, isMinor, excludeId } = req.query;
      if (!phone || typeof phone !== 'string') return res.json({ available: true });
      const result = await checkPhone(phone, isMinor as string, excludeId ? parseInt(excludeId as string) : undefined);
      res.json(result);
    } catch (e) {
      res.status(500).json({ available: true });
    }
  });



  app.get("/api/members/:id", isAuthenticated, checkPermission("/membro", "read"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      if (!member) {
        return res.status(404).json({ message: "Membro non trovato" });
      }
      res.json(member);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.post("/api/members", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const normalizeEmpty = (val: any): any => {
        if (val === "" || val === undefined) return null;
        if (typeof val === "string" && val.trim() === "") return null;
        return val;
      };
      const normalizedData: any = {};
      const sanitizedBody = sanitizeMemberData(req.body);
      for (const [key, value] of Object.entries(sanitizedBody)) {
        if (key === 'photoUrl') {
          normalizedData[key] = value;
        } else {
          normalizedData[key] = normalizeEmpty(value);
        }
      }
      if (!normalizedData.firstName) normalizedData.firstName = "Sconosciuto";
      if (!normalizedData.lastName) normalizedData.lastName = "Sconosciuto";

      // Normalize fiscal code to uppercase
      if (normalizedData.fiscalCode) {
        normalizedData.fiscalCode = normalizedData.fiscalCode.toUpperCase().trim();
      }

      // Validazione Server-Side Duplicati (CF, Email, Telefono)
      if (normalizedData.fiscalCode) {
        const cfConflict = await checkCF(normalizedData.fiscalCode);
        if (!cfConflict.available) {
          return res.status(409).json({
            error: 'CF_DUPLICATO',
            message: 'Codice fiscale già presente',
            conflict: cfConflict.conflict
          });
        }
      }

      if (normalizedData.email && !isMinorAge(normalizedData.dateOfBirth)) {
        const emailConflict = await checkEmail(normalizedData.email, false);
        if (!emailConflict.available) {
          return res.status(409).json({
            error: 'EMAIL_DUPLICATA',
            message: 'Email già associata ad altro socio',
            conflict: emailConflict.conflict
          });
        }
      }

      const phoneToCheck = normalizedData.mobile || normalizedData.phone;
      if (phoneToCheck && !isMinorAge(normalizedData.dateOfBirth)) {
        const phoneConflict = await checkPhone(phoneToCheck, false);
        if (!phoneConflict.available) {
          return res.status(409).json({
            error: 'TELEFONO_DUPLICATO',
            message: 'Telefono già associato ad altro socio',
            conflict: phoneConflict.conflict
          });
        }
      }

      // Check for duplicate fiscal code
      // Comprehensive duplicate check (Name, Email, Phone, Fiscal Code)
      const duplicateCheck = await storage.checkDuplicateParticipant(normalizedData);
      if (duplicateCheck.isDuplicate) {
        return res.status(409).json({
          message: duplicateCheck.message,
          conflict: true
        });
      }

      if (req.user) {
        normalizedData.createdBy = req.user.username || 'System';
        normalizedData.updatedBy = req.user.username || 'System'; // Initialize updatedBy on creation as well
      }

      const member = await storage.createMember(normalizedData);
      await logUserActivity(req, "CREATE", "members", member.id.toString(), { name: `${member.firstName} ${member.lastName}` });
      res.status(201).json(member);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create member" });
    }
  });

  app.patch("/api/members/:id", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Handle instructor intercept
      if (id >= 1000000) {
        const realId = id - 1000000;
        const { firstName, lastName, email, phone } = req.body;

        const instructorUpdate: any = {};
        if (firstName !== undefined) instructorUpdate.firstName = firstName;
        if (lastName !== undefined) instructorUpdate.lastName = lastName;
        if (email !== undefined) instructorUpdate.email = email;
        if (phone !== undefined) instructorUpdate.phone = phone;

        // Instructors don't have separate PATCH yet, keep current code if minimal
        if (!instructorUpdate.firstName && !instructorUpdate.lastName) {
          // If no name fields are provided, we might not need to update
          // Or handle as an error if name is mandatory
        }

        // Comprehensive duplicate check for instructors (Name, Email, Phone, Fiscal Code)
        // Note: Instructors don't have fiscalCode in the current model, but this function handles it.
        const duplicateCheck = await storage.checkDuplicateParticipant(instructorUpdate, realId + 1000000);
        if (duplicateCheck.isDuplicate) {
          return res.status(409).json({
            message: duplicateCheck.message,
            conflict: true
          });
        }

        const updatedInstructor = await storage.updateInstructor(realId, instructorUpdate);
        await logUserActivity(req, "UPDATE", "instructors", realId.toString(), { name: `${updatedInstructor.firstName} ${updatedInstructor.lastName}` });

        // Return simulated Member response
        const fakeMember = await storage.getMember(id);
        return res.json(fakeMember);
      }

      const normalizeEmpty = (val: any): any => {
        if (val === "" || val === undefined) return null;
        if (typeof val === "string" && val.trim() === "") return null;
        return val;
      };
      const normalizedData: any = {};
      const sanitizedBody = sanitizeMemberData(req.body);
      for (const [key, value] of Object.entries(sanitizedBody)) {
        if (key === 'photoUrl') {
          // Explicitly allow null/string for photoUrl
          normalizedData[key] = value;
        } else {
          normalizedData[key] = normalizeEmpty(value);
        }
      }

      // Normalize fiscal code to uppercase
      if (normalizedData.fiscalCode) {
        normalizedData.fiscalCode = normalizedData.fiscalCode.toUpperCase().trim();
      }

      // Validazione Server-Side Duplicati (CF, Email, Telefono)
      if (normalizedData.fiscalCode) {
        const cfConflict = await checkCF(normalizedData.fiscalCode, id); // pass ID for PATCH
        if (!cfConflict.available) {
          return res.status(409).json({
            error: 'CF_DUPLICATO',
            message: 'Codice fiscale già presente',
            conflict: cfConflict.conflict
          });
        }
      }

      if (normalizedData.email && !isMinorAge(normalizedData.dateOfBirth)) {
        const emailConflict = await checkEmail(normalizedData.email, false, id);
        if (!emailConflict.available) {
          return res.status(409).json({
            error: 'EMAIL_DUPLICATA',
            message: 'Email già associata ad altro socio',
            conflict: emailConflict.conflict
          });
        }
      }

      const patchPhoneToCheck = normalizedData.mobile || normalizedData.phone;
      if (patchPhoneToCheck && !isMinorAge(normalizedData.dateOfBirth)) {
        const phoneConflict = await checkPhone(patchPhoneToCheck, false, id);
        if (!phoneConflict.available) {
          return res.status(409).json({
            error: 'TELEFONO_DUPLICATO',
            message: 'Telefono già associato ad altro socio',
            conflict: phoneConflict.conflict
          });
        }
      }

      // Comprehensive duplicate check (Name, Email, Phone, Fiscal Code)
      const duplicateCheck = await storage.checkDuplicateParticipant(normalizedData, id);
      if (duplicateCheck.isDuplicate) {
        return res.status(409).json({
          message: duplicateCheck.message,
          conflict: true
        });
      }

      if (req.user) {
        normalizedData.updatedBy = req.user.username || 'System';
      }

      const updatedMember = await storage.updateMember(id, normalizedData);
      await logUserActivity(req, "UPDATE", "members", id.toString(), { name: `${updatedMember.firstName} ${updatedMember.lastName}` });
      res.json(updatedMember);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update member" });
    }
  });

  app.delete("/api/members/:id", isAuthenticated, checkPermission("/anagrafica_a_lista", "write"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Handle instructor deletion intercept
      if (id >= 1000000) {
        const realId = id - 1000000;
        const instructorToDelete = await storage.getInstructor(realId);
        await storage.deleteInstructor(realId);
        await logUserActivity(req, "DELETE", "instructors", realId.toString(), { name: `${instructorToDelete?.firstName} ${instructorToDelete?.lastName}` });
        return res.status(204).send();
      }

      const memberToDelete = await storage.getMember(id);
      await storage.deleteMember(id);
      await logUserActivity(req, "DELETE", "members", id.toString(), { name: `${memberToDelete?.firstName} ${memberToDelete?.lastName}` });
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

}
