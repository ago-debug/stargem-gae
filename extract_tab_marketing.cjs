const fs = require('fs');
const fileContent = fs.readFileSync('client/src/pages/maschera-input-generale.tsx', 'utf8');

const startIdx = fileContent.indexOf('{/* ATTIVITÀ DI MARKETING (FULL WIDTH ROW) */}');
if (startIdx === -1) {
    console.error("Could not find start of Marketing");
    process.exit(1);
}

const endIdx = fileContent.indexOf('{/* PAGAMENTI */}', startIdx);
if (endIdx === -1) {
    console.error("Could not find end of Marketing");
    process.exit(1);
}

const componentCode = fileContent.substring(startIdx, endIdx);

const newComponentCode = `import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Combobox } from "@/components/ui/combobox";
import { InlineListEditorDialog } from "@/components/inline-list-editor-dialog";
import { Edit, RefreshCw, Settings2, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabMarketingProps {
  currentMember: any;
  formData: any;
  handleChange: (field: string, value: any) => void;
  canaliAcquisizione: string[];
  quickAddCanale: any;
  getInputClassName: (field: string, nested?: boolean) => string;
  recalculateCrmMutation: any;
  handleOpenCrmOverride: () => void;
}

export function TabMarketing({
  currentMember,
  formData,
  handleChange,
  canaliAcquisizione,
  quickAddCanale,
  getInputClassName,
  recalculateCrmMutation,
  handleOpenCrmOverride
}: TabMarketingProps) {
  return (
    ${componentCode.trim()}
  );
}
`;

fs.writeFileSync('client/src/components/crm/TabMarketing.tsx', newComponentCode);

// Now remove the old code and insert the usage
let newFileContent = fileContent.substring(0, startIdx) + 
`        <TabMarketing
          currentMember={currentMember}
          formData={formData}
          handleChange={handleChange}
          canaliAcquisizione={canaliAcquisizione}
          quickAddCanale={quickAddCanale}
          getInputClassName={getInputClassName}
          recalculateCrmMutation={recalculateCrmMutation}
          handleOpenCrmOverride={handleOpenCrmOverride}
        />\n\n        ` + fileContent.substring(endIdx);

// Add import
if (!newFileContent.includes('import { TabMarketing }')) {
    newFileContent = newFileContent.replace('import { TabAnagrafica } from "@/components/crm/TabAnagrafica";', 'import { TabAnagrafica } from "@/components/crm/TabAnagrafica";\nimport { TabMarketing } from "@/components/crm/TabMarketing";');
}

fs.writeFileSync('client/src/pages/maschera-input-generale.tsx', newFileContent);
console.log("TabMarketing extracted.");
