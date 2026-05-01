import fs from 'fs';

let content = fs.readFileSync('client/src/pages/iscritti_per_attivita.tsx', 'utf8');

const regexLI = /<TabsContent value="lezioni-individuali" className="space-y-6 mt-0">\s*<Card>\s*<CardHeader>[\s\S]*?<\/CardHeader>/;

const newHeaderLI = `<TabsContent value="lezioni-individuali" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-primary" />
                    Lezioni Individuali
                  </CardTitle>
                  <CardDescription>
                    {filteredLezioniIndividuali?.length || 0} lezioni individuali {showOnlyWithEnrollments && " con iscrizioni attive"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca per nome o SKU..."
                      className="w-[300px] pl-9"
                      value={searchQueryLI}
                      onChange={(e) => setSearchQueryLI(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedSeasonIdLI} onValueChange={setSelectedSeasonIdLI} disabled={showConcludedSeasonsLI}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Seleziona Stagione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Stagione Attiva</SelectItem>
                      <SelectItem value="all">Tutte le Stagioni</SelectItem>
                      {seasons?.map((s: any, idx: number) => {
                        const seasonLabel = \`\${s.name} \${s.active ? '(Attiva)' : ''}\`;
                        return (
                          <SelectItem key={\`li-season-\${s.id}-\${idx}\`} value={s.id.toString()}>
                            {seasonLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                       id="show-concluded-li" 
                       checked={showConcludedSeasonsLI}
                       onCheckedChange={(checked) => setShowConcludedSeasonsLI(checked as boolean)}
                    />
                    <Label htmlFor="show-concluded-li" className="cursor-pointer text-sm font-normal">Mostra stagioni concluse</Label>
                  </div>
                </div>
                
                {filteredLezioniIndividuali && filteredLezioniIndividuali.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setExpandedLezioniIndividuali(filteredLezioniIndividuali.map(li => li.id.toString()))}>Espandi tutto</Button>
                    <Button variant="outline" size="sm" onClick={() => setExpandedLezioniIndividuali([])}>Comprimi tutto</Button>
                  </div>
                )}
              </div>
            </CardHeader>`;

if (regexLI.test(content)) {
  content = content.replace(regexLI, newHeaderLI);
  fs.writeFileSync('client/src/pages/iscritti_per_attivita.tsx', content, 'utf8');
  console.log("LI header patched");
} else {
  console.log("Regex for LI didn't match!");
}
