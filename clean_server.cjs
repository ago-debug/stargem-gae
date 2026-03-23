const fs = require('fs');

function stripMethods(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Strip imports
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
    let reg1 = new RegExp(`\\b${i}\\b,?`, 'g');
    code = code.replace(reg1, '');
  });

  const blocks = [
    'PaidTrial', 'FreeTrial', 'SingleLesson',
    'PaidTrialEnrollment', 'FreeTrialEnrollment', 'SingleLessonEnrollment'
  ];

  blocks.forEach(b => {
    // Interface declarations: getFreeTrials(): Promise<FreeTrial[]>;
    // deleteFreeTrial(id: number): Promise<void>;
    let rxIf = new RegExp(`\\s*(get|create|update|delete)${b}s?[\\s\\S]*?\\);`, 'gi');
    code = code.replace(rxIf, '');

    // Class implementations
    // Match exactly: `  async getFreeTrials... { ... }` up to the next `  async` or `  // `
    let rxImpl = new RegExp(`[ \\t]*async (get|create|update|delete)${b}s?[\\s\\S]*?(?=[ \\t]*async |[ \\t]*\\/\\/ |[ \\t]*\\}$|$)`, 'gmi');
    code = code.replace(rxImpl, '');
  });

  // remove empty comments
  code = code.replace(/\/\/\s*====\s*(FreeTrials|PaidTrials|SingleLessons|FreeTrialEnrollments|PaidTrialEnrollments|SingleLessonEnrollments)\s*====/gi, '');

  fs.writeFileSync(file, code);
}

function stripRoutes(file) {
  let code = fs.readFileSync(file, 'utf8');

  // remove routes like router.get('/api/free-trials', ...)
  // since express route handlers span multiple lines, we can match router.get('/api/free-trials'... until router.get or router.post
  const endpoints = [
    'paid-trials', 'free-trials', 'single-lessons',
    'paid-trial-enrollments', 'free-trial-enrollments', 'single-lesson-enrollments'
  ];

  endpoints.forEach(ep => {
    // Matches router.something('/api/ep' up to next router.
    let rxRoute = new RegExp(`[ \\t]*router\\.(get|post|put|delete|patch)\\([\\'\\"]/api/${ep}[\\s\\S]*?(?=[ \\t]*router\\.(get|post|put|delete|patch)|$)`, 'gi');
    code = code.replace(rxRoute, '');
  });

  fs.writeFileSync(file, code);
}

try {
  stripMethods('server/storage.ts');
  stripRoutes('server/routes.ts');
  console.log("Cleanup script completed!");
} catch(err) {
  console.error(err);
}
