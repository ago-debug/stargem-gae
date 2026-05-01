import fs from 'fs';

let content = fs.readFileSync('client/src/pages/iscritti_per_attivita.tsx', 'utf8');

const tabs = [
  { id: "corsi", icon: "GraduationCap", title: "Corsi", filtered: "filteredCorsi", state: "Corsi", seasonId: "selectedSeasonIdCourses", concluded: "showConcludedSeasonsCourses", search: "searchQueryCourses", desc: '{filteredCorsi?.length || 0} corsi {showOnlyWithEnrollments && " con iscrizioni attive"}' },
  { id: "workshop", icon: "Presentation", title: "Workshop", filtered: "filteredWorkshop", state: "Workshop", seasonId: "selectedSeasonIdWS", concluded: "showConcludedSeasonsWS", search: "searchQueryWS", desc: '{filteredWorkshop?.length || 0} workshop {showOnlyWithEnrollments && " con iscrizioni attive"}' },
  { id: "allenamenti", icon: "Activity", title: "Allenamenti", filtered: "filteredAllenamenti", state: "Allenamenti", seasonId: "selectedSeasonIdAL", concluded: "showConcludedSeasonsAL", search: "searchQueryAL", desc: '{filteredAllenamenti?.length || 0} allenamenti {showOnlyWithEnrollments && " con iscrizioni attive"}' },
  { id: "domeniche-movimento", icon: "Activity", title: "Domeniche in Movimento", filtered: "filteredDomeniche", state: "Domeniche", seasonId: "selectedSeasonIdDM", concluded: "showConcludedSeasonsDM", search: "searchQueryDM", desc: '{filteredDomeniche?.length || 0} domeniche {showOnlyWithEnrollments && " con iscrizioni attive"}' },
  { id: "lezioni-individuali", icon: "UserCheck", title: "Lezioni Individuali", filtered: "filteredLezioniIndividuali", state: "LezioniIndividuali", seasonId: "selectedSeasonIdLI", concluded: "showConcludedSeasonsLI", search: "searchQueryLI", desc: '{filteredLezioniIndividuali?.length || 0} lezioni individuali {showOnlyWithEnrollments && " con iscrizioni attive"}' },
  { id: "campus", icon: "Users", title: "Campus", filtered: "filteredCampus", state: "Campus", seasonId: "selectedSeasonIdCampus", concluded: "showConcludedSeasonsCampus", search: "searchQueryCampus", desc: '{filteredCampus?.length || 0} campus {showOnlyWithEnrollments && " con iscrizioni attive"}' }
];

for (const tab of tabs) {
  const regexStr = '<TabsContent value="' + tab.id + '"[\\s\\S]*?<CardHeader[^>]*>[\\s\\S]*?<\\/CardHeader>';
  const regex = new RegExp(regexStr);
  const replacement = `<TabsContent value="${tab.id}" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <${tab.icon} className="w-6 h-6 text-primary" />
                    ${tab.title}
                  </CardTitle>
                  <CardDescription>
                    ${tab.desc}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (expanded${tab.state}.length === ${tab.filtered}.length && ${tab.filtered}.length > 0) {
                        setExpanded${tab.state}([]);
                      } else {
                        setExpanded${tab.state}(${tab.filtered}.map((item: any) => item.id.toString()));
                      }
                    }}
                    className="whitespace-nowrap"
                  >
                    {expanded${tab.state}.length === ${tab.filtered}.length && ${tab.filtered}.length > 0 ? "Comprimi tutto" : "Espandi tutto"}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Select value={${tab.seasonId} || (seasons?.find((s: any) => s.active)?.id?.toString() || "")} onValueChange={set${tab.seasonId.charAt(0).toUpperCase() + tab.seasonId.slice(1)}} disabled={${tab.concluded}}>
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue placeholder="Seleziona Stagione" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons && (() => {
                        const activeS = seasons.find((s: any) => s.active);
                        const otherS = seasons.filter((s: any) => !s.active).sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                        return (
                          <>
                            {activeS && (
                              <SelectItem value={activeS.id.toString()} className="font-semibold">
                                {getSeasonLabel(activeS, seasons)}
                              </SelectItem>
                            )}
                            {otherS.map((s: any) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {getSeasonLabel(s, seasons)}
                              </SelectItem>
                            ))}
                            <SelectItem value="all">Tutte le Stagioni</SelectItem>
                          </>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2 shrink-0">
                    <Checkbox 
                       id="show-concluded-${tab.id}" 
                       checked={${tab.concluded}}
                       onCheckedChange={(checked) => set${tab.concluded.charAt(0).toUpperCase() + tab.concluded.slice(1)}(checked as boolean)}
                    />
                    <Label htmlFor="show-concluded-${tab.id}" className="cursor-pointer text-sm font-normal">Mostra stagioni concluse</Label>
                  </div>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome o SKU..."
                    className="w-full sm:w-[300px] pl-9"
                    value={${tab.search}}
                    onChange={(e) => set${tab.search.charAt(0).toUpperCase() + tab.search.slice(1)}(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>`;
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    console.log("Patched tab:", tab.id);
  } else {
    console.log("Regex NOT matched for:", tab.id);
  }
}

fs.writeFileSync('client/src/pages/iscritti_per_attivita.tsx', content, 'utf8');
console.log("Refactor complete.");
