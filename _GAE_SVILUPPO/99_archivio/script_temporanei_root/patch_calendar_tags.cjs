const fs = require('fs');
const file = 'client/src/pages/calendar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add query for tag_interni
content = content.replace(
  /const activityStatuses = activityStatusesResponse\?\.items\?\.map\(\(item: any\) => \(\{\n        name: item\.value,\n        color: item\.color\n    \}\)\) \|\| \[\];/,
  `const activityStatuses = activityStatusesResponse?.items?.map((item: any) => ({
        name: item.value,
        color: item.color
    })) || [];

    const { data: internalTagsResponse } = useQuery<any>({
        queryKey: ["/api/custom-lists/tag_interni"],
    });
    const internalTagsList = internalTagsResponse?.items?.map((item: any) => ({
        name: item.value,
        color: item.color
    })) || [];`
);

// Update internalLabels rendering
content = content.replace(
  /\{internalLabels\.length > 0 && internalLabels\.map\(tag => \(\n                                                                      <span key=\{tag\}\n                                                                        className="text-\[9px\] font-bold uppercase px-1 py-\[1px\]\n                                                                          rounded-\[2px\] bg-indigo-100 text-indigo-700 \n                                                                          border border-indigo-200 leading-none truncate">\n                                                                        \{tag\}\n                                                                      <\/span>\n                                                                    \)\)\}/g,
  `{internalLabels.length > 0 && internalLabels.map(tag => {
                                                                      const color = getStatusColor(tag, internalTagsList);
                                                                      return (
                                                                        <div key={tag} className="text-[8px] font-bold uppercase tracking-wider leading-none truncate px-1 py-[1.5px] rounded-[2px]" style={color ? { backgroundColor: \`\${color}15\`, color, border: \`0.5px solid \${color}40\` } : { backgroundColor: '#e0e7ff', color: '#4338ca', border: '0.5px solid #c7d2fe' }}>
                                                                            {tag}
                                                                        </div>
                                                                      );
                                                                    })}`
);

fs.writeFileSync(file, content);
