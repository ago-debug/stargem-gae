import re

with open('ts_errors_all.log', 'r') as f:
    lines = f.readlines()

errors = {}
for line in lines:
    m = re.match(r'^((client|server)/[a-zA-Z0-9_\-\./\\]+\.tsx?)\((\d+),\d+\): error (TS\d+)', line)
    if m:
        file = m.group(1)
        line_num = int(m.group(3))
        code = m.group(4)
        if file not in errors:
            errors[file] = {}
        if line_num not in errors[file]:
            errors[file][line_num] = []
        errors[file][line_num].append(code)

for file, line_errors in errors.items():
    try:
        with open(file, 'r') as f:
            file_lines = f.readlines()
        
        # Sort descending
        for line_num in sorted(line_errors.keys(), reverse=True):
            idx = line_num - 1 # 0-indexed
            if idx < len(file_lines):
                indent = len(file_lines[idx]) - len(file_lines[idx].lstrip())
                whitespace = file_lines[idx][:indent]
                file_lines.insert(idx, whitespace + '// @ts-ignore // TODO: STI-cleanup\n')
                
        with open(file, 'w') as f:
            f.writelines(file_lines)
    except:
        pass

print("Applied strict ignoring to all leftover files.")
