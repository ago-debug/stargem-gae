import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * ============================================================================
 * COURSEMANAGER v2.0 - BOZZA SCHEMA "SINGLE TABLE INHERITANCE" (SAAS/MULTI-TENANT)
 * ============================================================================
 * 
 * SCOPO DI QUESTO DOCUMENTO:
 * Questo file è il "Laboratorio di Prova" (Fase 3). È un DRAFT in ambiente isolato 
 * per testare la solidità tecnica dell'architettura emersa in fase di analisi.
 * Contiene le 5 uniche tabelle universali (activities, categories, details, enrollments)
 * che andranno a sostituire le attuali 34 tabelle a silos.
 * NOTA BENE: Questo file non impatta minimamente il database di produzione.
 */

// 1. TENANT SETTINGS (Risposte T1, T2 - Fase 6 UI)
// Ogni cliente SaaS che acquista il Gestionale ha le proprie impostazioni UI (Whitelabel).
export const tenants = pgTable("tenants", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(), // Es: "Dance Studio Milano"
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").default("#6366f1"), // Whitelabeling Colori
    customMenuConfig: jsonb("custom_menu_config"), // Struttura dinamica della Sidebar per tenant
    createdAt: timestamp("created_at").defaultNow(),
});

// 2. ACTIVITY MACRO-CATEGORIES (Risposta T3 - Pre-Seed)
// Le categorie preimpostate incrociabili che istruiscono la UI su cosa renderizzare a schermo.
export const activityCategories = pgTable("activity_categories", {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").references(() => tenants.id),
    name: text("name").notNull(),
    uiRenderingType: text("ui_rendering_type").notNull(), // Es: 'ANNUAL_COURSE', 'SLOT_RENTAL', 'PUNCH_CARD'
    extraInfoSchema: jsonb("extra_info_schema"), // JSON per campi volatili personalizzabili (es. Taglia Maglietta Campus)
    isSystemDefault: boolean("is_system_default").default(false), // Flag per le categorie base (es. preimpostate all'acquisto)
});

// 3. LA SUPER-TABELLA: ACTIVITY DETAILS (Addio agli 11 Silos separati)
// Il cuore del motore. Accorpa Corsi, Affitti, Eventi Esterni, Workshop in un solo contenitore logico.
export const activities = pgTable("activities", {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").references(() => tenants.id),
    categoryId: integer("category_id").references(() => activityCategories.id),
    locationId: integer("location_id"), // Gestione Sedi Multi-Level (Risposta R1)
    name: text("name").notNull(), // Es. "Pilates Base Lun-Mer"

    // Dati Temporali Condivisi
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    instructorId: integer("instructor_id"), // Lo Staff Assegnato

    // Regole di Business
    maxCapacity: integer("max_capacity"), // Capienza limitata (Lista d'Attesa)
    basePrice: integer("base_price").notNull(), // Prezzo Standard
    isPunchCard: boolean("is_punch_card").default(false), // Per chi acquista il "Carnet 10 Ingressi" (Lezioni Private / Allenamenti)
    punchCardTotalAccesses: integer("punch_card_total_accesses"), // Max ingressi per carnet

    // Custom Metadata
    extraInfoOverrides: jsonb("extra_info_overrides"), // Sostituzioni JSON specifiche (Es. Richiesto certificato medico agonistico?)
    createdAt: timestamp("created_at").defaultNow(),
});

// 4. LA SUPER-TABELLA: ENROLLMENTS (Le iscrizioni del portafoglio clienti)
// Sostituisce la frammentazione di courses_enrollments, workshops_enrollments ecc.
export const enrollments = pgTable("enrollments", {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").references(() => tenants.id),
    activityId: integer("activity_id").references(() => activities.id),
    memberId: integer("member_id").notNull(), // Anagrafica Partecipante

    // Status Avanzato
    status: text("status").notNull().default("active"), // 'active', 'waiting_list' (A2), 'frozen' (L1)

    // Campi Economici & Accessi
    remainingPunchCards: integer("remaining_punch_cards"), // Ingressi residui a scalare (Barcode Hardware K)
    walletCredit: integer("wallet_credit").default(0), // Portafoglio Rimborsi/Disdette Mediche (Risposta L1)

    // Metadati specifici compilati dal tesserato 
    extraInfoData: jsonb("extra_info_data"), // "Taglia M, Allergico polline"

    createdAt: timestamp("created_at").defaultNow(),
});

// 5. MODULO HR: TIMBRATURE STAFF, TURNI TEAM E MANUTENZIONE (Intervista 5)
// Calendariatura lavoro indipendente dagli allievi
export const teamShifts = pgTable("team_shifts", {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").references(() => tenants.id),
    userId: integer("user_id").notNull(), // Id del team member amministrativo
    locationId: integer("location_id"), // In quale sede svolge il turno
    shiftStart: timestamp("shift_start").notNull(),
    shiftEnd: timestamp("shift_end").notNull(),
    isAttendanceVerified: boolean("is_attendance_verified").default(false), // Timbratura presenza certificata
});

export const maintenanceTickets = pgTable("maintenance_tickets", {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").references(() => tenants.id),
    locationId: integer("location_id"),
    title: text("title").notNull(), // Segnalazione Hardware/Facility
    status: text("status").notNull().default("open"), // 'open', 'in_progress', 'resolved'
    reportedBy: integer("reported_by"), // Team Ispettivo che apre il ticket
    createdAt: timestamp("created_at").defaultNow(),
});
