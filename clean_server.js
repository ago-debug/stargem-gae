const fs = require('fs');

function cleanStorage() {
  let file = 'server/storage.ts';
  let code = fs.readFileSync(file, 'utf8');

  // Strip out imports from @shared/schema
  const toStripImports = [
    'freeTrials', 'paidTrials', 'singleLessons',
    'freeTrialEnrollments', 'paidTrialEnrollments', 'singleLessonEnrollments',
    'InsertFreeTrial', 'FreeTrial', 
    'InsertPaidTrial', 'PaidTrial',
    'InsertSingleLesson', 'SingleLesson',
    'InsertFreeTrialEnrollment', 'FreeTrialEnrollment',
    'InsertPaidTrialEnrollment', 'PaidTrialEnrollment',
    'InsertSingleLessonEnrollment', 'SingleLessonEnrollment'
  ];
  toStripImports.forEach(i => {
    // try removing exact word
    let reg = new RegExp(`\\b${i}\\b,?`, 'g');
    code = code.replace(reg, '');
  });

  // Now, strip out all interface methods and implementation methods
  // Matches: async getFreeTrials(): Promise<FreeTrial[]> { ... }
  // We'll use a regex that matches `async (get|create|update|delete)(FreeTrial|PaidTrial|SingleLesson|FreeTrialEnrollment|PaidTrialEnrollment|SingleLessonEnrollment).*?\n  }`
  // Since some methods might have multiple lines, dotAll is needed
  // Alternatively, just delete the specific line blocks since we know where they are.
  
  // Actually, we can just match blocks starting with `// ==== FreeTrials ====` to `// ==== SundayActivities ====`
  // We see `// ==== PaidTrials ====` maybe? No, let's just do regex blocks
  const blocksToRemove = [
    'PaidTrials', 'FreeTrials', 'SingleLessons', 
    'PaidTrialEnrollments', 'FreeTrialEnrollments', 'SingleLessonEnrollments'
  ];
  
  blocksToRemove.forEach(b => {
    // In interface
    let rxInterface = new RegExp(`\\s*(get|create|update|delete)${b}(s|Item)?\\s*\\([\\s\\S]*?\\);`, 'gi');
    code = code.replace(rxInterface, '');
    
    // In class
    // Matches: async get... () { ... }
    let rxClass = new RegExp(`\\s*async (get|create|update|delete)${b}(s|Item)?\\s*\\([\\s\\S]*?\\{\\s*(?:[\\s\\S]*?\\n\\s*\\})?.*?(?:\\n\\s*\\})?.*?(?:\\n\\s*\\})`, 'gi');
    // Using simple approach: just match function name to the next empty line or next async
    let rxClassSafe = new RegExp(`\\s*async (get|create|update|delete)${b}(s|Item)?\\s*\\([\\s\\S]*?\\n\\s*\\}`, 'gi');
    code = code.replace(rxClassSafe, '');
    let rxClassSafe2 = new RegExp(`\\s*async (get|create|update|delete)${b}(s|Item)?\\s*\\([\\s\\S]*?\\n\\s*\\}`, 'gi'); // might need multiple passes
    code = code.replace(rxClassSafe2, '');
    let rxClassSafe3 = new RegExp(`\\s*async (get|create|update|delete)${b}(s|Item)?\\s*\\([\\s\\S]*?\\n\\s*\\}`, 'gi'); 
    code = code.replace(rxClassSafe3, '');
  });

  // remove comments
  code = code.replace(/\/\/\s*====\s*(FreeTrials|PaidTrials|SingleLessons|FreeTrialEnrollments|PaidTrialEnrollments|SingleLessonEnrollments)\s*====/gi, '');

  fs.writeFileSync(file, code);
}

function cleanRoutes() {
  let file = 'server/routes.ts';
  let code = fs.readFileSync(file, 'utf8');
  
  const toStripImports = [
    'freeTrials', 'paidTrials', 'singleLessons',
    'freeTrialEnrollments', 'paidTrialEnrollments', 'singleLessonEnrollments'
  ];
  toStripImports.forEach(i => {
    let reg = new RegExp(`\\b${i}\\b,?`, 'g');
    code = code.replace(reg, '');
  });

  // Remove router blocks
  // router.get('/api/free-trials' ... and so on
  // Let's remove any app.get or router.get with these endpoints
  const endpoints = [
    '/api/paid-trials', '/api/free-trials', '/api/single-lessons',
    '/api/paid-trial-enrollments', '/api/free-trial-enrollments', '/api/single-lesson-enrollments'
  ];
  
  endpoints.forEach(ep => {
    let rxRouter = new RegExp(`\\s*router\\.(get|post|put|delete)\\([\\'\\"]${ep}[\\s\\S]*?\\}\\);`, 'gi');
    // since it can be deeply nested, regex might miss some bracket ends. 
    // better match until next `router.`
    let rxRouterBlock = new RegExp(`\\s*router\\.(get|post|put|delete)\\([\\'\\"]${ep}[\\'\\"][\\s\\S]*?\\}\\);`, 'g');
    code = code.replace(rxRouterBlock, '');
    let rxRouterBlock2 = new RegExp(`\\s*router\\.(get|post|put|delete)\\([\\'\\"]${ep}/:id[\\'\\"][\\s\\S]*?\\}\\);`, 'g');
    code = code.replace(rxRouterBlock2, '');
  });

  fs.writeFileSync(file, code);
}

try {
  cleanStorage();
  cleanRoutes();
  console.log("Storage and Routes cleaned!");
} catch(e) { console.error(e) }
