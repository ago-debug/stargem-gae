import fs from 'fs';

let content = fs.readFileSync('client/src/pages/iscritti_per_attivita.tsx', 'utf8');

// Find the start of the first lezioni-individuali
const startLI1 = content.indexOf('<TabsContent value="lezioni-individuali"');
const endLI1 = content.indexOf('        <TabsContent value="campus"', startLI1);

if (startLI1 !== -1 && endLI1 !== -1) {
  const substr1 = content.substring(startLI1, endLI1);
  console.log("Removing LI1, length:", substr1.length);
  content = content.substring(0, startLI1) + content.substring(endLI1);
}

// Find the start of the first campus
const startCampus1 = content.indexOf('<TabsContent value="campus"');
const endCampus1 = content.indexOf('          {activityMenuItems.filter(i => i.id !== "panoramica"', startCampus1);

if (startCampus1 !== -1 && endCampus1 !== -1 && startCampus1 < endCampus1) {
    const substr2 = content.substring(startCampus1, endCampus1);
    console.log("Removing Campus1, length:", substr2.length);
    content = content.substring(0, startCampus1) + content.substring(endCampus1);
}

fs.writeFileSync('client/src/pages/iscritti_per_attivita.tsx', content, 'utf8');
console.log("Duplicates removed.");
