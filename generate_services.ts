import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'server', 'storage.ts');
const routesPath = path.join(process.cwd(), 'server', 'routes.ts');

const categoriesToGen = [
    { singular: 'WorkshopCategory', plural: 'WorkshopCategories', table: 'workshopCategories', api: 'workshop-categories' },
    { singular: 'SundayCategory', plural: 'SundayCategories', table: 'sundayCategories', api: 'sunday-categories' },
    { singular: 'TrainingCategory', plural: 'TrainingCategories', table: 'trainingCategories', api: 'training-categories' },
    { singular: 'IndividualLessonCategory', plural: 'IndividualLessonCategories', table: 'individualLessonCategories', api: 'individual-lesson-categories' },
    { singular: 'CampusCategory', plural: 'CampusCategories', table: 'campusCategories', api: 'campus-categories' },
    { singular: 'RecitalCategory', plural: 'RecitalCategories', table: 'recitalCategories', api: 'recital-categories' },
    { singular: 'VacationCategory', plural: 'VacationCategories', table: 'vacationCategories', api: 'vacation-categories' },
];

const activitiesToGen = [
    { singular: 'FreeTrial', plural: 'FreeTrials', table: 'freeTrials', api: 'free-trials' },
    { singular: 'SingleLesson', plural: 'SingleLessons', table: 'singleLessons', api: 'single-lessons' },
    { singular: 'SundayActivity', plural: 'SundayActivities', table: 'sundayActivities', api: 'sunday-activities' },
    { singular: 'Training', plural: 'Trainings', table: 'trainings', api: 'trainings' },
    { singular: 'IndividualLesson', plural: 'IndividualLessons', table: 'individualLessons', api: 'individual-lessons' },
    { singular: 'CampusActivity', plural: 'CampusActivities', table: 'campusActivities', api: 'campus-activities' },
    { singular: 'Recital', plural: 'Recitals', table: 'recitals', api: 'recitals' },
    { singular: 'VacationStudy', plural: 'VacationStudies', table: 'vacationStudies', api: 'vacation-studies' },
];

let storageFile = fs.readFileSync(storagePath, 'utf8');
let routesFile = fs.readFileSync(routesPath, 'utf8');

function injectStorageInterface(entityStr) {
    const marker = '} // END_INTERFACE';
    if (!storageFile.includes(marker)) {
        // try to find end of interface IStorage
        const iEnd = storageFile.indexOf('export class DatabaseStorage implements IStorage {');
        storageFile = storageFile.substring(0, iEnd - 3) + '\n' + entityStr + '\n' + storageFile.substring(iEnd - 3);
    }
}

function camel(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

// 1. Generate Storage Interface additions
let interfaceStr = '';
let dbStorageStr = '';
let routesStr = '';

for (const entity of [...categoriesToGen, ...activitiesToGen]) {
    const Name = entity.singular;
    const Names = entity.plural;
    const table = entity.table;
    const name = camel(Name);

    if (!storageFile.includes(`get${Names}(): Promise<`)) {
        interfaceStr += `
  // ${Names}
  get${Names}(): Promise<${Name}[]>;
  get${Name}(id: number): Promise<${Name} | undefined>;
  create${Name}(${name}: Insert${Name}): Promise<${Name}>;
  update${Name}(id: number, ${name}: Partial<Insert${Name}>): Promise<${Name}>;
  delete${Name}(id: number): Promise<void>;
`;
        dbStorageStr += `
  // ==== ${Names} ====
  async get${Names}(): Promise<${Name}[]> {
    return await db.select().from(${table});
  }
  async get${Name}(id: number): Promise<${Name} | undefined> {
    const [item] = await db.select().from(${table}).where(eq(${table}.id, id));
    return item;
  }
  async create${Name}(data: Insert${Name}): Promise<${Name}> {
    const [result] = await db.insert(${table}).values(data as any);
    const [newItem] = await db.select().from(${table}).where(eq(${table}.id, result.insertId));
    return newItem;
  }
  async update${Name}(id: number, data: Partial<Insert${Name}>): Promise<${Name}> {
    await db.update(${table}).set({ ...data, updatedAt: new Date() } as any).where(eq(${table}.id, id));
    const [item] = await db.select().from(${table}).where(eq(${table}.id, id));
    if (!item) throw new Error("${Name} not found");
    return item;
  }
  async delete${Name}(id: number): Promise<void> {
    await db.delete(${table}).where(eq(${table}.id, id));
  }
`;
    }

    if (!routesFile.includes(`"/api/${entity.api}"`)) {
        routesStr += `
  // ${Names} Routes
  app.get("/api/${entity.api}", isAuthenticated, async (req, res) => {
    try {
      const results = await storage.get${Names}();
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/${entity.api}", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.create${Name}(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/${entity.api}/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.update${Name}(id, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/${entity.api}/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.delete${Name}(id);
      res.status(204).end();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
`;
    }
}

// Ensure exports are added to storage.ts import
const exportsArr = [...categoriesToGen, ...activitiesToGen].flatMap(e => [e.table, `type ${e.singular}`, `type Insert${e.singular}`]);
// we can do a naive replace:
const uniqueExports = exportsArr.filter(e => !storageFile.includes(e));

let iEndInterface = storageFile.indexOf('export class DatabaseStorage implements IStorage {');
if (interfaceStr) {
    storageFile = storageFile.substring(0, iEndInterface - 3) + interfaceStr + "\n" + storageFile.substring(iEndInterface - 3);
}

if (dbStorageStr) {
    const iDbStorageEnd = storageFile.lastIndexOf('}');
    storageFile = storageFile.substring(0, iDbStorageEnd) + dbStorageStr + "\n" + storageFile.substring(iDbStorageEnd);
}

if (routesStr) {
    const iRoutesEnd = routesFile.indexOf('// ==== Categories Routes ====');
    if (iRoutesEnd !== -1) {
        routesFile = routesFile.substring(0, iRoutesEnd) + routesStr + "\n" + routesFile.substring(iRoutesEnd);
    } else {
        const lastIndex = routesFile.lastIndexOf('return httpServer;');
        routesFile = routesFile.substring(0, lastIndex) + routesStr + "\n" + routesFile.substring(lastIndex);
    }
}

// Now handle schema imports in storage.ts
const schemaImportsRegex = /} from "@shared\/schema";/m;
const schemaImportsMatch = schemaImportsRegex.exec(storageFile);
if (schemaImportsMatch) {
    const indexPos = schemaImportsMatch.index;
    let newImports = uniqueExports.join(',\\n  ');
    if (newImports) {
        storageFile = storageFile.substring(0, indexPos) + "  " + newImports + ",\\n" + storageFile.substring(indexPos);
    }
}

fs.writeFileSync(storagePath, storageFile);
fs.writeFileSync(routesPath, routesFile);

console.log('✅ Generated missing services logic and injected them successfully!');
