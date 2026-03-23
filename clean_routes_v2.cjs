const fs = require('fs');

let code = fs.readFileSync('server/routes.ts', 'utf8');

// 1. Remove app.post, app.get for dropped entities
const endpoints = [
  'paid-trials', 'free-trials', 'single-lessons',
  'paid-trial-enrollments', 'free-trial-enrollments', 'single-lesson-enrollments'
];

endpoints.forEach(ep => {
  // Regex matches `  app.get("/api/free-trials", ...)` up to `  });`
  // We match from `[ \t]*app\.(get|post|put|delete|patch)\(['"]/api/ep` to the next `[ \t]*app\.(get|post|put|delete|patch)` or end of file
  let rxRoute = new RegExp(`[ \\t]*app\\.(get|post|put|delete|patch)\\([\\'\\"]/api/${ep}[\\'\\"][\\s\\S]*?(?=[ \\t]*app\\.(get|post|put|delete|patch|use)|$)`, 'gi');
  code = code.replace(rxRoute, '');
  let rxRouteId = new RegExp(`[ \\t]*app\\.(get|post|put|delete|patch)\\([\\'\\"]/api/${ep}/:id[\\'\\"][\\s\\S]*?(?=[ \\t]*app\\.(get|post|put|delete|patch|use)|$)`, 'gi');
  code = code.replace(rxRouteId, '');
});

// 2. Fix maschera-generale/save
const blocksToReplace = [
  {
    target: `case "prove-pagamento":
                enrollment = await storage.createPaidTrialEnrollment({ ...createPayload, paidTrialId: enrData.courseId });
                paymentLinkField = "paidTrialEnrollmentId";
                break;`,
    replacement: `case "prove-pagamento":
                enrollment = await storage.createEnrollment({ ...createPayload, participationType: "prova_pagamento" });
                paymentLinkField = "enrollmentId";
                break;`
  },
  {
    target: `case "prove-gratuite":
                enrollment = await storage.createFreeTrialEnrollment({ ...createPayload, freeTrialId: enrData.courseId });
                paymentLinkField = "freeTrialEnrollmentId";
                break;`,
    replacement: `case "prove-gratuite":
                enrollment = await storage.createEnrollment({ ...createPayload, participationType: "prova_gratuita" });
                paymentLinkField = "enrollmentId";
                break;`
  },
  {
    target: `case "lezioni-singole":
                enrollment = await storage.createSingleLessonEnrollment({ ...createPayload, singleLessonId: enrData.courseId });
                paymentLinkField = "singleLessonEnrollmentId";
                break;`,
    replacement: `case "lezioni-singole":
                enrollment = await storage.createEnrollment({ ...createPayload, participationType: "lezione_singola" });
                paymentLinkField = "enrollmentId";
                break;`
  }
];

blocksToReplace.forEach(({target, replacement}) => {
    // Escape target lightly for regex or just use standard string split/join
    code = code.split(target).join(replacement);
});

// 3. Remove validation fields orphaned loops
code = code.replace(/paymentData\.paidTrialEnrollmentId\s*\|\|/g, '');
code = code.replace(/paymentData\.freeTrialEnrollmentId\s*\|\|/g, '');
code = code.replace(/paymentData\.singleLessonEnrollmentId\s*\|\|/g, '');

fs.writeFileSync('server/routes.ts', code);
console.log("Routes cleaned Phase 2!");
