function AttendancesTab({ activityId, activityType }: AttendancesTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasWritePermission(user, "/iscritti-corsi");
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  const attendancesQueryKey = activityType === "workshop" ? "/api/workshop-attendances" : "/api/attendances";
  const enrollmentsQueryKey = activityType === "workshop" ? "/api/workshop-enrollments" : "/api/enrollments?type=corsi";

  const { data: attendances } = useQuery<Attendance[]>({ queryKey: [attendancesQueryKey] });
  const { data: membersData } = useQuery<{ members: Member[], total: number }>({ queryKey: ["/api/members"] });
  const members = membersData?.members || [];
  const { data: enrollments } = useQuery<any[]>({ queryKey: [enrollmentsQueryKey] });

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: { memberId: number; activityId: number; attendanceDate: string }) => {
      if (activityType === "workshop") {
        await apiRequest("POST", "/api/workshop-attendances", { memberId: data.memberId, workshopId: data.activityId, attendanceDate: new Date(data.attendanceDate).toISOString(), type: 'manual' });
      } else {
        await apiRequest("POST", "/api/attendances", { memberId: data.memberId, courseId: data.activityId, attendanceDate: new Date(data.attendanceDate).toISOString(), type: 'manual' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [attendancesQueryKey] });
      toast({ title: "Presenza registrata con successo" });
      setIsAddingAttendance(false);
      setSelectedMemberId(null);
      setAttendanceDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: async (attendanceId: number) => {
      const endpoint = activityType === "workshop" ? `/api/workshop-attendances/${attendanceId}` : `/api/attendances/${attendanceId}`;
      await apiRequest("DELETE", endpoint, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [attendancesQueryKey] });
      toast({ title: "Successo", description: "Presenza eliminata" });
    },
    onError: (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" }),
  });

  const courseAttendances = attendances?.filter(a => (activityType === "workshop" ? (a as any).workshopId : a.courseId) === activityId).map(a => {
      const member = members?.find(m => m.id === a.memberId);
      return { ...a, memberName: member ? `${member.lastName} ${member.firstName}` : "Sconosciuto" };
    }).sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime()).slice(0, 50) || [];

  const enrolledMembers = enrollments?.filter(e => (activityType === "workshop" ? e.workshopId : e.courseId) === activityId && (e.status === 'active' || !e.status)).map(e => members?.find(m => m.id === e.memberId)).filter((m): m is Member => m !== undefined) || [];

  const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("attendanceDate");
  const getSortValue = (attendance: any, key: string) => {
    switch (key) { case "member": return attendance.memberName || ""; case "attendanceDate": return attendance.attendanceDate || ""; case "type": return attendance.type || ""; default: return null; }
  };
  const sortedAttendances = sortItems(courseAttendances, getSortValue);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Presenze Registrate</h3>
        <Dialog open={isAddingAttendance} onOpenChange={setIsAddingAttendance}>
          <Button variant="outline" size="sm" onClick={() => setIsAddingAttendance(true)} disabled={!canWrite}><CalendarPlus className="w-4 h-4 mr-2" />Registra Presenza</Button>
          <DialogContent>
            <DialogHeader><DialogTitle>Registra Presenza</DialogTitle><DialogDescription>Seleziona il utente e la data della presenza</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member">Utente *</Label>
                <Select value={selectedMemberId?.toString() || ""} onValueChange={(v) => setSelectedMemberId(parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Seleziona utente" /></SelectTrigger>
                  <SelectContent>
                    {enrolledMembers.map(member => <SelectItem key={member.id} value={member.id.toString()}>{member.lastName} {member.firstName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendanceDate">Data e Ora *</Label>
                <Input id="attendanceDate" type="datetime-local" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingAttendance(false)}>Annulla</Button>
              <Button onClick={() => { if (!selectedMemberId) { toast({ title: "Errore", description: "Seleziona un utente", variant: "destructive" }); return; } createAttendanceMutation.mutate({ memberId: selectedMemberId, activityId, attendanceDate }); }} disabled={!selectedMemberId || createAttendanceMutation.isPending}>Registra</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {courseAttendances.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nessuna presenza registrata per questa attività</p> : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="member" currentSort={sortConfig} onSort={handleSort}>Utente</SortableTableHead>
                <SortableTableHead sortKey="attendanceDate" currentSort={sortConfig} onSort={handleSort}>Data e Ora</SortableTableHead>
                <SortableTableHead sortKey="type" currentSort={sortConfig} onSort={handleSort}>Tipo</SortableTableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAttendances.map((attendance: any) => (
                <TableRow key={attendance.id}>
                  <TableCell className={cn("font-medium", isSortedColumn("member") && "sorted-column-cell")}>{attendance.memberName}</TableCell>
                  <TableCell className={cn(isSortedColumn("attendanceDate") && "sorted-column-cell")}>{format(new Date(attendance.attendanceDate), "dd/MM/yyyy HH:mm", { locale: it })}</TableCell>
                  <TableCell className={cn(isSortedColumn("type") && "sorted-column-cell")}><Badge variant="outline">{attendance.type === 'manual' ? 'Manuale' : attendance.type === 'barcode' ? 'Badge' : 'Auto'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Sei sicuro di voler eliminare questa presenza?")) { deleteAttendanceMutation.mutate(attendance.id); } }} disabled={!canWrite}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ============================================
