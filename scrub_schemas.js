const { Project, SyntaxKind } = require('ts-morph');
const project = new Project({ tsConfigFilePath: './tsconfig.json' });

const storageFile = project.getSourceFile('server/storage.ts');
if (storageFile) {
  const iStorage = storageFile.getInterface('IStorage');
  const dbStorage = storageFile.getClass('DatabaseStorage');

  const entities = [
    'SundayCategory', 'TrainingCategory', 'IndividualLessonCategory', 'CampusCategory', 'RecitalCategory', 'VacationCategory',
    'SundayActivity', 'Training', 'IndividualLesson', 'CampusActivity', 'Recital', 'VacationStudy'
  ];

  const methodsToRemove = [];
  entities.forEach(ent => {
    // get, getMany, create, update, delete
    // pluralize: ends with idy -> idies, else s
    const plural = ent.endsWith('Study') ? ent.slice(0, -1) + 'ies' : 
                   ent.endsWith('Category') ? ent.slice(0, -1) + 'ies' : 
                   ent.endsWith('Activity') ? ent.slice(0, -1) + 'ies' : 
                   ent + 's';
    
    methodsToRemove.push(`get${plural}`);
    methodsToRemove.push(`get${ent}`);
    methodsToRemove.push(`create${ent}`);
    methodsToRemove.push(`update${ent}`);
    methodsToRemove.push(`delete${ent}`);
  });

  if (iStorage) {
    methodsToRemove.forEach(m => {
      const sigs = iStorage.getMethods().filter(sig => sig.getName() === m);
      sigs.forEach(s => s.remove());
    });
  }

  if (dbStorage) {
    methodsToRemove.forEach(m => {
      const impls = dbStorage.getMethods().filter(impl => impl.getName() === m);
      impls.forEach(s => s.remove());
    });
  }
  
  storageFile.saveSync();
  console.log("storage.ts cleaned.");
}

const routesFile = project.getSourceFile('server/routes.ts');
if (routesFile) {
  const registerRoutes = routesFile.getFunction('registerRoutes');
  if (registerRoutes) {
    const stmts = registerRoutes.getBody().getStatements();
    const badRoutes = [
      '/api/trainings', '/api/sunday-activities', '/api/individual-lessons', 
      '/api/campus-activities', '/api/recitals', '/api/vacation-studies',
      '/api/workshop-categories', '/api/sunday-categories', '/api/training-categories',
      '/api/individual-lesson-categories', '/api/campus-categories', 
      '/api/recital-categories', '/api/vacation-categories'
    ];

    let removed = 0;
    stmts.forEach(stmt => {
      if (stmt.getKind() === SyntaxKind.ExpressionStatement) {
        const expr = stmt.getExpression();
        if (expr.getKind() === SyntaxKind.CallExpression) {
          const propAcc = expr.getExpression();
          if (propAcc.getKind() === SyntaxKind.PropertyAccessExpression) {
            const exp = propAcc.getExpression();
            if (exp.getText() === 'app') {
              const args = expr.getArguments();
              if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
                const routeName = args[0].getLiteralText();
                if (badRoutes.some(br => routeName.startsWith(br))) {
                  stmt.remove();
                  removed++;
                }
              }
            }
          }
        }
      }
    });

    console.log(`routes.ts cleaned, removed ${removed} routes.`);
  }
  routesFile.saveSync();
}

// Check unifiedBridge.ts
const bridgeFile = project.getSourceFile('server/services/unifiedBridge.ts');
if (bridgeFile) {
  const syncFunc = bridgeFile.getFunction('syncActivitiesUnified');
  if (syncFunc) {
      bridgeFile.getStatements().forEach(s => {
          if (s.getText().includes('ActivitiesUnified')) {
              s.remove();
          }
      });
      bridgeFile.saveSync();
  }
}

console.log("Done.");
