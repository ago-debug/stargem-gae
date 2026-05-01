import { Project, SyntaxKind } from "ts-morph";

const project = new Project();
project.addSourceFileAtPath("server/routes.ts");
const sourceFile = project.getSourceFileOrThrow("server/routes.ts");

const routesToRemove = [
  "/api/member-relationships",
  "/api/member-relationships/:id",
  "/api/pagodil-tiers",
  "/api/pagodil-tiers/calculate",
  "/api/cost-centers",
  "/api/accounting-periods",
  "/api/journal-entries",
  "/api/member-discounts",
  "/api/member-discounts/:memberId/active",
  "/api/member-discounts/:id/use"
];

let removedCount = 0;

// Find all expression statements like app.get(...)
const exprStmts = sourceFile.getDescendantsOfKind(SyntaxKind.ExpressionStatement);

for (const stmt of exprStmts) {
  const callExpr = stmt.getExpressionIfKind(SyntaxKind.CallExpression);
  if (!callExpr) continue;

  const propAccess = callExpr.getExpressionIfKind(SyntaxKind.PropertyAccessExpression);
  if (!propAccess) continue;

  const objectName = propAccess.getExpression().getText();
  const methodName = propAccess.getName();

  if (objectName === "app" && ["get", "post", "patch", "delete"].includes(methodName)) {
    const args = callExpr.getArguments();
    if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
      const routeStr = args[0].getText().replace(/["']/g, "");
      if (routesToRemove.includes(routeStr)) {
        console.log(`Removing route: ${methodName.toUpperCase()} ${routeStr}`);
        stmt.remove();
        removedCount++;
      }
    }
  }
}

sourceFile.saveSync();
console.log(`Cleanup complete. Removed ${removedCount} route endpoints.`);
