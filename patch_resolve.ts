import fs from 'fs';
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
   routes = routes.replace('export async function registerRoutes(app: Express): Promise<Server> {', resolverHelper + '\nexport async function registerRoutes(app: Express): Promise<Server> {');
   fs.writeFileSync(routesPath, routes);
   console.log("resolveSeason injected.");
} else {
   console.log("resolveSeason already exists.");
}
