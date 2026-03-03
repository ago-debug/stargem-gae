const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, 'server', 'routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

const tables = [
    { name: 'PaidTrial', endpoint: 'paid-trial', typeIdName: 'paidTrialId' },
    { name: 'FreeTrial', endpoint: 'free-trial', typeIdName: 'freeTrialId' },
    { name: 'SingleLesson', endpoint: 'single-lesson', typeIdName: 'singleLessonId' },
    { name: 'SundayActivity', endpoint: 'sunday-activity', typeIdName: 'sundayActivityId' },
    { name: 'Training', endpoint: 'training', typeIdName: 'trainingId' },
    { name: 'IndividualLesson', endpoint: 'individual-lesson', typeIdName: 'individualLessonId' },
    { name: 'Campus', endpoint: 'campus', typeIdName: 'campusActivityId' },
    { name: 'Recital', endpoint: 'recital', typeIdName: 'recitalId' },
    { name: 'VacationStudy', endpoint: 'vacation-study', typeIdName: 'vacationStudyId' },
];

let generatedEndpoints = '\\n  // ==== EXTRA ENROLLMENTS ENDPOINTS ==== \\n';

tables.forEach(t => {
    generatedEndpoints += `
  // ${t.name} Enrollments
  app.get("/api/${t.endpoint}-enrollments", isAuthenticated, async (req, res) => {
    try {
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      if (memberId && !isNaN(memberId)) {
        const enrollments = await storage.get${t.name}EnrollmentsByMember(memberId);
        res.json(enrollments);
      } else {
        const enrollments = await storage.get${t.name}Enrollments();
        res.json(enrollments);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/${t.endpoint}-enrollments", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.create${t.name}Enrollment(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/${t.endpoint}-enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const result = await storage.update${t.name}Enrollment(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/${t.endpoint}-enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.delete${t.name}Enrollment(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
`;
});

content = content.replace(
    '  // ==== Maschera Generale Save Endpoint ====',
    generatedEndpoints + '\\n  // ==== Maschera Generale Save Endpoint ===='
);

fs.writeFileSync(routesPath, content);
console.log('Successfully patched routes.ts');
