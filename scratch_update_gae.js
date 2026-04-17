const fs = require('fs');

const file = '/Users/gaetano1/SVILUPPO/StarGem_manager/client/src/pages/gemteam.tsx';
let content = fs.readFileSync(file, 'utf8');

// The new tabs content
const newTurni = `
        <TabsContent value="turni" className="w-full relative">
          <div className="border-y border-slate-200 shadow-sm overflow-hidden bg-slate-50 w-full mb-8">
            <div className="px-2 py-4 space-y-6 w-full">
              <div className="text-center font-bold text-slate-500 py-10">
                Lavori in corso (F2-020 Reconstruction) - In Attesa di Completamento
              </div>
            </div>
          </div>
        </TabsContent>
`;

// we find the bounds
const startMatch = content.indexOf('<TabsContent value="turni"');
const endMatch = content.indexOf('<TabsContent value="presenze"');

if (startMatch !== -1 && endMatch !== -1) {
    const before = content.substring(0, startMatch);
    const after = content.substring(endMatch);
    content = before + newTurni + "\n        " + after;
    // fs.writeFileSync(file, content); // commented for now
    console.log("SUCCESS REPLACE BOUNDS");
} else {
    console.log("FAILED");
}
