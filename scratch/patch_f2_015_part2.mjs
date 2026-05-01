import fs from 'fs';

let content = fs.readFileSync('client/src/pages/iscritti_per_attivita.tsx', 'utf8');

const tabContent = `
        <TabsContent value="lezioni-individuali" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <UserCheck className="w-6 h-6 text-primary" />
                      Lezioni Individuali
                    </CardTitle>
                    <CardDescription>
                      {filteredLezioniIndividuali?.length || 0} lezioni individuali {showOnlyWithEnrollments && " con iscrizioni attive"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (expandedLezioniIndividuali.length === filteredLezioniIndividuali.length) {
                          setExpandedLezioniIndividuali([]);
                        } else {
                          setExpandedLezioniIndividuali(filteredLezioniIndividuali.map(li => li.id.toString()));
                        }
                      }}
                      className="whitespace-nowrap"
                    >
                      {expandedLezioniIndividuali.length === filteredLezioniIndividuali.length ? "Comprimi tutto" : "Espandi tutto"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Cerca per nome o SKU..."
                      value={searchQueryLI}
                      onChange={(e) => setSearchQueryLI(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={selectedSeasonIdLI} onValueChange={setSelectedSeasonIdLI}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Seleziona Stagione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Stagione Attiva</SelectItem>
                        <SelectItem value="all">Tutte le Stagioni</SelectItem>
                        {seasons?.map((season) => (
                          <SelectItem key={season.id} value={season.id.toString()}>
                            {season.name} {season.isCurrent ? "(Attiva)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2 min-w-max border rounded-md px-3 h-10">
                      <Checkbox 
                        id="show-concluded-li" 
                        checked={showConcludedSeasonsLI}
                        onCheckedChange={(checked) => setShowConcludedSeasonsLI(checked as boolean)}
                      />
                      <label htmlFor="show-concluded-li" className="text-sm cursor-pointer select-none">
                        Mostra storiche
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ilLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredLezioniIndividuali && filteredLezioniIndividuali.length > 0 ? (
                <Accordion 
                  type="multiple" 
                  className="w-full space-y-4"
                  value={expandedLezioniIndividuali}
                  onValueChange={setExpandedLezioniIndividuali}
                >
                  {filteredLezioniIndividuali.map((li) => {
                    const liEnrollments = lezioniIndividualiEnrollments?.filter(e => e.courseId === li.id && (e.status === 'active' || !e.status)) || [];
                    return (
                      <ActivityAccordionCard
                        key={li.id}
                        id={li.id.toString()}
                        activity={li}
                        icon={UserCheck}
                        enrollmentsCount={liEnrollments.length}
                        badgeLabelPlural="iscritti"
                        badgeLabelSingular="iscritto"
                        linkHref={\`/scheda-lezione-individuale?id=\${li.id}\`}
                        testIdPrefix="li"
                      >
                        <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/30">
                              <TableRow>
                                <TableHead className="w-[180px]">Data Iscrizione</TableHead>
                                <TableHead className="w-[300px]">Iscritto</TableHead>
                                <TableHead className="w-[150px]">Stato</TableHead>
                                <TableHead className="w-[200px]">Livello</TableHead>
                                <TableHead className="text-right">Azioni</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {liEnrollments.length > 0 ? (
                                liEnrollments.sort((a, b) => {
                                  const dateA = new Date(a.enrollmentDate || a.createdAt).getTime();
                                  const dateB = new Date(b.enrollmentDate || b.createdAt).getTime();
                                  return dateB - dateA;
                                }).map((enroll) => (
                                  <TableRow key={enroll.id}>
                                    <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                                      {new Date(enroll.enrollmentDate || enroll.createdAt).toLocaleDateString('it-IT')}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {enroll.memberLastName} {enroll.memberFirstName}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Attivo
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className="font-normal">
                                        {enroll.enrollmentType || "Base"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Link href={\`/tesserato?id=\${enroll.memberId}\`}>
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-primary hover:text-primary/80">
                                          Vedi
                                        </Button>
                                      </Link>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Nessun iscritto trovato per questa lezione individuale.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </ActivityAccordionCard>
                    );
                  })}
                </Accordion>
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  Nessuna lezione individuale trovata con i filtri attuali.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

`;

content = content.replace(
  /          \{activityMenuItems\.filter\(i => i\.id !== "panoramica"/g,
  tabContent + '          {activityMenuItems.filter(i => i.id !== "panoramica"'
);

fs.writeFileSync('client/src/pages/iscritti_per_attivita.tsx', content, 'utf8');
console.log("Replacement part 2 done.");
