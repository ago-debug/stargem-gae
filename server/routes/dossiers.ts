import { type Express } from "express";
import { db } from "../db";
import { dossiers, dossierSteps, dossierAuditLog, members } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { validateDossierCompletion } from "../utils/dossierBusinessRules";
import { differenceInYears } from "date-fns";

export function registerDossierRoutes(app: Express) {
  
  // POST /api/dossiers
  app.post("/api/dossiers", async (req, res) => {
    try {
      const { member_id, dossier_type, extra_data } = req.body;
      const tenantId = (req.user as any)?.tenantId || '1';
      const createdBy = (req.user as any)?.id || null;

      if (!member_id || !dossier_type) {
        return res.status(400).json({ error: "member_id e dossier_type sono richiesti" });
      }

      const memberRes = await db.select().from(members).where(eq(members.id, member_id));
      if (memberRes.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }
      const member = memberRes[0];

      const [insertResult] = await db.insert(dossiers).values({
        memberId: member_id,
        dossierType: dossier_type,
        status: 'bozza',
        createdBy: createdBy,
        extraData: extra_data,
        tenantId
      });
      
      const dossierId = insertResult.insertId;

      // Define default steps based on type
      let requiredSteps: string[] = [];
      if (dossier_type === 'iscrizione_corso') {
        requiredSteps = ['anagrafica', 'certificato_medico', 'pagamento', 'tesseramento', 'iscrizione_attivita'];
      } else if (dossier_type === 'rinnovo' || dossier_type === 'nuovo_iscritto') {
        requiredSteps = ['anagrafica', 'documenti', 'pagamento', 'tesseramento'];
      } else {
        requiredSteps = ['anagrafica'];
      }

      const isMinor = differenceInYears(new Date(), new Date(member.dateOfBirth || new Date())) < 18;
      if (isMinor && !requiredSteps.includes('tutori')) {
        requiredSteps.splice(1, 0, 'tutori'); // insert after anagrafica
      }

      for (const stepName of requiredSteps) {
        await db.insert(dossierSteps).values({
          dossierId,
          stepName: stepName as any,
          status: 'pending',
          tenantId
        });
      }

      await db.insert(dossierAuditLog).values({
        dossierId,
        action: 'created',
        performedBy: createdBy,
        tenantId,
        details: { type: dossier_type, steps: requiredSteps }
      });

      const stepsRes = await db.select().from(dossierSteps).where(eq(dossierSteps.dossierId, dossierId));

      res.json({ dossier_id: dossierId, steps: stepsRes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // GET /api/dossiers
  app.get("/api/dossiers", async (req, res) => {
    try {
      const { member_id, status, dossier_type, limit = 50, offset = 0 } = req.query;
      const tenantId = (req.user as any)?.tenantId || '1';

      const conditions = [eq(dossiers.tenantId, tenantId)];
      if (member_id) conditions.push(eq(dossiers.memberId, Number(member_id)));
      if (status) conditions.push(eq(dossiers.status, status as any));
      if (dossier_type) conditions.push(eq(dossiers.dossierType, dossier_type as any));

      const list = await db.select().from(dossiers)
        .where(and(...conditions))
        .limit(Number(limit))
        .offset(Number(offset));
      
      res.json(list);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // GET /api/dossiers/:id
  app.get("/api/dossiers/:id", async (req, res) => {
    try {
      const dossierId = Number(req.params.id);
      
      const dossierRes = await db.select().from(dossiers).where(eq(dossiers.id, dossierId));
      if (dossierRes.length === 0) return res.status(404).json({ error: "Dossier not found" });
      
      const steps = await db.select().from(dossierSteps).where(eq(dossierSteps.dossierId, dossierId));
      const auditLog = await db.select().from(dossierAuditLog).where(eq(dossierAuditLog.dossierId, dossierId));

      res.json({
        ...dossierRes[0],
        steps,
        auditLog
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // PATCH /api/dossiers/:id/step
  app.patch("/api/dossiers/:id/step", async (req, res) => {
    try {
      const dossierId = Number(req.params.id);
      const { step_name, status, blocking_reason } = req.body;
      const tenantId = (req.user as any)?.tenantId || '1';
      const performedBy = (req.user as any)?.id || null;

      const stepRes = await db.select().from(dossierSteps)
        .where(and(eq(dossierSteps.dossierId, dossierId), eq(dossierSteps.stepName, step_name)));
      
      if (stepRes.length === 0) return res.status(404).json({ error: "Step not found for this dossier" });

      await db.update(dossierSteps)
        .set({ 
          status: status as any, 
          blockingReason: blocking_reason || null,
          completedAt: (status === 'completed' || status === 'skipped') ? new Date() : null,
          completedBy: performedBy
        })
        .where(eq(dossierSteps.id, stepRes[0].id));
      
      await db.insert(dossierAuditLog).values({
        dossierId,
        action: status === 'blocked' ? 'step_blocked' : 'step_completed',
        performedBy,
        tenantId,
        details: { step_name, status, blocking_reason }
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // POST /api/dossiers/:id/complete
  app.post("/api/dossiers/:id/complete", async (req, res) => {
    try {
      const dossierId = Number(req.params.id);
      const tenantId = (req.user as any)?.tenantId || '1';
      const performedBy = (req.user as any)?.id || null;

      const validation = await validateDossierCompletion(dossierId);
      
      if (!validation.ok) {
        return res.status(400).json({ error: "Validazione fallita", details: validation.errors });
      }

      await db.update(dossiers)
        .set({ status: 'completato', completedAt: new Date() })
        .where(eq(dossiers.id, dossierId));

      await db.insert(dossierAuditLog).values({
        dossierId,
        action: 'completed',
        performedBy,
        tenantId
      });

      res.json({ success: true, message: "Dossier completato" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // DELETE /api/dossiers/:id (soft delete)
  app.delete("/api/dossiers/:id", async (req, res) => {
    try {
      const dossierId = Number(req.params.id);
      const tenantId = (req.user as any)?.tenantId || '1';
      const performedBy = (req.user as any)?.id || null;

      await db.update(dossiers)
        .set({ status: 'annullato' })
        .where(eq(dossiers.id, dossierId));

      await db.insert(dossierAuditLog).values({
        dossierId,
        action: 'annullato',
        performedBy,
        tenantId
      });

      res.json({ success: true, message: "Dossier annullato" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // GET /api/dossiers/:id/required-steps
  app.get("/api/dossiers/:id/required-steps", async (req, res) => {
    try {
      const dossierId = Number(req.params.id);
      const steps = await db.select().from(dossierSteps).where(eq(dossierSteps.dossierId, dossierId));
      
      res.json({ required_steps: steps.map(s => ({ name: s.stepName, status: s.status })) });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
}
