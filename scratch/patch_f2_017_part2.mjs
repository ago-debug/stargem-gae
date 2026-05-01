import fs from 'fs';

let content = fs.readFileSync('client/src/pages/iscritti_per_attivita.tsx', 'utf8');

const tabContent = `
        <TabsContent value="campus" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    Campus
                  </CardTitle>
                  <CardDescription>
                    {filteredCampus?.length || 0} campus {showOnlyWithEnrollments && " con iscrizioni attive"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca per nome o SKU..."
                      className="w-[300px] pl-9"
                      value={searchQueryCampus}
                      onChange={(e) => setSearchQueryCampus(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedSeasonIdCampus || (seasons?.find((s: any) => s.active)?.id?.toString() || "")} onValueChange={setSelectedSeasonIdCampus} disabled={showConcludedSeasonsCampus}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Caricamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons && (() => {
                        const activeS = seasons.find((s: any) => s.active);
                        const otherS = seasons.filter((s: any) => !s.active).sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                        return (
                          <>
                            {activeS && (
                              <SelectItem value={activeS.id.toString()}>
                                Stagione {activeS.name.replace('Stagione ', '')} (Attiva)
                              </SelectItem>
                            )}
                            {otherS.map((s: any) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                Stagione {s.name.replace('Stagione ', '')}
                              </SelectItem>
                            ))}
                            <SelectItem value="all">Tutte le Stagioni</SelectItem>
                          </>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                       id="show-concluded-campus" 
                       checked={showConcludedSeasonsCampus}
                       onCheckedChange={(checked) => setShowConcludedSeasonsCampus(checked as boolean)}
                    />
                    <Label htmlFor="show-concluded-campus" className="cursor-pointer text-sm font-normal">Mostra stagioni concluse</Label>
                  </div>
                </div>
                
                {filteredCampus && filteredCampus.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setExpandedCampus(filteredCampus.map(c => c.id.toString()))}>Espandi tutto</Button>
                    <Button variant="outline" size="sm" onClick={() => setExpandedCampus([])}>Comprimi tutto</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {caLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredCampus && filteredCampus.length > 0 ? (
                <Accordion 
                  type="multiple" 
                  className="w-full space-y-4"
                  value={expandedCampus}
                  onValueChange={setExpandedCampus}
                >
                  {filteredCampus.map((campus) => {
                    const cEnrollments = caEnrollments?.filter(e => e.courseId === campus.id && (e.status === 'active' || !e.status)) || [];
                    return (
                      <ActivityAccordionCard
                        key={campus.id}
                        id={campus.id.toString()}
                        activity={campus}
                        icon={Users}
                        enrollmentsCount={cEnrollments.length}
                        badgeLabelPlural="iscritti"
                        badgeLabelSingular="iscritto"
                        linkHref={\`/scheda-campus?id=\${campus.id}\`}
                        testIdPrefix="campus"
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
                              {cEnrollments.length > 0 ? (
                                cEnrollments.sort((a, b) => {
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
                                    Nessun iscritto trovato per questo campus.
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
                  Nessun campus trovato con i filtri attuali.
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
