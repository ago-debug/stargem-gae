import fs from 'fs';

const storagePath = './server/storage.ts';
let storage = fs.readFileSync(storagePath, 'utf8');

// --- STORAGE MODIFICATIONS ---

// 1. getAccountingPeriods
storage = storage.replace(
  'if (query.year) conds.push(eq(accountingPeriods.year, parseInt(query.year)));',
  'if (query.year) conds.push(eq(accountingPeriods.year, parseInt(query.year)));\n    if (query.seasonId) conds.push(eq(accountingPeriods.seasonId, parseInt(query.seasonId)));'
);

// 2. getInstructorAgreements is already basically set up with query.seasonId
// "if (query.seasonId) conditions.push(eq(instructorAgreements.seasonId, parseInt(query.seasonId)));" exists! Wait, yes it does.

// 3. getPromoRules (filtering by date range)
storage = storage.replace(
  'if (query.search) conditions.push(like(promoRules.code, `%${query.search}%`));',
  `if (query.search) conditions.push(like(promoRules.code, \`%\${query.search}%\`));
    
    // date range filtering
    if (query.startDate) conditions.push(gte(promoRules.validFrom, query.startDate));
    if (query.endDate) conditions.push(lte(promoRules.validTo, query.endDate));`
);

// 4. getCarnetWallets (filtering by purchased_at)
storage = storage.replace(
  'if (query.type) conditions.push(eq(carnetWallets.walletType, query.type));',
  `if (query.type) conditions.push(eq(carnetWallets.walletType, query.type));
    
    // date range filtering
    if (query.startDate) conditions.push(gte(carnetWallets.purchasedAt, new Date(query.startDate)));
    if (query.endDate) conditions.push(lte(carnetWallets.purchasedAt, new Date(query.endDate)));`
);

// 5. Add getPriceMatrix if it doesn't exist
if (!storage.includes("async getPriceMatrix(query")) {
    storage = storage.replace(
        'async getPricingRules(query: any) {',
        `async getPriceMatrix(query: any) {
    let conditions = [];
    if (query.seasonId) conditions.push(eq(priceMatrix.seasonId, parseInt(query.seasonId)));
    
    return await db.select().from(priceMatrix)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  async getPricingRules(query: any) {`
    )
}

fs.writeFileSync(storagePath, storage);
console.log("Storage patched.");


// --- ROUTES MODIFICATIONS ---
const routesPath = './server/routes.ts';
let routes = fs.readFileSync(routesPath, 'utf8');

const resolverHelper = `
  async function resolveSeason(reqQuery: any) {
    let seasonId = reqQuery.seasonId;
    let startDate = reqQuery.startDate;
    let endDate = reqQuery.endDate;
    
    if (seasonId === 'active') {
      const db = require('./db').db;
      const { seasons } = require('../shared/schema');
      const { eq } = require('drizzle-orm');
      const [activeSeason] = await db.select().from(seasons).where(eq(seasons.active, true)).limit(1);
      if (activeSeason) {
        seasonId = activeSeason.id;
        startDate = activeSeason.startDate;
        endDate = activeSeason.endDate;
      }
    }
    return { seasonId, startDate, endDate };
  }
`;

if (!routes.includes('async function resolveSeason')) {
   routes = routes.replace('export function registerRoutes(app: Express): Server {', resolverHelper + '\nexport function registerRoutes(app: Express): Server {');
}

// patching promo-rules
routes = routes.replace(
  'app.get("/api/promo-rules", isAuthenticated, async (req, res) => {\n    try {\n      res.json(await storage.getPromoRules(req.query));\n    } catch(err: any) {',
  `app.get("/api/promo-rules", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      res.json(await storage.getPromoRules(q));
    } catch(err: any) {`
);

// patching carnet-wallets
routes = routes.replace(
  'app.get("/api/carnet-wallets", isAuthenticated, async (req, res) => {\n    try {\n      res.json(await storage.getCarnetWallets(req.query));\n    } catch(err: any) {',
  `app.get("/api/carnet-wallets", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      res.json(await storage.getCarnetWallets(q));
    } catch(err: any) {`
);

// patching instructor-agreements
routes = routes.replace(
  'app.get("/api/instructor-agreements", isAuthenticated, async (req, res) => {\n    try {\n      res.json(await storage.getInstructorAgreements(req.query));\n    } catch(err: any) {',
  `app.get("/api/instructor-agreements", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      res.json(await storage.getInstructorAgreements(q));
    } catch(err: any) {`
);

// patching accounting-periods
routes = routes.replace(
  'app.get("/api/accounting-periods", isAuthenticated, async (req, res) => {\n    try {\n      res.json(await storage.getAccountingPeriods(req.query));\n    } catch(err: any) {',
  `app.get("/api/accounting-periods", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      res.json(await storage.getAccountingPeriods(q));
    } catch(err: any) {`
);

// Adding price-matrix if missing
if (!routes.includes('app.get("/api/price-matrix"')) {
    routes = routes.replace(
      'app.get("/api/pricing-rules", isAuthenticated, async (req, res) => {',
      `app.get("/api/price-matrix", isAuthenticated, async (req, res) => {
    try {
      const q = { ...req.query, ...(await resolveSeason(req.query)) };
      res.json(await storage.getPriceMatrix(q));
    } catch(err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/pricing-rules", isAuthenticated, async (req, res) => {`
    );
}

fs.writeFileSync(routesPath, routes);
console.log("Routes patched.");
