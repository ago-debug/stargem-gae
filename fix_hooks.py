import os
import glob
import re

files = glob.glob('client/src/pages/scheda-*.tsx')

for filepath in files:
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    hook_idx = -1
    hook_line = ''
    insert_idx = -1
    
    # 1. Trova la linea dell'hook
    for i, line in enumerate(lines):
        if 'useSortableTable' in line and 'const { sortConfig, handleSort, sortItems' in line:
            hook_idx = i
            hook_line = line
            break

    # 2. Trova il punto di inserimento ideale: dopo gli useQuery, prima del primo `if (` 
    # di solito è `if (coursesLoading ||` o simili.
    for i, line in enumerate(lines):
        if re.search(r'^\s*if\s*\([a-zA-Z]+Loading', line):
            insert_idx = i
            break
            
    if hook_idx != -1 and insert_idx != -1 and hook_idx > insert_idx:
        print(f"Fixing {filepath} (moving line {hook_idx} to {insert_idx})")
        lines.pop(hook_idx)
        lines.insert(insert_idx, hook_line)
        with open(filepath, 'w') as f:
            f.writelines(lines)
    else:
        print(f"Skipping {filepath} (hook_idx={hook_idx}, insert_idx={insert_idx})")
