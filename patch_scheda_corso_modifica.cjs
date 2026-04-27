const fs = require('fs');
const file = 'client/src/pages/scheda-corso.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add CourseUnifiedModal import
if (!content.includes('CourseUnifiedModal')) {
    content = content.replace(
        /import \{ Skeleton \} from "@\/components\/ui\/skeleton";/,
        `import { Skeleton } from "@/components/ui/skeleton";
import { CourseUnifiedModal } from "@/components/CourseUnifiedModal";`
    );
}

// 2. Add state for isEditModalOpen
if (!content.includes('isEditModalOpen')) {
    content = content.replace(
        /const \[genderFilter, setGenderFilter\] = useState<"all" \| "M" \| "F">("all");/,
        `const [genderFilter, setGenderFilter] = useState<"all" | "M" | "F">("all");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);`
    );
}

// 3. Change Modifica button onClick
content = content.replace(
    /onClick=\{\(\) => setLocation\(\`\/attivita\/corsi\?editId=\$\{course\.id\}\`\)\}/,
    `onClick={() => setIsEditModalOpen(true)}`
);

// 4. Render CourseUnifiedModal at the end of the return statement
content = content.replace(
    /<\/div>\n\s*<\/div>\n\s*\);\n\}/,
    `</div>
            {course && (
                <CourseUnifiedModal 
                    isOpen={isEditModalOpen} 
                    onOpenChange={setIsEditModalOpen} 
                    course={course} 
                    activityType="course" 
                />
            )}
        </div>
    );
}`
);

// 5. Make SKU clickable
content = content.replace(
    /<Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5">\s*<Tag className="w-3.5 h-3.5" \/>\s*SKU: \{course.sku \|\| 'N\/A'\}\s*<\/Badge>/,
    `<Badge 
                                variant="outline" 
                                className="bg-slate-50 border-slate-200 text-slate-600 font-medium px-3 py-1 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => { if(course.sku) setLocation(\`/calendario-attivita?search=\${encodeURIComponent(course.sku)}\`) }}
                            >
                                <Tag className="w-3.5 h-3.5" />
                                SKU: {course.sku || 'N/A'}
                            </Badge>`
);

fs.writeFileSync(file, content);
