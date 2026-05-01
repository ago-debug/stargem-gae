const fs = require('fs');
const file = 'client/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('LiveClock')) {
    content = content.replace(
        /import \{ SidebarProvider, SidebarTrigger \} from "@\/components\/ui\/sidebar";/,
        `import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";\nimport { LiveClock } from "@/components/live-clock";`
    );

    content = content.replace(
        /<SidebarTrigger data-testid="button-sidebar-toggle" \/>/,
        `<div className="flex items-center"><SidebarTrigger data-testid="button-sidebar-toggle" /><LiveClock /></div>`
    );

    fs.writeFileSync(file, content);
}
