const fs = require('fs');
const file = 'client/src/pages/elenchi.tsx';
let content = fs.readFileSync(file, 'utf8');

const additionalImports = `
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import React from "react";
`;

content = content.replace('import { getActiveActivities } from "@/config/activities";', 'import { getActiveActivities } from "@/config/activities";\n' + additionalImports);

// Fix the listData type issue
content = content.replace(
  '<SimpleListSection list={listData} showColors={isColoredList(listCode)} />',
  '<SimpleListSection list={listData as CustomList & { items: CustomListItem[]; linkedActivities?: string[] }} showColors={isColoredList(listCode)} />'
);

// We had some syntax errors in SimpleListSection for JS vs TS types in helper functions.
// I stripped the TS types out of `isLightColor` and `getColorStyle` when I wrote them manually!
content = content.replace('function isLightColor(hex) {', 'function isLightColor(hex: string): boolean {');
content = content.replace('function getColorStyle(color) {', 'function getColorStyle(color: string | null | undefined): React.CSSProperties {');
content = content.replace('function ColorBadge({ name, color, className = "" }) {', 'function ColorBadge({ name, color, className = "" }: { name: string; color?: string | null; className?: string }) {');

fs.writeFileSync(file, content);
