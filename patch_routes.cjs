const fs = require('fs');

let content = fs.readFileSync('server/routes.ts', 'utf8');

// Insert import at the top
if (!content.includes('registerImportChunkedRoutes')) {
  content = content.replace(
    /import \{ registerPaymentRoutes \} from "\.\/routes\/payments";/,
    'import { registerPaymentRoutes } from "./routes/payments";\nimport { registerImportChunkedRoutes } from "./routes/importChunked";'
  );
  
  // Register the route inside registerRoutes
  content = content.replace(
    /registerPaymentRoutes\(app, \{ checkPermission, logUserActivity \}\);/,
    'registerPaymentRoutes(app, { checkPermission, logUserActivity });\n  registerImportChunkedRoutes(app);'
  );
  
  fs.writeFileSync('server/routes.ts', content);
  console.log('Registered importChunked in routes.ts');
} else {
  console.log('Already registered');
}
