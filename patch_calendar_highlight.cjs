const fs = require('fs');
const file = 'client/src/pages/calendar.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Read highlightCourseId
content = content.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(params\.get\("search"\) \|\| ""\);/,
  `const [searchQuery, setSearchQuery] = useState(params.get("search") || "");
    const highlightCourseId = params.get("highlightCourseId");`
);

// 2. Add highlight classes and id to the card
// First, find the card's outer div
content = content.replace(
  /<div\n\s*key=\{evt\.eventId\}\n\s*onClick=\{handleCardClick\}\n\s*className=\{\`absolute p-\[4px\] pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-\[1\.03\] hover:-translate-y-0\.5 hover:shadow-xl z-20 hover:z-50 \$\{conflictEventId === evt\.id \? 'ring-4 ring-red-500 animate-pulse z-\[100\]' : ''\} \$\{evt\.hasTimeOverlap \? '!border-red-600 !bg-red-50 ring-2 ring-red-500 animate-pulse z-\[90\]' : ''\}\`\}/,
  `<div
                                                    key={evt.eventId}
                                                    id={\`event-card-\${evt.sourceType}-\${evt.sourceId}\`}
                                                    onClick={handleCardClick}
                                                    className={\`absolute p-[4px] pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-xl z-20 hover:z-50 \${conflictEventId === evt.id ? 'ring-4 ring-red-500 animate-pulse z-[100]' : ''} \${evt.hasTimeOverlap ? '!border-red-600 !bg-red-50 ring-2 ring-red-500 animate-pulse z-[90]' : ''} \${highlightCourseId && Number(highlightCourseId) === evt.sourceId && (evt.sourceType === "course" || evt.sourceType === "courses") ? 'ring-4 ring-amber-400 z-[100] scale-[1.05] shadow-2xl' : ''}\`}`
);

// 3. Add a useEffect to scroll to it
content = content.replace(
  /export default function ActivityCalendar\(\) \{/,
  `export default function ActivityCalendar() {
    useEffect(() => {
        const highlightCourseId = new URLSearchParams(window.location.search).get("highlightCourseId");
        if (highlightCourseId) {
            setTimeout(() => {
                const el = document.getElementById(\`event-card-course-\${highlightCourseId}\`) || document.getElementById(\`event-card-courses-\${highlightCourseId}\`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500); // Give it time to render
        }
    }, []);`
);

fs.writeFileSync(file, content);
