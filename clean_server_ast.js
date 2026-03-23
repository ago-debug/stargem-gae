import { Project, SyntaxKind } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths(["server/storage.ts", "server/routes.ts"]);

const storageFile = project.getSourceFileOrThrow("server/storage.ts");

const storageIfc = storageFile.getInterfaceOrThrow("IStorage");
const methodsToDrop = [
  "getPaidTrials", "createPaidTrial", "updatePaidTrial", "deletePaidTrial",
  "getFreeTrials", "createFreeTrial", "updateFreeTrial", "deleteFreeTrial",
  "getSingleLessons", "createSingleLesson", "updateSingleLesson", "deleteSingleLesson",
  "getPaidTrialEnrollments", "getPaidTrialEnrollmentsByMember", "getPaidTrialEnrollment", "createPaidTrialEnrollment", "updatePaidTrialEnrollment", "deletePaidTrialEnrollment",
  "getFreeTrialEnrollments", "getFreeTrialEnrollmentsByMember", "getFreeTrialEnrollment", "createFreeTrialEnrollment", "updateFreeTrialEnrollment", "deleteFreeTrialEnrollment",
  "getSingleLessonEnrollments", "getSingleLessonEnrollmentsByMember", "getSingleLessonEnrollment", "createSingleLessonEnrollment", "updateSingleLessonEnrollment", "deleteSingleLessonEnrollment"
];

for (const mName of methodsToDrop) {
  const mIfc = storageIfc.getMethod(mName);
  if (mIfc) mIfc.remove();
}

const storageClass = storageFile.getClassOrThrow("DatabaseStorage");
for (const mName of methodsToDrop) {
  const mCls = storageClass.getMethod(mName);
  if (mCls) mCls.remove();
}

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

storageFile.getImportDeclarations().forEach(imp => {
  const namedImports = imp.getNamedImports();
  for (const n of namedImports) {
    if (toStripImports.includes(n.getName())) {
      n.remove();
    }
  }
});

storageFile.saveSync();

const routesFile = project.getSourceFileOrThrow("server/routes.ts");

routesFile.getImportDeclarations().forEach(imp => {
  const namedImports = imp.getNamedImports();
  for (const n of namedImports) {
    if (toStripImports.includes(n.getName())) {
      n.remove();
    }
  }
});

const endpoints = [
  '/api/paid-trials', '/api/free-trials', '/api/single-lessons',
  '/api/paid-trial-enrollments', '/api/free-trial-enrollments', '/api/single-lesson-enrollments'
];

const calls = routesFile.getDescendantsOfKind(SyntaxKind.CallExpression);
let removed = 0;
for (const c of calls) {
  const expr = c.getExpression();
  const text = expr.getText();
  if (text.startsWith("router.") || text.startsWith("app.")) {
    const args = c.getArguments();
    if (args.length > 0) {
      const pathText = args[0].getText().replace(/['"]/g, '');
      if (endpoints.some(ep => pathText.startsWith(ep))) {
         const stmt = c.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
         if (stmt && !stmt.wasForgotten()) {
           try { stmt.remove(); removed++; } catch(e) {}
         }
      }
    }
  }
}

routesFile.saveSync();
console.log("AST cleanup complete! Removed route statements:", removed);
