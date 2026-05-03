const fs = require('fs');
const fileContent = fs.readFileSync('client/src/pages/maschera-input-generale.tsx', 'utf8');

const startIdx = fileContent.indexOf('{/* FOTO + ALLEGATI DA INSERIRE - Colonna sinistra */}');
if (startIdx === -1) {
    console.error("Could not find start of Allegati");
    process.exit(1);
}

const endIdx = fileContent.indexOf('<div className="flex-1 flex flex-col gap-4">', startIdx);
if (endIdx === -1) {
    console.error("Could not find end of Allegati");
    process.exit(1);
}

// Extract the <div> boundary
const divStartIdx = fileContent.lastIndexOf('<div', startIdx);

const componentCode = fileContent.substring(divStartIdx, endIdx);

const newComponentCode = `import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowDown, X, FileUp, Camera } from "lucide-react";
import { type AllegatiState } from "@/pages/maschera-input-generale";

export interface TabAllegatiProps {
  selectedMemberId: number | undefined;
  photoFile: { file: File | null; preview: string | null; id?: number };
  handlePhotoUpload: (file: File | null) => void;
  removePhoto: () => void;
  allegati: AllegatiState;
  openAllegatoSections: any;
  toggleAllegatoSection: (section: string) => void;
  handleFileUpload: (section: keyof AllegatiState, file: File | null) => void;
  removeAllegatoFile: (section: keyof AllegatiState) => void;
  updateAllegato: (section: keyof AllegatiState, field: string, value: any) => void;
  openPreview: (url: string | undefined) => void;
}

export function TabAllegati({
  selectedMemberId,
  photoFile,
  handlePhotoUpload,
  removePhoto,
  allegati,
  openAllegatoSections,
  toggleAllegatoSection,
  handleFileUpload,
  removeAllegatoFile,
  updateAllegato,
  openPreview
}: TabAllegatiProps) {
  return (
    ${componentCode.trim()}
  );
}
`;

fs.writeFileSync('client/src/components/crm/TabAllegati.tsx', newComponentCode);

// Now remove the old code and insert the usage
let newFileContent = fileContent.substring(0, divStartIdx) + 
`          <TabAllegati
            selectedMemberId={selectedMemberId}
            photoFile={photoFile}
            handlePhotoUpload={handlePhotoUpload}
            removePhoto={removePhoto}
            allegati={allegati}
            openAllegatoSections={openAllegatoSections}
            toggleAllegatoSection={toggleAllegatoSection}
            handleFileUpload={handleFileUpload}
            removeAllegatoFile={removeAllegatoFile}
            updateAllegato={updateAllegato}
            openPreview={openPreview}
          />\n\n          ` + fileContent.substring(endIdx);

// Add import
if (!newFileContent.includes('import { TabAllegati }')) {
    newFileContent = newFileContent.replace('import { TabAnagrafica } from "@/components/crm/TabAnagrafica";', 'import { TabAnagrafica } from "@/components/crm/TabAnagrafica";\nimport { TabAllegati } from "@/components/crm/TabAllegati";');
}

fs.writeFileSync('client/src/pages/maschera-input-generale.tsx', newFileContent);
console.log("TabAllegati extracted.");
