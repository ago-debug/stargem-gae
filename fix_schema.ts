import fs from "fs";
import path from "path";

const targetPath = path.join(process.cwd(), "shared/schema.ts");
let content = fs.readFileSync(targetPath, "utf-8");

content = content.replace(/datetime\("created_at"\)\.defaultNow\(\)/g, 'timestamp("created_at").defaultNow()');
content = content.replace(/datetime\("updated_at"\)\.defaultNow\(\)\.onUpdateNow\(\)/g, 'timestamp("updated_at").defaultNow().onUpdateNow()');
content = content.replace(/datetime\("requested_at"\)\.defaultNow\(\)/g, 'timestamp("requested_at").defaultNow()');
content = content.replace(/datetime\("uploaded_at"\)\.defaultNow\(\)/g, 'timestamp("uploaded_at").defaultNow()');

fs.writeFileSync(targetPath, content);
console.log("Schema fixed");
