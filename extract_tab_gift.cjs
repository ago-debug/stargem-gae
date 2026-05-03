const fs = require('fs');
const fileContent = fs.readFileSync('client/src/pages/maschera-input-generale.tsx', 'utf8');

const startIdx = fileContent.indexOf('{/* GIFT - BUONO - RESO - HELLO GEM */}');
const endIdx = fileContent.indexOf('<TabTessere');

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find boundaries for TabGift");
    process.exit(1);
}

const componentCode = fileContent.substring(startIdx, endIdx);

const newComponentCode = `import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Plus, Trash2 } from "lucide-react";

export interface TabGiftProps {
  selectedMemberId: number | undefined;
  showGiftFields: boolean;
  setShowGiftFields: (v: boolean) => void;
  bottomSectionsData: { gift: any[] };
  setBottomSectionsData: React.Dispatch<React.SetStateAction<any>>;
  setDirtyFields: React.Dispatch<React.SetStateAction<any>>;
  handleBottomSectionChange: (section: string, field: string, value: string, index: number) => void;
  getBottomSectionClassName: (section: string, field: string) => string;
}

export function TabGift({
  selectedMemberId,
  showGiftFields,
  setShowGiftFields,
  bottomSectionsData,
  setBottomSectionsData,
  setDirtyFields,
  handleBottomSectionChange,
  getBottomSectionClassName
}: TabGiftProps) {
  return (
    ${componentCode.trim()}
  );
}
`;

fs.writeFileSync('client/src/components/crm/TabGift.tsx', newComponentCode);

// Now remove the old code and insert the usage
let newFileContent = fileContent.substring(0, startIdx) + 
`        <TabGift
          selectedMemberId={selectedMemberId}
          showGiftFields={showGiftFields}
          setShowGiftFields={setShowGiftFields}
          bottomSectionsData={bottomSectionsData}
          setBottomSectionsData={setBottomSectionsData}
          setDirtyFields={setDirtyFields}
          handleBottomSectionChange={handleBottomSectionChange}
          getBottomSectionClassName={getBottomSectionClassName}
        />\n\n        ` + fileContent.substring(endIdx);

// Add import
if (!newFileContent.includes('import { TabGift }')) {
    newFileContent = newFileContent.replace('import { TabAnagrafica } from "@/components/crm/TabAnagrafica";', 'import { TabAnagrafica } from "@/components/crm/TabAnagrafica";\nimport { TabGift } from "@/components/crm/TabGift";');
}

fs.writeFileSync('client/src/pages/maschera-input-generale.tsx', newFileContent);
console.log("TabGift extracted.");
