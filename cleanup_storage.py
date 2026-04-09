import os

storage_path = "server/storage.ts"
with open(storage_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "workshops," in line or "workshops " in line:
        line = line.replace("workshops,", "")
    if "workshopAttendances," in line or "workshopAttendances " in line:
        line = line.replace("workshopAttendances,", "")
    if "campusActivities," in line or "campusActivities " in line:
        line = line.replace("campusActivities,", "")
    if "vacationStudies," in line or "vacationStudies " in line:
        line = line.replace("vacationStudies,", "")
    # Check if empty line with just whitespace, keep it if it's newline
    if line.strip() == "" and line != "\n":
        continue
    new_lines.append(line)

with open(storage_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
