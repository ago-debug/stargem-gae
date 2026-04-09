import fs from 'fs';

const storagePath = 'server/storage.ts';
const routesPath = 'server/routes.ts';

// -------------------------------------------------------------
// PATCH STORAGE.TS
// -------------------------------------------------------------
let storageContent = fs.readFileSync(storagePath, 'utf8');

// Add imports
if (!storageContent.includes('promoRules')) {
  storageContent = storageContent.replace(
    '  courses,',
    '  courses,\n  promoRules,\n  welfareProviders,\n  carnetWallets,\n  carnetSessions,\n  instructorAgreements,\n  agreementMonthlyOverrides,\n  pagodilTiers,\n  costCenters,\n  accountingPeriods,\n  journalEntries,\n  customListItems,'
  );
}

const iStoragePatch = `
  // Quote & Promo Module
  getPromoRules(query: any): Promise<any[]>;
  createPromoRule(data: any): Promise<any>;
  updatePromoRule(id: number, data: any): Promise<any>;
  deletePromoRule(id: number): Promise<void>;
  incrementPromoRuleUse(id: number): Promise<void>;
  
  getWelfareProviders(): Promise<any[]>;
  updateWelfareProvider(id: number, data: any): Promise<any>;

  getCarnetWallets(query: any): Promise<any[]>;
  createCarnetWallet(data: any): Promise<any>;
  useCarnetWallet(id: number, sessionData: any): Promise<{ wallet: any, session: any }>;
  getCarnetSessions(walletId: number): Promise<any[]>;

  getInstructorAgreements(query: any): Promise<any[]>;
  createInstructorAgreement(data: any, overrides?: any[]): Promise<any>;
  updateInstructorAgreement(id: number, data: any, overrides?: any[]): Promise<any>;
  deleteInstructorAgreement(id: number): Promise<void>;
  createInstructorPayment(id: number, paymentData: any): Promise<any>;

  getPagodilTiers(): Promise<any[]>;

  // Base Accounting
  getCostCenters(): Promise<any[]>;
  getAccountingPeriods(query: any): Promise<any[]>;
  getJournalEntries(query: any): Promise<any>;
  createJournalEntry(data: any): Promise<any>;
`;

if (!storageContent.includes('getPromoRules(query')) {
  storageContent = storageContent.replace(
    `  deleteStrategicEvent(id: number): Promise<void>;\n}`,
    `  deleteStrategicEvent(id: number): Promise<void>;\n${iStoragePatch}\n}`
  );
}

const dbStoragePatch = `
  // ============================================
  // PROMO RULES
  // ============================================
  async getPromoRules(query: any) {
    let conditions = [];
    if (query.targetType) conditions.push(eq(promoRules.targetType, query.targetType));
    if (query.active !== undefined) conditions.push(eq(promoRules.isActive, query.active === "true"));
    if (query.search) conditions.push(ilike(promoRules.code, \`%\${query.search}%\`));
    
    const results = await db.select().from(promoRules)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(promoRules.createdAt));
      
    const today = new Date();
    today.setHours(0,0,0,0);
    return results.map(r => ({
      ...r,
      isExpired: r.validTo ? new Date(r.validTo) < today : false
    }));
  }

  async createPromoRule(data: any) {
    const [result] = await db.insert(promoRules).values(data);
    const [rule] = await db.select().from(promoRules).where(eq(promoRules.id, result.insertId));
    return rule;
  }

  async updatePromoRule(id: number, data: any) {
    await db.update(promoRules).set({...data, updatedAt: new Date()}).where(eq(promoRules.id, id));
    const [rule] = await db.select().from(promoRules).where(eq(promoRules.id, id));
    return rule;
  }

  async deletePromoRule(id: number) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    await db.update(promoRules).set({ validTo: dateStr }).where(eq(promoRules.id, id));
  }

  async incrementPromoRuleUse(id: number) {
    await db.update(promoRules)
      .set({ usedCount: sql\`\${promoRules.usedCount} + 1\` })
      .where(eq(promoRules.id, id));
  }

  // ============================================
  // WELFARE PROVIDERS
  // ============================================
  async getWelfareProviders() {
    return await db.select().from(welfareProviders).orderBy(asc(welfareProviders.name));
  }

  async updateWelfareProvider(id: number, data: any) {
    await db.update(welfareProviders).set(data).where(eq(welfareProviders.id, id));
    const [provider] = await db.select().from(welfareProviders).where(eq(welfareProviders.id, id));
    return provider;
  }

  // ============================================
  // CARNET WALLETS
  // ============================================
  async getCarnetWallets(query: any) {
    let conditions = [];
    if (query.active !== undefined) conditions.push(eq(carnetWallets.isActive, query.active === "true"));
    if (query.memberId) conditions.push(eq(carnetWallets.memberId, parseInt(query.memberId)));
    if (query.type) conditions.push(eq(carnetWallets.walletType, query.type));
    
    if (query.expiring) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + parseInt(query.expiring));
      const ds = targetDate.toISOString().split('T')[0];
      conditions.push(lte(carnetWallets.expiresAt, ds));
      conditions.push(gte(carnetWallets.expiresAt, new Date().toISOString().split('T')[0]));
    }

    const customTypesListQuery = db.select({id: customLists.id}).from(customLists).where(eq(customLists.systemName, "wallet_types")).limit(1);

    const results = await db.select({
      wallet: carnetWallets,
      member: members,
      typeLabel: customListItems.label
    })
    .from(carnetWallets)
    .leftJoin(members, eq(carnetWallets.memberId, members.id))
    .leftJoin(customListItems, and(
      eq(customListItems.value, carnetWallets.walletType),
      // we handle the system name indirectly by hoping values are unique, or just safely getting it
      isNotNull(customListItems.id) // simplistic
    ))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(carnetWallets.createdAt));

    const today = new Date();
    today.setHours(0,0,0,0);
    
    // De-duplicate customListItems if join multiples
    const seen = new Set();
    const finalResults = [];
    for(const r of results) {
        if(!seen.has(r.wallet.id)) {
            seen.add(r.wallet.id);
            const expiresAt = new Date(r.wallet.expiresAt);
            const diffMs = expiresAt.getTime() - today.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            finalResults.push({
                ...r.wallet,
                memberName: r.member ? \`\${r.member.firstName} \${r.member.lastName}\` : null,
                typeLabel: r.typeLabel || r.wallet.walletType,
                remainingUnits: r.wallet.totalUnits - r.wallet.usedUnits,
                isExpired: diffDays < 0,
                daysToExpiry: diffDays
            });
        }
    }
    return finalResults;
  }

  async createCarnetWallet(data: any) {
    const purchasedAtStr = data.purchasedAt || new Date().toISOString().split('T')[0];
    const purchasedAt = new Date(purchasedAtStr);
    const expiresAt = new Date(purchasedAt);
    expiresAt.setDate(expiresAt.getDate() + data.expiryDays);
    const expiresAtStr = expiresAt.toISOString().split('T')[0];
    
    const [result] = await db.insert(carnetWallets).values({
        ...data,
        purchasedAt: purchasedAtStr,
        expiresAt: expiresAtStr,
        usedUnits: 0,
        isActive: true
    });
    const [wallet] = await db.select().from(carnetWallets).where(eq(carnetWallets.id, result.insertId));
    return wallet;
  }

  async useCarnetWallet(id: number, sessionData: any) {
    const [wallet] = await db.select().from(carnetWallets).where(eq(carnetWallets.id, id));
    if (!wallet || !wallet.isActive || wallet.usedUnits >= wallet.totalUnits) {
        throw new Error("Wallet non attivo o esaurito.");
    }
    
    const [maxSess] = await db.select({ max: sql<number>\`MAX(session_number)\` })
        .from(carnetSessions)
        .where(eq(carnetSessions.walletId, id));
    const nextSession = (maxSess?.max || 0) + 1;
    
    const [res] = await db.insert(carnetSessions).values({
        walletId: id,
        sessionNumber: nextSession,
        sessionDate: sessionData.sessionDate,
        sessionTimeStart: sessionData.sessionTimeStart,
        sessionTimeEnd: sessionData.sessionTimeEnd,
        instructorId: sessionData.instructorId,
        notes: sessionData.notes
    });
    
    const newUsed = wallet.usedUnits + 1;
    const isActive = newUsed < wallet.totalUnits;
    
    await db.update(carnetWallets)
        .set({ usedUnits: newUsed, isActive, updatedAt: new Date() })
        .where(eq(carnetWallets.id, id));
        
    const [updatedWallet] = await db.select().from(carnetWallets).where(eq(carnetWallets.id, id));
    const [session] = await db.select().from(carnetSessions).where(eq(carnetSessions.id, res.insertId));
    
    return { wallet: updatedWallet, session };
  }

  async getCarnetSessions(walletId: number) {
    const results = await db.select({
      session: carnetSessions,
      instructor: members
    })
    .from(carnetSessions)
    .leftJoin(members, eq(carnetSessions.instructorId, members.id))
    .where(eq(carnetSessions.walletId, walletId))
    .orderBy(asc(carnetSessions.sessionNumber));
    
    return results.map(r => ({
      ...r.session,
      instructorName: r.instructor ? \`\${r.instructor.firstName} \${r.instructor.lastName}\` : null
    }));
  }

  // ============================================
  // INSTRUCTOR AGREEMENTS
  // ============================================
  async getInstructorAgreements(query: any) {
    let conditions = [];
    if (query.active !== undefined) conditions.push(eq(instructorAgreements.isActive, query.active === "true"));
    if (query.seasonId) conditions.push(eq(instructorAgreements.seasonId, parseInt(query.seasonId)));
    
    const results = await db.select({
      agr: instructorAgreements,
      member: members,
      studio: studios
    })
    .from(instructorAgreements)
    .leftJoin(members, eq(instructorAgreements.memberId, members.id))
    .leftJoin(studios, eq(instructorAgreements.studioId, studios.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(instructorAgreements.createdAt));
    
    const agrs = results.map(r => ({
      ...r.agr,
      memberName: r.member ? \`\${r.member.firstName} \${r.member.lastName}\` : null,
      studioName: r.studio?.name || null,
      overrides: []
    }));
    
    if (agrs.length > 0) {
        const ids = agrs.map(a => a.id);
        const ovs = await db.select().from(agreementMonthlyOverrides).where(inArray(agreementMonthlyOverrides.agreementId, ids));
        for (const a of agrs) {
            a.overrides = (ovs as any[]).filter(o => o.agreementId === a.id);
        }
    }
    return agrs;
  }

  async createInstructorAgreement(data: any, overrides?: any[]) {
    const [res] = await db.insert(instructorAgreements).values(data);
    const id = res.insertId;
    if (data.agreementType === "variable_monthly" && overrides && overrides.length > 0) {
        await db.insert(agreementMonthlyOverrides).values(
            overrides.map(o => ({ ...o, agreementId: id }))
        );
    }
    const [agr] = await db.select().from(instructorAgreements).where(eq(instructorAgreements.id, id));
    return agr;
  }

  async updateInstructorAgreement(id: number, data: any, overrides?: any[]) {
    await db.update(instructorAgreements).set({...data, updatedAt: new Date()}).where(eq(instructorAgreements.id, id));
    if (data.agreementType === "variable_monthly" && overrides) {
        await db.delete(agreementMonthlyOverrides).where(eq(agreementMonthlyOverrides.agreementId, id));
        if (overrides.length > 0) {
            await db.insert(agreementMonthlyOverrides).values(
                overrides.map(o => ({ ...o, agreementId: id }))
            );
        }
    }
    const [agr] = await db.select().from(instructorAgreements).where(eq(instructorAgreements.id, id));
    return agr;
  }

  async deleteInstructorAgreement(id: number) {
    await db.update(instructorAgreements).set({ isActive: false }).where(eq(instructorAgreements.id, id));
  }

  async createInstructorPayment(id: number, paymentData: any) {
    const [agr] = await db.select().from(instructorAgreements).where(eq(instructorAgreements.id, id));
    if (!agr) throw new Error("Accordo non trovato");
    const [mem] = await db.select().from(members).where(eq(members.id, agr.memberId));
    
    const descStr = \`Accordo \${mem ? mem.lastName : ''} - \${paymentData.month}/\${paymentData.year}\`;
    const [payRes] = await db.insert(payments).values({
      tenantId: agr.tenantId,
      memberId: agr.memberId,
      amount: paymentData.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethodId: 1,
      type: "accordo_maestro",
      status: "COMPLETED",
      description: descStr,
      costCenterCode: "ACCORDI",
      receiptNumber: \`ACC-\${paymentData.month}\${paymentData.year}-\${id}\`
    });
    
    let creditAcc = "1000-Cassa";
    if (paymentData.paymentMode === "bonifico" || paymentData.paymentMode === "pos") creditAcc = "1010-Banca";
    if (paymentData.paymentMode === "fattura") creditAcc = "2010-DebitiVsFornitori";
    
    const [jeRes] = await db.insert(journalEntries).values({
        tenantId: agr.tenantId,
        paymentId: payRes.insertId,
        entryDate: new Date().toISOString().split('T')[0],
        description: descStr,
        debitAccount: "6010-CostiMaestri",
        creditAccount: creditAcc,
        amount: paymentData.amount,
        costCenterId: undefined,
        notes: paymentData.notes,
        isAuto: true
    });
    return payRes.insertId;
  }

  // ============================================
  // PAGODIL TIERS
  // ============================================
  async getPagodilTiers() {
    return await db.select().from(pagodilTiers).where(eq(pagodilTiers.isActive, true)).orderBy(asc(pagodilTiers.rangeMin));
  }

  // ============================================
  // BASE ACCOUNTING
  // ============================================
  async getCostCenters() {
    return await db.select().from(costCenters).where(eq(costCenters.isActive, true));
  }
  
  async getAccountingPeriods(query: any) {
    let conds = [];
    if (query.year) conds.push(eq(accountingPeriods.year, parseInt(query.year)));
    if (query.isClosed !== undefined) conds.push(eq(accountingPeriods.isClosed, query.isClosed === "true"));
    return await db.select().from(accountingPeriods)
      .where(conds.length > 0 ? and(...conds) : undefined)
      .orderBy(desc(accountingPeriods.year), desc(accountingPeriods.month));
  }
  
  async getJournalEntries(query: any) {
    let conds = [];
    if (query.periodId) conds.push(eq(journalEntries.periodId, parseInt(query.periodId)));
    if (query.costCenterId) conds.push(eq(journalEntries.costCenterId, parseInt(query.costCenterId)));
    
    const limit = query.limit ? parseInt(query.limit) : 50;
    const page = query.page ? parseInt(query.page) : 1;
    const offset = (page - 1) * limit;
    
    const results = await db.select({
      je: journalEntries,
      pay: payments,
      ap: accountingPeriods
    })
    .from(journalEntries)
    .leftJoin(payments, eq(journalEntries.paymentId, payments.id))
    .leftJoin(accountingPeriods, eq(journalEntries.periodId, accountingPeriods.id))
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(journalEntries.entryDate))
    .limit(limit).offset(offset);
    
    return results.map(r => ({
      ...r.je,
      paymentReceipt: r.pay?.receiptNumber || null,
      periodLabel: r.ap?.label || null
    }));
  }

  async createJournalEntry(data: any) {
    const [res] = await db.insert(journalEntries).values({...data, isAuto: false});
    const [je] = await db.select().from(journalEntries).where(eq(journalEntries.id, res.insertId));
    return je;
  }
`;

if (!storageContent.includes('async getPromoRules(')) {
  storageContent = storageContent.replace(
    `export const storage = new DatabaseStorage();`,
    `${dbStoragePatch}\n}\n\nexport const storage = new DatabaseStorage();`
  );
}

fs.writeFileSync(storagePath, storageContent, 'utf8');
console.log('patched storage.ts');

// -------------------------------------------------------------
// PATCH ROUTES.TS
// -------------------------------------------------------------
let routesContent = fs.readFileSync(routesPath, 'utf8');

// Also inject 'import { createInsertSchema } from "drizzle-zod";' if not present
if (!routesContent.includes('import { createInsertSchema }')) {
  routesContent = `import { createInsertSchema } from "drizzle-zod";\n` + routesContent;
}

if (!routesContent.includes('promoRules,')) {
    routesContent = routesContent.replace(
      'insertMemberPackageSchema\n} from "@shared/schema";',
      'insertMemberPackageSchema,\n  promoRules,\n  welfareProviders,\n  carnetWallets,\n  carnetSessions,\n  instructorAgreements,\n  agreementMonthlyOverrides,\n  pagodilTiers,\n  costCenters,\n  accountingPeriods,\n  journalEntries\n} from "@shared/schema";'
    );
}

const routesPatch = `
  // ============================================
  // ZOD SCHEMAS PER QUOTE/PROMO/CONTABILITA'
  // ============================================
  const insertPromoRuleSchema = createInsertSchema(promoRules).omit({ id: true, createdAt: true, updatedAt: true });
  const insertCarnetWalletSchema = createInsertSchema(carnetWallets).omit({ id: true, createdAt: true, updatedAt: true, usedUnits: true });
  const insertInstructorAgreementSchema = createInsertSchema(instructorAgreements).omit({ id: true, createdAt: true, updatedAt: true });
  const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true });

  // ============================================
  // BLOCCO 1: PROMO RULES
  // ============================================
  app.get("/api/promo-rules", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getPromoRules(req.query));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/promo-rules", isAuthenticated, async (req, res) => {
    try {
      const data = insertPromoRuleSchema.parse(req.body);
      const created = await storage.createPromoRule(data);
      await storage.logActivity({userId: req.user!.id, action: "Creazione Promo", entity: "promo_rules", entityId: created.id.toString(), details: \`Creato codice \${created.code}\`});
      res.status(201).json({ success: true, data: created });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put("/api/promo-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertPromoRuleSchema.partial().parse(req.body);
      const updated = await storage.updatePromoRule(id, data);
      await storage.logActivity({userId: req.user!.id, action: "Modifica Promo", entity: "promo_rules", entityId: id.toString(), details: \`Modificato codice \${updated.code}\`});
      res.json({ success: true, data: updated });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/promo-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePromoRule(id);
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/promo-rules/validate", isAuthenticated, async (req, res) => {
    try {
      const { code, amount, activityType, memberId } = req.body;
      const rules = await storage.getPromoRules({ search: code, active: "true" });
      const exactRule = rules.find(r => r.code.toUpperCase() === code?.toUpperCase());
      
      if (!exactRule) return res.json({ valid: false, reason: "Codice inesistente." });
      if (exactRule.isExpired) return res.json({ valid: false, reason: "Codice scaduto." });
      if (exactRule.maxUses && exactRule.usedCount >= exactRule.maxUses) return res.json({ valid: false, reason: "Limite utilizzi superato." });
      if (exactRule.excludeOpen && activityType?.includes("open")) return res.json({ valid: false, reason: "Non applicabile su corsi OPEN." });
      if (exactRule.targetType === "personal" && exactRule.targetRefId !== memberId) return res.json({ valid: false, reason: "Codice riservato ad altro utente." });

      // Calculate discount
      let discountAmount = 0;
      if (exactRule.discountType === "fixed") {
          discountAmount = parseFloat(exactRule.discountValue);
      } else {
          discountAmount = (amount * parseFloat(exactRule.discountValue)) / 100;
      }
      
      const finalAmount = amount - discountAmount;
      await storage.incrementPromoRuleUse(exactRule.id);
      
      res.json({ valid: true, discountAmount, finalAmount: finalAmount < 0 ? 0 : finalAmount });
    } catch(err: any) {
      res.status(500).json({ valid: false, reason: "Errore di calcolo: " + err.message });
    }
  });

  // ============================================
  // BLOCCO 2: WELFARE PROVIDERS
  // ============================================
  app.get("/api/welfare-providers", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getWelfareProviders());
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.patch("/api/welfare-providers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      delete data.name; // block changing name
      const provider = await storage.updateWelfareProvider(id, data);
      res.json({ success: true, data: provider });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ============================================
  // BLOCCO 3: CARNET WALLETS
  // ============================================
  app.get("/api/carnet-wallets", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getCarnetWallets(req.query));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/carnet-wallets", isAuthenticated, async (req, res) => {
    try {
      const data = insertCarnetWalletSchema.parse(req.body);
      const created = await storage.createCarnetWallet(data);
      res.status(201).json({ success: true, data: created });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post("/api/carnet-wallets/:id/use", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.useCarnetWallet(id, req.body);
      await storage.logActivity({userId: req.user!.id, action: "Uso Carnet", entity: "carnet_wallets", entityId: id.toString(), details: \`Scalato 1 ingresso. Rimasti: \${result.wallet.totalUnits - result.wallet.usedUnits}\`});
      res.json({ success: true, data: result });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get("/api/carnet-wallets/:id/sessions", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getCarnetSessions(parseInt(req.params.id)));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============================================
  // BLOCCO 4: INSTRUCTOR AGREEMENTS
  // ============================================
  app.get("/api/instructor-agreements", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getInstructorAgreements(req.query));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/instructor-agreements", isAuthenticated, async (req, res) => {
    try {
      const data = insertInstructorAgreementSchema.parse(req.body);
      const overrides = req.body.overrides || [];
      const created = await storage.createInstructorAgreement(data, overrides);
      res.status(201).json({ success: true, data: created });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put("/api/instructor-agreements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertInstructorAgreementSchema.partial().parse(req.body);
      const overrides = req.body.overrides;
      const updated = await storage.updateInstructorAgreement(id, data, overrides);
      res.json({ success: true, data: updated });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post("/api/instructor-agreements/:id/payment", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payId = await storage.createInstructorPayment(id, req.body);
      await storage.logActivity({userId: req.user!.id, action: "Pagamento Accordo", entity: "instructor_agreements", entityId: id.toString(), details: \`Pagamento generato ID \${payId}\`});
      res.json({ success: true, data: { paymentId: payId } });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/instructor-agreements/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInstructorAgreement(parseInt(req.params.id));
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============================================
  // BLOCCO 5: PAGODIL TIERS
  // ============================================
  app.get("/api/pagodil-tiers", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getPagodilTiers());
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/pagodil-tiers/calculate", isAuthenticated, async (req, res) => {
    try {
      const { amount, providerName = "pagodil" } = req.body;
      const tiers = await storage.getPagodilTiers();
      const amountVal = parseFloat(amount);
      const target = tiers.find(t => t.providerName === providerName && amountVal >= parseFloat(t.rangeMin) && amountVal <= parseFloat(t.rangeMax));
      if (!target) return res.status(404).json({ success: false, error: "Nessun tier Pagodil applicabile per questo importo." });
      
      const fee = parseFloat(target.feeAmount);
      const totalStr = target.feeType === "fixed" ? (amountVal + fee).toFixed(2) : (amountVal + (amountVal * fee / 100)).toFixed(2);
      
      res.json({ success: true, data: { feeAmount: fee, feeType: target.feeType, totalWithFee: parseFloat(totalStr) } });
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============================================
  // BLOCCO 6: CONTABILITA' BASE
  // ============================================
  app.get("/api/cost-centers", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getCostCenters());
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/accounting-periods", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getAccountingPeriods(req.query));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/journal-entries", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getJournalEntries(req.query));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/journal-entries", isAuthenticated, async (req, res) => {
    try {
      const data = insertJournalEntrySchema.parse(req.body);
      const entry = await storage.createJournalEntry(data);
      res.status(201).json({ success: true, data: entry });
    } catch(err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
`;

if (!routesContent.includes('// BLOCCO 1: PROMO RULES')) {
  routesContent = routesContent.replace(
    `  return httpServer;\n}`,
    `${routesPatch}\n  return httpServer;\n}`
  );
}

fs.writeFileSync(routesPath, routesContent, 'utf8');
console.log('patched routes.ts');
