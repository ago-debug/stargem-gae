import os

schema_path = "shared/schema.ts"
with open(schema_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # Remove dangling relation references in workshopCategoriesRelations
    if "workshops: many(workshops)," in line:
        continue
    # Remove dangling types
    if "export type InsertWorkshop =" in line or "export type Workshop =" in line:
        continue
    if "export type InsertPaidTrial =" in line or "export type PaidTrial =" in line:
        continue
    if "export type InsertFreeTrial =" in line or "export type FreeTrial =" in line:
        continue
    if "export type InsertSingleLesson =" in line or "export type SingleLesson =" in line:
        continue
    if "export type InsertCampusActivity =" in line or "export type CampusActivity =" in line:
        continue
    if "export type InsertVacationStudy =" in line or "export type VacationStudy =" in line:
        continue
    if "export type InsertWorkshopAttendance =" in line or "export type WorkshopAttendance =" in line:
        continue
    # Remove references in priceListItemsRelations
    if "workshop: one(workshops" in line:
        skip = 4 # skip this line and next 3
    if "paidTrial: one(paidTrials" in line:
        skip = 4
    if skip > 0:
        skip -= 1
        continue
    new_lines.append(line)

with open(schema_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
