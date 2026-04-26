const fs = require('fs');
const path = require('path');

const file = path.resolve(process.cwd(), 'client/src/pages/elenchi.tsx');
let content = fs.readFileSync(file, 'utf8');

const importAccordion = `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";\n`;

content = content.replace('import { getActiveActivities } from "@/config/activities";', importAccordion + 'import { getActiveActivities } from "@/config/activities";');

const oldSpaceY4 = `            <div className="space-y-4">
              {activeLists.map(listCode => {
                const listData = lists?.find(l => l.systemName === listCode || l.systemCode === listCode);
                if (!listData) {
                  return (
                    <Card key={listCode} className="border-dashed bg-slate-50/50">
                      <CardContent className="p-4 flex flex-col gap-1">
                         <span className="font-semibold text-slate-700">{listCode}</span>
                         <span className="text-xs text-red-500">Manca nel DB. Crearla via API o DB prima di usarla.</span>
                      </CardContent>
                    </Card>
                  );
                }

                const usedIn = USED_IN_MAP[listCode] || [];

                return (
                  <div key={listCode} className="relative">
                     <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal">
                          Usato in: {usedIn.join(', ')}
                        </Badge>
                     </div>
                     <SimpleListSection list={listData as CustomList & { items: CustomListItem[]; linkedActivities?: string[] }} showColors={isColoredList(listCode)} />
                  </div>
                );
              })}
            </div>`;

const newAccordion = `            <Accordion type="single" collapsible defaultValue={activeLists[0]} key={activeArea} className="space-y-4">
              {activeLists.map(listCode => {
                const listData = lists?.find(l => l.systemName === listCode || l.systemCode === listCode);
                if (!listData) {
                  return (
                    <AccordionItem value={listCode} key={listCode} className="border rounded-xl bg-white shadow-sm overflow-hidden px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-semibold text-slate-700">{listCode}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                         <span className="text-xs text-red-500">Manca nel DB. Crearla via API o DB prima di usarla.</span>
                      </AccordionContent>
                    </AccordionItem>
                  );
                }

                const usedIn = USED_IN_MAP[listCode] || [];

                return (
                  <AccordionItem value={listCode} key={listCode} className="border rounded-xl bg-white shadow-sm overflow-hidden px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-semibold text-slate-800 text-base">{listData.name}</span>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal text-xs mt-1">
                            Usato in: {usedIn.join(', ')}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                         <SimpleListSection list={listData as CustomList & { items: CustomListItem[]; linkedActivities?: string[] }} showColors={isColoredList(listCode)} />
                      </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>`;

content = content.replace(oldSpaceY4, newAccordion);

fs.writeFileSync(file, content);
