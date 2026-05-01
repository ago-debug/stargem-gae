import fs from 'fs';

const filePath = '/Users/gaetano1/SVILUPPO/StarGem_manager/client/src/pages/iscritti_per_attivita.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1) Replace useState("active") with useState("")
content = content.replace(/const \[selectedSeasonIdWS, setSelectedSeasonIdWS\] = useState<string>\("active"\);/, 'const [selectedSeasonIdWS, setSelectedSeasonIdWS] = useState<string>("");');
content = content.replace(/const \[selectedSeasonIdCourses, setSelectedSeasonIdCourses\] = useState<string>\("active"\);/, 'const [selectedSeasonIdCourses, setSelectedSeasonIdCourses] = useState<string>("");');
content = content.replace(/const \[selectedSeasonIdAL, setSelectedSeasonIdAL\] = useState<string>\("active"\);/, 'const [selectedSeasonIdAL, setSelectedSeasonIdAL] = useState<string>("");');
content = content.replace(/const \[selectedSeasonIdDM, setSelectedSeasonIdDM\] = useState<string>\("active"\);/, 'const [selectedSeasonIdDM, setSelectedSeasonIdDM] = useState<string>("");');
content = content.replace(/const \[selectedSeasonIdLI, setSelectedSeasonIdLI\] = useState<string>\("active"\);/, 'const [selectedSeasonIdLI, setSelectedSeasonIdLI] = useState<string>("");');

// 2) Add sortedSeasons right after `const { data: seasons }`
if (!content.includes('const sortedSeasons = [...(seasons || [])].sort')) {
  content = content.replace(
    /const \{ data: seasons \} = useQuery<any>\(\{ queryKey: \["\/api\/seasons"\] \}\);/,
    `const { data: seasons } = useQuery<any>({ queryKey: ["/api/seasons"] });\n\n  const sortedSeasons = [...(seasons || [])].sort((a: any, b: any) => {\n    if (a.active && !b.active) return -1;\n    if (!a.active && b.active) return 1;\n    return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();\n  });`
  );
}

// 3) Refactor targetSeasonId for each of the 5
content = content.replace(
  /const targetSeasonId = selectedSeasonIdCourses === "active" \? activeSeason\?\.id : parseInt\(selectedSeasonIdCourses\);\s*const courseSeasonId = course\.seasonId \|\| activeSeason\?\.id;/,
  `const fallbackSeasonId = seasons?.find((s: any) => s.active)?.id?.toString() || "";\n      const effectiveSeasonId = selectedSeasonIdCourses || fallbackSeasonId;\n      const targetSeasonId = effectiveSeasonId === "all" ? null : parseInt(effectiveSeasonId);\n      const courseSeasonId = course.seasonId || seasons?.find((s: any) => s.active)?.id;`
);

content = content.replace(
  /const targetSeasonId = selectedSeasonIdWS === "active" \? activeSeason\?\.id : parseInt\(selectedSeasonIdWS\);\s*const wsSeasonId = workshop\.seasonId \|\| activeSeason\?\.id;/,
  `const fallbackSeasonId = seasons?.find((s: any) => s.active)?.id?.toString() || "";\n      const effectiveSeasonId = selectedSeasonIdWS || fallbackSeasonId;\n      const targetSeasonId = effectiveSeasonId === "all" ? null : parseInt(effectiveSeasonId);\n      const wsSeasonId = workshop.seasonId || seasons?.find((s: any) => s.active)?.id;`
);

content = content.replace(
  /const targetSeasonId = selectedSeasonIdAL === "active" \? activeSeason\?\.id : parseInt\(selectedSeasonIdAL\);\s*const alSeasonId = al\.seasonId \|\| activeSeason\?\.id;/,
  `const fallbackSeasonId = seasons?.find((s: any) => s.active)?.id?.toString() || "";\n      const effectiveSeasonId = selectedSeasonIdAL || fallbackSeasonId;\n      const targetSeasonId = effectiveSeasonId === "all" ? null : parseInt(effectiveSeasonId);\n      const alSeasonId = al.seasonId || seasons?.find((s: any) => s.active)?.id;`
);

content = content.replace(
  /const targetSeasonId = selectedSeasonIdDM === "active" \? activeSeason\?\.id : parseInt\(selectedSeasonIdDM\);\s*const dmSeasonId = dm\.seasonId \|\| activeSeason\?\.id;/,
  `const fallbackSeasonId = seasons?.find((s: any) => s.active)?.id?.toString() || "";\n      const effectiveSeasonId = selectedSeasonIdDM || fallbackSeasonId;\n      const targetSeasonId = effectiveSeasonId === "all" ? null : parseInt(effectiveSeasonId);\n      const dmSeasonId = dm.seasonId || seasons?.find((s: any) => s.active)?.id;`
);

content = content.replace(
  /const targetSeasonId = selectedSeasonIdLI === "active" \? activeSeason\?\.id : parseInt\(selectedSeasonIdLI\);\s*const liSeasonId = li\.seasonId \|\| activeSeason\?\.id;/,
  `const fallbackSeasonId = seasons?.find((s: any) => s.active)?.id?.toString() || "";\n      const effectiveSeasonId = selectedSeasonIdLI || fallbackSeasonId;\n      const targetSeasonId = effectiveSeasonId === "all" ? null : parseInt(effectiveSeasonId);\n      const liSeasonId = li.seasonId || seasons?.find((s: any) => s.active)?.id;`
);

const selectRegex1 = /<Select value=\{selectedSeasonIdCourses\}[^>]*>[\s\S]*?<\/Select>/g;
content = content.replace(selectRegex1, `<Select value={selectedSeasonIdCourses || seasons?.find((s: any) => s.active)?.id?.toString() || ""} onValueChange={setSelectedSeasonIdCourses} disabled={showConcludedSeasonsCourses}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Seleziona Stagione" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedSeasons.map((s: any) => (
                            <SelectItem key={s.id} value={s.id.toString()} className={s.active ? "font-semibold" : ""}>
                              {s.name} {s.active ? "(Attiva)" : ""}
                            </SelectItem>
                          ))}
                          <SelectItem value="all">Tutte le Stagioni</SelectItem>
                        </SelectContent>
                      </Select>`);

const selectRegex2 = /<Select value=\{selectedSeasonIdWS\}[^>]*>[\s\S]*?<\/Select>/g;
content = content.replace(selectRegex2, `<Select value={selectedSeasonIdWS || seasons?.find((s: any) => s.active)?.id?.toString() || ""} onValueChange={setSelectedSeasonIdWS} disabled={showConcludedSeasonsWS}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Seleziona Stagione" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedSeasons.map((s: any) => (
                            <SelectItem key={s.id} value={s.id.toString()} className={s.active ? "font-semibold" : ""}>
                              {s.name} {s.active ? "(Attiva)" : ""}
                            </SelectItem>
                          ))}
                          <SelectItem value="all">Tutte le Stagioni</SelectItem>
                        </SelectContent>
                      </Select>`);

const selectRegex3 = /<Select value=\{selectedSeasonIdAL\}[^>]*>[\s\S]*?<\/Select>/g;
content = content.replace(selectRegex3, `<Select value={selectedSeasonIdAL || seasons?.find((s: any) => s.active)?.id?.toString() || ""} onValueChange={setSelectedSeasonIdAL} disabled={showConcludedSeasonsAL}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Seleziona Stagione" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedSeasons.map((s: any) => (
                          <SelectItem key={s.id} value={s.id.toString()} className={s.active ? "font-semibold" : ""}>
                            {s.name} {s.active ? "(Attiva)" : ""}
                          </SelectItem>
                        ))}
                        <SelectItem value="all">Tutte le Stagioni</SelectItem>
                      </SelectContent>
                    </Select>`);

const selectRegex4 = /<Select value=\{selectedSeasonIdDM\}[^>]*>[\s\S]*?<\/Select>/g;
content = content.replace(selectRegex4, `<Select value={selectedSeasonIdDM || seasons?.find((s: any) => s.active)?.id?.toString() || ""} onValueChange={setSelectedSeasonIdDM} disabled={showConcludedSeasonsDM}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Seleziona Stagione" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedSeasons.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()} className={s.active ? "font-semibold" : ""}>
                          {s.name} {s.active ? "(Attiva)" : ""}
                        </SelectItem>
                      ))}
                      <SelectItem value="all">Tutte le Stagioni</SelectItem>
                    </SelectContent>
                  </Select>`);

const selectRegex5 = /<Select value=\{selectedSeasonIdLI\}[^>]*>[\s\S]*?<\/Select>/g;
content = content.replace(selectRegex5, `<Select value={selectedSeasonIdLI || seasons?.find((s: any) => s.active)?.id?.toString() || ""} onValueChange={setSelectedSeasonIdLI} disabled={showConcludedSeasonsLI}>
                      <SelectTrigger className="w-full sm:w-[250px]">
                        <SelectValue placeholder="Seleziona Stagione" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedSeasons.map((s: any) => (
                          <SelectItem key={s.id} value={s.id.toString()} className={s.active ? "font-semibold" : ""}>
                            {s.name} {s.active ? "(Attiva)" : ""}
                          </SelectItem>
                        ))}
                        <SelectItem value="all">Tutte le Stagioni</SelectItem>
                      </SelectContent>
                    </Select>`);

fs.writeFileSync(filePath, content);
console.log("Refactoring completato!");
