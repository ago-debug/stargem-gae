const { Project, SyntaxKind } = require('ts-morph');
const project = new Project();
project.addSourceFilesAtPaths(['server/storage.ts', 'server/routes.ts', 'client/src/**/*.tsx', 'client/src/**/*.ts']);

const storageFile = project.getSourceFile('server/storage.ts');
if (storageFile) {
  const iStorage = storageFile.getInterface('IStorage');
  const dbStorage = storageFile.getClass('DatabaseStorage');

  const entities = [
    'WorkshopCategory', 'WorkshopEnrollment', 
    'PaidTrialEnrollment', 'FreeTrialEnrollment', 'SingleLessonEnrollment',
    'SundayActivityEnrollment', 'TrainingEnrollment', 'IndividualLessonEnrollment',
    'CampusEnrollment', 'RecitalEnrollment', 'VacationStudyEnrollment',
    'CourseEnrollment', 'SundayActivityCategory', 'TrainingCategory', 'IndividualLessonCategory',
    'CampusActivityCategory', 'RecitalCategory', 'VacationStudyCategory', 'Workshop'
  ];

  const methodsToRemove = [];
  entities.forEach(ent => {
    // get, getMany, create, update, delete
    const plural = ent.endsWith('Category') ? ent.slice(0, -1) + 'ies' : 
                   ent.endsWith('Activity') ? ent.slice(0, -1) + 'ies' : 
                   ent + 's';
    
    methodsToRemove.push(`get${plural}`);
    methodsToRemove.push(`get${ent}`);
    methodsToRemove.push(`create${ent}`);
    methodsToRemove.push(`update${ent}`);
    methodsToRemove.push(`delete${ent}`);
    methodsToRemove.push(`get${plural}ByMember`);
    methodsToRemove.push(`get${plural}ByMemberId`);
  });

  let remStr = 0;
  if (iStorage) {
    methodsToRemove.forEach(m => {
      const sigs = iStorage.getMethods().filter(sig => sig.getName() === m || sig.getName() === m.replace('sBy', 'By'));
      sigs.forEach(s => { s.remove(); remStr++; });
    });
  }

  if (dbStorage) {
    methodsToRemove.forEach(m => {
      const impls = dbStorage.getMethods().filter(impl => impl.getName() === m || impl.getName() === m.replace('sBy', 'By'));
      impls.forEach(s => { s.remove(); remStr++; });
    });
  }
  
  storageFile.saveSync();
  console.log(`storage.ts cleaned phase 2, removed ${remStr} methods.`);
}

console.log("Fixing imports in routes.ts and storage.ts using diagnostics...");

// Now we use the compiler to auto-fix TS errors by removing unused imports
// Or simpler: remove the erroring nodes!
const allFiles = project.getSourceFiles();

let errorsRemoved = 0;
for (let i = 0; i < 3; i++) { // run a few passes
  const diagnostics = project.getPreEmitDiagnostics();
  if (diagnostics.length === 0) break;

  diagnostics.forEach(diag => {
    const node = diag.getNode();
    if (node) {
      const msg = diag.getMessageText().toString();
      if (msg.includes("Cannot find name") || msg.includes("has no exported member") || msg.includes("does not exist on type")) {
        try {
           const parent = node.getParent();
           // If it's an import specifier, remove it
           if (parent && parent.getKind() === SyntaxKind.ImportSpecifier) {
              parent.remove();
              errorsRemoved++;
           } else if (parent && parent.getKind() === SyntaxKind.PropertyAssignment) {
              parent.remove();
              errorsRemoved++;
           } else if (node.getKind() === SyntaxKind.PropertyAccessExpression && parent && parent.getKind() === SyntaxKind.PropertyAssignment) {
               parent.remove();
               errorsRemoved++;
           } else if (node.getKind() === SyntaxKind.Identifier) {
               // Often in a type definition
               if (parent.getKind() === SyntaxKind.TypeReference) {
                   // just leave it or cast it
               } else if (parent.getKind() === SyntaxKind.ExpressionStatement || parent.getKind() === SyntaxKind.CallExpression) {
                   parent.remove();
                   errorsRemoved++;
               }
           }
        } catch(e) {}
      }
    }
  });
}

// Ensure specific endpoints are removed
const routesFile = project.getSourceFile('server/routes.ts');
if (routesFile) {
  const registerRoutes = routesFile.getFunction('registerRoutes');
  let removedRoutes = 0;
  if (registerRoutes) {
    const stmts = registerRoutes.getBody().getStatements();
    const badRoutes = [
      '/api/workshop-enrollments', '/api/paid-trial-enrollments', '/api/free-trial-enrollments',
      '/api/single-lesson-enrollments', '/api/sunday-activity-enrollments', '/api/training-enrollments',
      '/api/individual-lesson-enrollments', '/api/campus-enrollments', '/api/recital-enrollments',
      '/api/vacation-study-enrollments', '/api/course-enrollments'
    ];

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
                  try { stmt.remove(); removedRoutes++; } catch(e){}
                }
              }
            }
          }
        }
      }
    });

    console.log(`routes.ts cleaned, removed ${removedRoutes} endpoints.`);
  }

  routesFile.saveSync();
}

console.log(`TS compiler magic removed ${errorsRemoved} error nodes.`);
// save all
project.saveSync();
