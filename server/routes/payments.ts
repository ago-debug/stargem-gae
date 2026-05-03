import { type Express, type Request, type Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { insertPaymentSchema, insertPaymentMethodSchema, insertPaymentNoteSchema } from "@shared/schema";

export function registerPaymentRoutes(app: Express, ctx: { checkPermission: Function, logUserActivity: Function }) {
  const { checkPermission, logUserActivity } = ctx;

  // ==== Payment Methods Routes ====
  app.get("/api/payment-methods", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const methods = await storage.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.post("/api/payment-methods", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPaymentMethodSchema.parse(req.body);
      const method = await storage.createPaymentMethod(validatedData);
      res.status(201).json(method);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create payment method" });
    }
  });

  app.patch("/api/payment-methods/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const method = await storage.updatePaymentMethod(id, req.body);
      res.json(method);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update payment method" });
    }
  });

  app.delete("/api/payment-methods/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePaymentMethod(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to delete payment method" });
    }
  });

  // ==== Payments Routes ====
  app.get("/api/payments", isAuthenticated, checkPermission("/pagamenti", "read") as any, async (req: Request, res: Response) => {
    try {
      const seasonId = req.query.seasonId ? parseInt(req.query.seasonId as string) : null;
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : null;

      let paymentsList;
      if (memberId) {
        paymentsList = await storage.getPaymentsByMemberId(memberId);
      } else if (seasonId) {
        paymentsList = await storage.getPaymentsBySeason(seasonId);
      } else {
        const activeSeason = await storage.getActiveSeason();
        if (activeSeason) {
          paymentsList = await storage.getPaymentsBySeason(activeSeason.id);
        } else {
          paymentsList = await storage.getPaymentsWithMembers();
        }
      }
      res.json(paymentsList);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", isAuthenticated, checkPermission("/pagamenti", "write") as any, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);

      // Strict Validation: Prevent Orphan Payments
       const hasValidRelation =
        validatedData.enrollmentId ||
        validatedData.bookingId ||
        validatedData.membershipId;

      if (!hasValidRelation) {
        throw new Error("Salvataggio bloccato per sicurezza: Il pagamento non è associato ad alcuna attività, iscrizione o tesseramento. Seleziona prima un'attività (Corsi, Workshop, ecc.) da pagare.");
      }

      // Strict Validation: Consistency for Paid Payments
      if (validatedData.status === "paid") {
        if (!validatedData.paymentMethodId) {
          throw new Error("Sicurezza Pagamenti: Impossibile impostare lo stato 'Pagato' senza un Metodo di Pagamento specificato.");
        }
        if (!validatedData.paidDate) {
          validatedData.paidDate = new Date();
        }
      }

      // Strict Validation: Prevent Negative Amounts
      if (validatedData.amount != null && Number(validatedData.amount) < 0) {
        throw new Error("Sicurezza Pagamenti: L'importo del pagamento non può essere negativo.");
      }

      const payment = await storage.createPayment({
        ...validatedData,
        createdById: (req.user as any).id
      });
      res.status(201).json(payment);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create payment" });
    }
  });

  app.patch("/api/payments/:id", isAuthenticated, checkPermission("/pagamenti", "write") as any, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPaymentSchema.partial().parse(req.body);

      // Fetch existing to merge state for validation
      const existingPayment = await storage.getPayment(id);
      if (!existingPayment) {
        throw new Error("Pagamento non trovato.");
      }

      const nextStatus = validatedData.status !== undefined ? validatedData.status : existingPayment.status;
      const nextMethod = validatedData.paymentMethodId !== undefined ? validatedData.paymentMethodId : existingPayment.paymentMethodId;
      const nextAmount = validatedData.amount !== undefined ? validatedData.amount : existingPayment.amount;

      // Strict Validation: Consistency for Paid Payments
      if (nextStatus === "paid") {
        if (!nextMethod) {
          throw new Error("Sicurezza Pagamenti: Impossibile impostare lo stato 'Pagato' senza un Metodo di Pagamento specificato.");
        }
        if (validatedData.status === "paid" && !existingPayment.paidDate && !validatedData.paidDate) {
           validatedData.paidDate = new Date();
        }
      }

      // Strict Validation: Prevent Negative Amounts
      if (nextAmount != null && Number(nextAmount) < 0) {
        throw new Error("Sicurezza Pagamenti: L'importo del pagamento non può essere negativo.");
      }

      const payment = await storage.updatePayment(id, {
        ...validatedData,
        updatedById: (req.user as any).id
      });
      res.json(payment);
    } catch (error: any) {
      console.error("Error updating payment:", error);
      res.status(400).json({ message: error.message || "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", isAuthenticated, checkPermission("/pagamenti", "write") as any, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      const payment = await storage.getPayment(id);
      if (payment) {
        // Crea audit log per l'eliminazione
        await storage.createAuditLog({
          action: "DELETE",
          entityType: "payments",
          entityId: id,
          performedBy: (req.user as any)?.username || "Sistema",
          details: JSON.stringify(payment)
        });
      }

      await storage.deletePayment(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      res.status(400).json({ message: error.message || "Failed to delete payment" });
    }
  });

  // ==== Payment Notes Routes ====
  app.get("/api/payment-notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const notes = await storage.getPaymentNotes();
      res.json(notes);
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to fetch payment notes" });
    }
  });

  app.post("/api/payment-notes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPaymentNoteSchema.parse(req.body);
      const note = await storage.createPaymentNote(validatedData);
      await logUserActivity(req as any, "CREATE", "payment_notes", note.id.toString(), { name: note.name });
      res.status(201).json(note);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to create payment note" });
    }
  });

  app.patch("/api/payment-notes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.updatePaymentNote(id, req.body);
      await logUserActivity(req as any, "UPDATE", "payment_notes", id.toString(), { name: note.name });
      res.json(note);
    } catch (error: any) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(400).json({ message: error.message || "Failed to update payment note" });
    }
  });

  app.delete("/api/payment-notes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const noteToDelete = await storage.getPaymentNote(id);
      if (noteToDelete) {
        await logUserActivity(req as any, "DELETE", "payment_notes", id.toString(), { name: noteToDelete.name });
      }
      await storage.deletePaymentNote(id);
      res.status(204).send();
    } catch (error) {
      console.error("[API Error] Caught explicitly:", error);
      res.status(500).json({ message: "Failed to delete payment note" });
    }
  });
}
