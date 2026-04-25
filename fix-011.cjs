const fs = require('fs');

// 1. Fix CourseDuplicationWizard.tsx
let wizardContent = fs.readFileSync('client/src/components/CourseDuplicationWizard.tsx', 'utf8');
const oldWizardBlock = `      let codeE = "X";
      const cat = categories?.find((c: any) => c.id?.toString() === courseData.categoryId?.toString());
      if (cat?.value) codeE = String(cat.value).toUpperCase().charAt(0);
      
      return \`\${codeA}\${codeB}\${codeC}\${codeD}.\${codeE}\`;`;

const newWizardBlock = `      return \`\${codeA}\${codeB}\${codeC}\${codeD}\`;`;

wizardContent = wizardContent.replace(oldWizardBlock, newWizardBlock);
fs.writeFileSync('client/src/components/CourseDuplicationWizard.tsx', wizardContent);

// 2. Fix CourseSingleDuplicateModal.tsx
let singleContent = fs.readFileSync('client/src/components/CourseSingleDuplicateModal.tsx', 'utf8');
const oldSingleBlock = `      let codeE = "X";
      if (course?.categoryId && Array.isArray(categories)) {
          const cat = categories.find(c => c?.id === course.categoryId);
          if (cat && cat.value) {
              codeE = String(cat.value).toUpperCase().charAt(0);
          }
      }

      const calculatedSku = \`\${codeA}\${codeB}\${codeC}\${codeD}\`;`;

const newSingleBlock = `      const calculatedSku = \`\${codeA}\${codeB}\${codeC}\${codeD}\`;`;

singleContent = singleContent.replace(oldSingleBlock, newSingleBlock);
fs.writeFileSync('client/src/components/CourseSingleDuplicateModal.tsx', singleContent);

console.log("Patched F2-011");
