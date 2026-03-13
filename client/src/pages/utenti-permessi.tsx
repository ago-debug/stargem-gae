import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  UserCog,
  Plus,
  Trash2,
  Key,
  Shield,
  User as UserIcon,
  Loader2,
  Save,
  X,
  Settings2,
  ShieldCheck,
  Edit,
  History,
  Search
} from "lucide-react";
import type { User, UserRole } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const MENU_PATHS = [
  { path: "/", title: "Anagrafica" },
  { path: "/dashboard", title: "Dashboard Statistiche" },
  { path: "/anagrafica_a_lista", title: "Anagrafica a Lista" },
  { path: "/membro", title: "Dettaglio Membro" },
  { path: "/corsi", title: "Corsi" },
  { path: "/calendario", title: "Calendario Attività" },
  { path: "/workshops", title: "Workshops" },
  { path: "/iscritti-corsi", title: "Iscritti per Corso" },
  { path: "/insegnanti", title: "Insegnanti" },
  { path: "/studios", title: "Studios/Sale" },
  { path: "/tessere", title: "Tessere & Certificati" },
  { path: "/generazione-tessere", title: "Generazione Tessere" },
  { path: "/pagamenti", title: "Pagamenti" },
  { path: "/accessi", title: "Controllo Accessi" },
  { path: "/report", title: "Report & Statistiche" },
  { path: "/prenotazioni-sale", title: "Prenotazioni Sale" },
  { path: "/categorie-corsi", title: "Categorie Corsi" },
  { path: "/elenchi", title: "Metodi di Pagamento" },
  { path: "/booking-services", title: "Servizi Prenotabili" },
  { path: "/admin", title: "Pannello Admin" },
  { path: "/importa", title: "Importazione Dati" },
  { path: "/utenti-permessi", title: "Utenti e Permessi" },
  { path: "/reset-stagione", title: "Reset Stagione" },
];

export default function UtentiPermessi() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // State for Users
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);

  // State for Roles
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<UserRole> | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string>>({});

  // Queries
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: roles, isLoading: rolesLoading } = useQuery<UserRole[]>({
    queryKey: ["/api/roles"],
  });

  const { data: activityLogs, isLoading: logsLoading } = useQuery<any[]>({
    queryKey: ["/api/activity-logs"],
  });

  // Sorting Hooks
  const { sortConfig: scUser, handleSort: hsUser, sortItems: siUser, isSortedColumn: iscUser } = useSortableTable<User>("username");
  const getSortValueUser = (u: User, key: string) => {
    switch (key) {
      case "username": return u.username;
      case "fullName": return `${u.firstName || ""} ${u.lastName || ""}`;
      case "email": return u.email || "";
      case "role": return u.role || "";
      default: return null;
    }
  };

  const { sortConfig: scRole, handleSort: hsRole, sortItems: siRole, isSortedColumn: iscRole } = useSortableTable<UserRole>("name");
  const getSortValueRole = (r: UserRole, key: string) => {
    switch (key) {
      case "name": return r.name;
      case "description": return r.description || "";
      case "permissions": return Object.keys(r.permissions as any || {}).length;
      default: return null;
    }
  };

  const { sortConfig: scLog, handleSort: hsLog, sortItems: siLog, isSortedColumn: iscLog } = useSortableTable<any>("createdAt");
  const getSortValueLog = (log: any, key: string) => {
    switch (key) {
      case "createdAt": return log.createdAt;
      case "username": return log.user?.username || "";
      case "action": return log.action || "";
      case "entityType": return log.entityType || "";
      case "details": return log.details ? JSON.stringify(log.details) : "";
      default: return null;
    }
  };

  const { sortConfig: scMenu, handleSort: hsMenu, sortItems: siMenu, isSortedColumn: iscMenu } = useSortableTable<any>("title");
  const getSortValueMenu = (m: any, key: string) => {
    switch (key) {
      case "title": return m.title;
      case "level": return rolePermissions[m.path] || "hidden";
      default: return null;
    }
  };


  // User Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente creato con successo" });
      setIsNewUserDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente aggiornato con successo" });
      setIsEditUserDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: any }) => {
      return await apiRequest("POST", `/api/users/${id}/password`, { password });
    },
    onSuccess: () => {
      toast({ title: "Password aggiornata con successo" });
      setIsPasswordDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente eliminato con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  // Role Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/roles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] }); // Roles affects users
      toast({ title: "Ruolo creato con successo" });
      setIsRoleDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PATCH", `/api/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] }); // Roles affects users
      toast({ title: "Ruolo aggiornato con successo" });
      setIsRoleDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Ruolo eliminato con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  // Handlers
  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    createUserMutation.mutate(data);
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    if (selectedUser?.id) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    }
  };

  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password");
    if (selectedUser?.id) {
      resetPasswordMutation.mutate({ id: selectedUser.id, password });
    }
  };

  const handleSaveRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      permissions: rolePermissions
    };

    if (editingRole?.id) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const openRoleDialog = (role?: UserRole) => {
    const initialPerms: Record<string, string> = {};
    MENU_PATHS.forEach(m => {
      initialPerms[m.path] = "hidden";
    });

    if (role) {
      setEditingRole(role);
      let perms = role.permissions;
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms);
        } catch (e) {
          perms = {};
        }
      }
      setRolePermissions({ ...initialPerms, ...(perms as Record<string, string>) });
    } else {
      setEditingRole(null);
      const newPerms: Record<string, string> = { ...initialPerms };
      // Default to read for new roles, or write for specific paths
      MENU_PATHS.forEach(m => newPerms[m.path] = "read");
      setRolePermissions(newPerms);
    }
    setIsRoleDialogOpen(true);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="w-16 h-16 text-destructive opacity-50" />
        <h2 className="text-2xl font-bold">Accesso Negato</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Solo gli amministratori possono gestire gli utenti e i permessi del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <UserCog className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Utenti e Permessi</h1>
            <p className="text-muted-foreground">Gestisci gli accessi, i ruoli e monitora le attività</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="users">
            <UserIcon className="w-4 h-4 mr-2" />
            Utenti
          </TabsTrigger>
          <TabsTrigger value="roles">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Ruoli
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="w-4 h-4 mr-2" />
            Log Attività
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Account Utenti</h2>
            <Button onClick={() => setIsNewUserDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Utente
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {usersLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead sortKey="username" currentSort={scUser} onSort={hsUser}>Utente</SortableTableHead>
                      <SortableTableHead sortKey="fullName" currentSort={scUser} onSort={hsUser}>Nome Completo</SortableTableHead>
                      <SortableTableHead sortKey="email" currentSort={scUser} onSort={hsUser}>Email</SortableTableHead>
                      <SortableTableHead sortKey="role" currentSort={scUser} onSort={hsUser}>Ruolo</SortableTableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siUser(users || [], getSortValueUser).map((u: User) => (
                      <TableRow key={u.id}>
                        <TableCell className={cn("font-medium flex items-center gap-2", iscUser("username") && "sorted-column-cell")}>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-primary" />
                          </div>
                          {u.username}
                        </TableCell>
                        <TableCell className={cn(iscUser("fullName") && "sorted-column-cell")}>
                          {u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}` : "-"}
                        </TableCell>
                        <TableCell className={cn(iscUser("email") && "sorted-column-cell")}>{u.email || "-"}</TableCell>
                        <TableCell className={cn(iscUser("role") && "sorted-column-cell")}>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Modifica Utente"
                              onClick={() => {
                                setSelectedUser(u);
                                setIsEditUserDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Cambia Password"
                              onClick={() => {
                                setSelectedUser(u);
                                setIsPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Elimina Utente"
                              disabled={u.id === currentUser?.id}
                              onClick={() => {
                                if (confirm(`Sei sicuro di voler eliminare l'utente ${u.username}?`)) {
                                  deleteUserMutation.mutate(u.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Ruoli Personalizzati</h2>
            <Button onClick={() => openRoleDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Ruolo
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {rolesLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead sortKey="name" currentSort={scRole} onSort={hsRole}>Ruolo</SortableTableHead>
                      <SortableTableHead sortKey="description" currentSort={scRole} onSort={hsRole}>Descrizione</SortableTableHead>
                      <SortableTableHead sortKey="permissions" currentSort={scRole} onSort={hsRole}>Permessi</SortableTableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siRole(roles || [], getSortValueRole).map((r: UserRole) => (
                      <TableRow key={r.id}>
                        <TableCell className={cn("font-bold", iscRole("name") && "sorted-column-cell")}>{r.name}</TableCell>
                        <TableCell className={cn(iscRole("description") && "sorted-column-cell")}>{r.description || "-"}</TableCell>
                        <TableCell className={cn(iscRole("permissions") && "sorted-column-cell")}>
                          <span className="text-xs text-muted-foreground">
                            {Object.keys(r.permissions as any).length} menu configurati
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Modifica Ruolo"
                              onClick={() => openRoleDialog(r)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Elimina Ruolo"
                              disabled={r.name === 'admin' || r.name === 'operator'}
                              onClick={() => {
                                if (confirm(`Sei sicuro di voler eliminare il ruolo ${r.name}?`)) {
                                  deleteRoleMutation.mutate(r.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Log Attività di Sistema</h2>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] })}>
              <Search className="w-4 h-4 mr-2" />
              Aggiorna
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {logsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead sortKey="createdAt" currentSort={scLog} onSort={hsLog}>Data/Ora</SortableTableHead>
                      <SortableTableHead sortKey="username" currentSort={scLog} onSort={hsLog}>Utente</SortableTableHead>
                      <SortableTableHead sortKey="action" currentSort={scLog} onSort={hsLog}>Operazione</SortableTableHead>
                      <SortableTableHead sortKey="entityType" currentSort={scLog} onSort={hsLog}>Entità</SortableTableHead>
                      <SortableTableHead sortKey="details" currentSort={scLog} onSort={hsLog}>Dettagli</SortableTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siLog(activityLogs || [], getSortValueLog).map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className={cn("text-xs whitespace-nowrap", iscLog("createdAt") && "sorted-column-cell")}>
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: it })}
                        </TableCell>
                        <TableCell className={cn("font-medium text-xs", iscLog("username") && "sorted-column-cell")}>
                          {log.user.username}
                        </TableCell>
                        <TableCell className={cn(iscLog("action") && "sorted-column-cell")}>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                              log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                log.action === 'LOGIN' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                            }`}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className={cn("text-xs uppercase", iscLog("entityType") && "sorted-column-cell")}>
                          {log.entityType || "-"}
                        </TableCell>
                        <TableCell className={cn("text-xs max-w-md truncate", iscLog("details") && "sorted-column-cell")}>
                          {log.details ? JSON.stringify(log.details) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Dialogs */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo Utente</DialogTitle>
            <DialogDescription>Crea un nuovo account operatore.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" name="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" name="password" type="password" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" name="firstName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome</Label>
                <Input id="lastName" name="lastName" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Ruolo</Label>
              <Select name="role" defaultValue="operator">
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map(r => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>Annulla</Button>
              <Button type="submit" disabled={createUserMutation.isPending}>Crea Utente</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>Aggiorna le informazioni di profilo dell'utente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Nome</Label>
                <Input id="edit-firstName" name="firstName" defaultValue={selectedUser?.firstName || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Cognome</Label>
                <Input id="edit-lastName" name="lastName" defaultValue={selectedUser?.lastName || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" type="email" defaultValue={selectedUser?.email || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Ruolo</Label>
              <Select name="role" defaultValue={selectedUser?.role}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map(r => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>Annulla</Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>Salva Modifiche</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Imposta una nuova password per <strong>{selectedUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input name="password" type="password" placeholder="Nuova password" required />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Annulla</Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>Aggiorna</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Modifica Ruolo" : "Nuovo Ruolo"}</DialogTitle>
            <DialogDescription>Configura il nome del ruolo e i permessi granulari per ogni menu.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveRole} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Nome Ruolo *</Label>
                <Input
                  id="role-name"
                  name="name"
                  defaultValue={editingRole?.name}
                  required
                  disabled={editingRole?.name === 'admin'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-desc">Descrizione</Label>
                <Input id="role-desc" name="description" defaultValue={editingRole?.description || ""} />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-bold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Permessi Menu
              </Label>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead sortKey="title" currentSort={scMenu} onSort={hsMenu}>Menu / Pagina</SortableTableHead>
                      <SortableTableHead sortKey="level" currentSort={scMenu} onSort={hsMenu} className="w-[300px]">Livello Permesso</SortableTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siMenu(MENU_PATHS, getSortValueMenu).map((menu: any) => (
                      <TableRow key={menu.path}>
                        <TableCell className={cn("font-medium", iscMenu("title") && "sorted-column-cell")}>{menu.title}</TableCell>
                        <TableCell className={cn(iscMenu("level") && "sorted-column-cell")}>
                          <Select
                            value={rolePermissions[menu.path] || "hidden"}
                            onValueChange={(val) => setRolePermissions(prev => ({ ...prev, [menu.path]: val }))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="write">Scrittura (Completo)</SelectItem>
                              <SelectItem value="read">Lettura (Solo vista)</SelectItem>
                              <SelectItem value="hidden">Nascosto (Nessun accesso)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Annulla
              </Button>
              <Button type="submit" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Salva Ruolo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
