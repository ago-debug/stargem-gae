const fs = require('fs');

let code = fs.readFileSync('client/src/pages/listini.tsx', 'utf8');

// Strip out React Query hooks
code = code.replace(/^[ \t]*const.*?queryKey: \["\/api\/(paid-trials|free-trials|single-lessons)"\].*?;\n/gm, '');

// Strip out types if any
code = code.replace(/typeof (freeTrials|paidTrials|singleLessons)/g, 'any[]');

// Remove tabs from TabsList
code = code.replace(/<TabsTrigger value="prove-pagamento".*?<\/TabsTrigger>/g, '');
code = code.replace(/<TabsTrigger value="prove-gratuite".*?<\/TabsTrigger>/g, '');
code = code.replace(/<TabsTrigger value="lezioni-singole".*?<\/TabsTrigger>/g, '');

// The content sections are giant <TabsContent value="prove-pagamento">...</TabsContent>
// We can use a regex to strip them, or just split by TabsContent value=
const tabsToRemove = ["prove-pagamento", "prove-gratuite", "lezioni-singole"];
tabsToRemove.forEach(tab => {
  let rx = new RegExp(`<TabsContent value="${tab}">[\\s\\S]*?<\\/TabsContent>`, 'g');
  code = code.replace(rx, '');
});

fs.writeFileSync('client/src/pages/listini.tsx', code);
console.log("Listini cleaned!");
