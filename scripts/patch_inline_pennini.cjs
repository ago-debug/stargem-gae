const fs = require('fs');
const file = 'client/src/components/CourseUnifiedModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Genere / Nome
const btnGenereRegex = /<Button\s+type="button"\s+size="icon"\s+variant="ghost"\s+className="h-5 w-5"\s+onClick=\{\(e\) => \{\s+e\.preventDefault\(\);\s+e\.stopPropagation\(\);\s+setIsGenereModalOpen\(true\);\s+\}\}\s*>\s*<Edit className="w-3 h-3 sidebar-icon-gold" \/>\s*<\/Button>/g;
const newBtnGenere = `<Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <Edit className="w-3 h-3 text-slate-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <InlineListEditor listCode={nameListType} listName="Genere Corso" showColors={false} />
                  </PopoverContent>
                </Popover>`;
content = content.replace(btnGenereRegex, newBtnGenere);

// Numero Persone
const btnNumPersoneRegex = /<Button variant="ghost" size="icon" className="h-5 w-5" onClick=\{\(e\) => \{ e\.preventDefault\(\); e\.stopPropagation\(\); setIsNumeroPersoneModalOpen\(true\); \}\}><Edit className="w-3 h-3 sidebar-icon-gold" \/><\/Button>/g;
const newBtnNumPersone = `<Popover>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Edit className="w-3 h-3 text-slate-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <InlineListEditor listCode="numero_persone" listName="Numero Persone" showColors={false} />
                      </PopoverContent>
                    </Popover>`;
content = content.replace(btnNumPersoneRegex, newBtnNumPersone);

// Livello / Campus Gruppo
const btnLivelloRegex = /<Button variant="ghost" size="icon" className="h-5 w-5" onClick=\{\(e\) => \{ e\.preventDefault\(\); e\.stopPropagation\(\); if \(activityType === "campus"\) \{ setIsGruppiCampusModalOpen\(true\); \} else \{ setIsLivelloModalOpen\(true\); \} \}\}><Edit className="w-3 h-3 sidebar-icon-gold" \/><\/Button>/g;
const newBtnLivello = `<Popover>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Edit className="w-3 h-3 text-slate-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <InlineListEditor listCode={activityType === "campus" ? "campus" : "livello"} listName={activityType === "campus" ? "Gruppo Campus" : "Livello"} showColors={false} />
                      </PopoverContent>
                    </Popover>`;
content = content.replace(btnLivelloRegex, newBtnLivello);

// Fascia Età
const btnFasciaEtaRegex = /<Button variant="ghost" size="icon" className="h-5 w-5" onClick=\{\(e\) => \{ e\.preventDefault\(\); e\.stopPropagation\(\); setIsFasciaEtaModalOpen\(true\); \}\}><Edit className="w-3 h-3 sidebar-icon-gold" \/><\/Button>/g;
const newBtnFasciaEta = `<Popover>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Edit className="w-3 h-3 text-slate-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <InlineListEditor listCode="fascia_eta" listName="Fascia d'Età" showColors={false} />
                      </PopoverContent>
                    </Popover>`;
content = content.replace(btnFasciaEtaRegex, newBtnFasciaEta);

// Posti Disponibili
const btnPostiRegex = /<Button\s+type="button"\s+size="icon"\s+variant="ghost"\s+className="h-5 w-5"\s+onClick=\{\(e\) => \{\s+e\.preventDefault\(\);\s+e\.stopPropagation\(\);\s+setIsPostiModalOpen\(true\);\s+\}\}\s*>\s*<Edit className="w-3 h-3 sidebar-icon-gold" \/>\s*<\/Button>/g;
const newBtnPosti = `<Popover>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Edit className="w-3 h-3 text-slate-500" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <InlineListEditor listCode="posti_disponibili" listName="Posti Disponibili" showColors={false} />
                      </PopoverContent>
                    </Popover>`;
content = content.replace(btnPostiRegex, newBtnPosti);

// Note: Pacchetti is in a separate place
fs.writeFileSync(file, content);
console.log("Inline pennini patched");
