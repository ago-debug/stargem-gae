import { type Express } from "express";
import { db } from "../db";
import { externalPayers, societies, payments, paymentParticipants, members, type Member } from "@shared/schema";
import { eq, like, desc, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { determineDocumentType } from "../utils/documentType";

export function registerMC3PagamentiRoutes(app: Express) {
  
  // ==========================================
  // EXTERNAL PAYERS
  // ==========================================
  app.post("/api/external-payers", async (req, res) => {
    try {
      const tenantId = (req.user as any)?.tenantId || '1';
      const data = { 
        businessName: req.body.business_name,
        fiscalCode: req.body.fiscal_code,
        vatNumber: req.body.vat_number,
        address: req.body.address,
        notes: req.body.notes,
        tenantId 
      };
      const [result] = await db.insert(externalPayers).values(data);
      res.status(201).json({ id: result.insertId, ...data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/external-payers/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const rows = await db.select().from(externalPayers).where(eq(externalPayers.id, id));
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/external-payers", async (req, res) => {
    try {
      const tenantId = (req.user as any)?.tenantId || '1';
      const { search, limit = 50, offset = 0 } = req.query;
      
      let conditions: any[] = [eq(externalPayers.tenantId, tenantId)];
      if (search) {
        conditions.push(like(externalPayers.businessName, `%${search}%`));
      }

      const rows = await db.select().from(externalPayers)
        .where(and(...conditions))
        .limit(Number(limit))
        .offset(Number(offset));
      
      res.json(rows);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.patch("/api/external-payers/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data: any = {};
      if (req.body.business_name !== undefined) data.businessName = req.body.business_name;
      if (req.body.fiscal_code !== undefined) data.fiscalCode = req.body.fiscal_code;
      if (req.body.vat_number !== undefined) data.vatNumber = req.body.vat_number;
      if (req.body.address !== undefined) data.address = req.body.address;
      if (req.body.notes !== undefined) data.notes = req.body.notes;

      await db.update(externalPayers).set(data).where(eq(externalPayers.id, id));
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/external-payers/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      // Delete (hard or soft depending on setup, here hard delete since no deleted_at is requested by schema)
      await db.delete(externalPayers).where(eq(externalPayers.id, id));
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ==========================================
  // SOCIETIES
  // ==========================================
  app.post("/api/societies", async (req, res) => {
    try {
      const tenantId = (req.user as any)?.tenantId || '1';
      const data = { 
        businessName: req.body.business_name,
        fiscalCode: req.body.fiscal_code,
        vatNumber: req.body.vat_number,
        address: req.body.address,
        isWelfareProvider: req.body.is_welfare_provider,
        welfareFormula: req.body.welfare_formula,
        voucherProvider: req.body.voucher_provider,
        billingFrequency: req.body.billing_frequency,
        active: req.body.active !== undefined ? req.body.active : true,
        tenantId 
      };
      const [result] = await db.insert(societies).values(data);
      res.status(201).json({ id: result.insertId, ...data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/societies/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const rows = await db.select().from(societies).where(eq(societies.id, id));
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(rows[0]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/societies", async (req, res) => {
    try {
      const tenantId = (req.user as any)?.tenantId || '1';
      const { search, is_welfare_provider, limit = 50, offset = 0 } = req.query;
      
      let conditions: any[] = [eq(societies.tenantId, tenantId), eq(societies.active, true)];
      if (search) conditions.push(like(societies.businessName, `%${search}%`));
      if (is_welfare_provider === 'true') conditions.push(eq(societies.isWelfareProvider, true));

      const rows = await db.select().from(societies)
        .where(and(...conditions))
        .limit(Number(limit))
        .offset(Number(offset));
      
      res.json(rows);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.patch("/api/societies/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data: any = {};
      if (req.body.business_name !== undefined) data.businessName = req.body.business_name;
      if (req.body.fiscal_code !== undefined) data.fiscalCode = req.body.fiscal_code;
      if (req.body.vat_number !== undefined) data.vatNumber = req.body.vat_number;
      if (req.body.address !== undefined) data.address = req.body.address;
      if (req.body.is_welfare_provider !== undefined) data.isWelfareProvider = req.body.is_welfare_provider;
      if (req.body.welfare_formula !== undefined) data.welfareFormula = req.body.welfare_formula;
      if (req.body.voucher_provider !== undefined) data.voucherProvider = req.body.voucher_provider;
      if (req.body.billing_frequency !== undefined) data.billingFrequency = req.body.billing_frequency;
      if (req.body.active !== undefined) data.active = req.body.active;

      await db.update(societies).set(data).where(eq(societies.id, id));
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/societies/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      await db.update(societies).set({ active: false }).where(eq(societies.id, id));
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ==========================================
  // MULTI-PARTICIPANT PAYMENTS
  // ==========================================
  app.post("/api/payments/multi-participant", async (req, res) => {
    try {
      const tenantId = (req.user as any)?.tenantId || '1';
      const createdById = (req.user as any)?.id ? String((req.user as any).id) : null;
      const {
        payer_id, payer_type,
        billing_subject_id, billing_subject_type,
        document_type,
        participants, // array of { member_id, activity_type, activity_id, amount }
        payment_method, total_amount, gift_card_amount = 0
      } = req.body;

      if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ error: "Richiesti participants" });
      }

      // Validations
      const sumParticipants = participants.reduce((acc, p) => acc + Number(p.amount), 0);
      const balanceAmount = Number(total_amount) - Number(gift_card_amount);
      
      if (Math.abs(sumParticipants - balanceAmount) > 0.01) {
        return res.status(400).json({ error: "La somma degli amount attribuiti deve essere uguale a total_amount - gift_card_amount" });
      }

      const paymentGroupId = uuidv4();
      const createdParticipants = [];
      let mainPaymentId = null;

      // Se non fornito, possiamo dedurre il tipo documento dinamicamente (Step 6) 
      // ma in questo endpoint diamo per scontato che possa essere passato dal frontend,
      // altrimenti potremmo ricalcolarlo usando `determineDocumentType`.
      const docTypeToUse = document_type || 'ricevuta_istituzionale';

      const [paymentResult] = await db.insert(payments).values({
        amount: String(total_amount),
        type: 'multi',
        status: 'paid',
        paidDate: new Date(),
        paymentMethod: payment_method,
        createdById,
        payerId: payer_id,
        payerType: payer_type as any,
        billingSubjectId: billing_subject_id,
        billingSubjectType: billing_subject_type as any,
        documentType: docTypeToUse as any,
        paymentGroupId,
        giftCardAmount: String(gift_card_amount),
        balanceAmount: String(balanceAmount)
      });

      mainPaymentId = paymentResult.insertId;

      for (const p of participants) {
        await db.insert(paymentParticipants).values({
          paymentId: mainPaymentId,
          memberId: p.member_id,
          activityType: p.activity_type as any,
          activityId: p.activity_id,
          amountAttributed: String(p.amount),
          tenantId
        });
      }

      const partsRes = await db.select().from(paymentParticipants).where(eq(paymentParticipants.paymentId, mainPaymentId));

      res.status(201).json({
        payment_id: mainPaymentId,
        payment_group_id: paymentGroupId,
        participants: partsRes
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ==========================================
  // PAYMENT HISTORY AGGIORNATO (MEMBER)
  // ==========================================
  app.get("/api/members/:id/payments-history", async (req, res) => {
    try {
      const memberId = Number(req.params.id);
      
      // 1. Pagamenti diretti vecchi (senza partecipanti) + pagamenti dove member è payer
      const directPayments = await db.select().from(payments)
        .where(
          and(
             eq(payments.memberId, memberId), 
             // exclude payments that have payerType external or society if it's not member?
             // well we just check if member is the payer or the direct legacy memberId
             // For MC3 logic, memberId is legacy, payerId/payerType is new
          )
        );
        
      const payerPayments = await db.select().from(payments)
        .where(
           and(eq(payments.payerId, memberId), eq(payments.payerType, 'member'))
        );

      // 2. Pagamenti dove member è partecipante (via payment_participants)
      const participantRows = await db.select().from(paymentParticipants)
        .where(eq(paymentParticipants.memberId, memberId));
        
      const pIds = participantRows.map(p => p.paymentId);
      
      let participantPayments: any[] = [];
      if (pIds.length > 0) {
        participantPayments = await db.select().from(payments)
          .where(inArray(payments.id, pIds));
      }
      
      // Merge results avoiding duplicates
      const allPaymentsMap = new Map();
      [...directPayments, ...payerPayments, ...participantPayments].forEach(p => {
        allPaymentsMap.set(p.id, p);
      });
      
      const allPayments = Array.from(allPaymentsMap.values()).sort((a, b) => {
        return (new Date(b.createdAt as any).getTime()) - (new Date(a.createdAt as any).getTime());
      });

      res.json(allPayments);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

}
