import re
import os

with open("server/routes.ts", "r") as f:
    lines = f.readlines()

imports = []
for i, line in enumerate(lines):
    if line.startswith("import"):
        imports.append(line)
    elif line.startswith("export async function registerRoutes"):
        break

def extract_section(start_marker, end_marker, func_name, filename):
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if start_marker in line:
            start_idx = i
        if end_marker in line and start_idx != -1:
            end_idx = i
            break
            
    if start_idx == -1 or end_idx == -1:
        print(f"Markers not found for {filename}")
        return False
        
    code_lines = lines[start_idx:end_idx]
    
    # Create the new file
    os.makedirs("server/routes_modular", exist_ok=True)
    with open(f"server/routes_modular/{filename}", "w") as f:
        f.writelines(imports)
        f.write('\nimport { Express, Request, Response } from "express";\n')
        f.write('import { storage } from "../storage";\n')
        f.write('import { db } from "../db";\n')
        f.write(f'\nexport function {func_name}(app: Express, isAuthenticated: any, upload: any, uploadDocument: any) {{\n')
        f.writelines(code_lines)
        f.write('}\n')
        
    # Replace the code in routes.ts
    lines[start_idx:end_idx] = [f"  {func_name}(app, isAuthenticated, upload, uploadDocument);\n"]
    return True

extract_section("// ==== Memberships Routes ====", "// ==== Payment Methods Routes ====", "registerMembershipsRoutes", "memberships.ts")
extract_section("// ==== Payments Routes ====", "// ==== Access Logs Routes ====", "registerPaymentsRoutes", "payments.ts")
extract_section("// ==== Members Routes ====", "// ==== Member Relationships Routes", "registerMembersRoutes", "members.ts")
extract_section("// ==== Courses Routes ====", "// ==== Enrollments Routes ====", "registerCoursesRoutes", "courses.ts")

with open("server/routes.ts", "w") as f:
    f.writelines(lines)

print("Split completed.")
