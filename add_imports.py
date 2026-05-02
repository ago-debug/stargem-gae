with open("server/routes.ts", "r") as f:
    content = f.read()

imports = """
import { registerMembershipsRoutes } from "./routes_modular/memberships";
import { registerPaymentsRoutes } from "./routes_modular/payments";
import { registerMembersRoutes } from "./routes_modular/members";
import { registerCoursesRoutes } from "./routes_modular/courses";
"""

if "registerMembershipsRoutes" not in content[:2000]:
    content = imports + content

with open("server/routes.ts", "w") as f:
    f.write(content)
