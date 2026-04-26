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
import { UserProfileDialog } from "@/components/user-profile-dialog";
import { SharedActivityLog } from "@/components/shared-activity-log";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { hasWritePermission } from "@/App";
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
  Search,
  Camera,
  Upload,
  Activity
} from "lucide-react";
import type { User, UserRole } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const getRoleCategory = (role?: string) => {
  const r = (role || "").toLowerCase();
  if (r === "insegnante" || r === "medico" || r.includes("personal") || r.includes("docente")) return "staff";
  if (r === "client" || r === "utente" || r === "pubblico" || r === "") return "utenti";
  return "team";
};

const MENU_PATHS = [
  // SEGRETERIA OPERATIVA
  { path: "/", title: "1. Dashboard Statistiche" },
  { path: "/maschera-input", title: "2. Maschera Input" },
  { path: "/anagrafica-generale", title: "3. Anagrafica Generale" },
  { path: "/tessere-certificati", title: "4. Tessere & Certificati" },
  { path: "/generazione-tessere", title: "5. Generazione Tessere" },
  { path: "/accessi", title: "6. Controllo Accessi" },
  
  // AMMINISTRAZIONE E CASSA
  { path: "/pagamenti", title: "7. Lista Pagamenti" },
  { path: "/scheda-contabile", title: "8. Scheda Contabile" },
  { path: "/report", title: "9. Report & Statistiche" },

  // ATTIVITA E DIDATTICA
  { path: "/attivita", title: "10. Attività (Corsi, Workshop...)" },
  { path: "/iscritti_per_attivita", title: "11. Iscritti per Attività" },
  { path: "/calendario-attivita", title: "13. Calendario Attività" },
  { path: "/planning", title: "14. Planning" },
  { path: "/programmazione-date", title: "15. Programmazione Date" },
  { path: "/studios", title: "16. Studios / Sale" },
  { path: "/affitto-studio", title: "17. Affitto Studio Medico" },

  // RISORSE UMANE E TEAM
  { path: "/staff", title: "18. Staff e Insegnanti" },
  { path: "/inserisci-nota", title: "19. Inserisci Nota" },
  { path: "/commenti", title: "20. Commenti Team" },
  { path: "/todo-list", title: "21. ToDo List" },
  { path: "/knowledge-base", title: "22. Knowledge Base" },

  // CONFIGURAZIONI CORE
  { path: "/listini", title: "23. Listini e Quote" },
  { path: "/promo-sconti", title: "24. Promo / Sconti" },

  // AMMINISTRATORE
  { path: "/admin", title: "25. Pannello Admin Global" },
  { path: "/importa", title: "27. Importazione Dati" },
  { path: "/utenti-permessi", title: "28. Utenti e Permessi" },
  { path: "/audit-logs", title: "29. Storico Log ed Eliminazioni" },
  { path: "/reset-stagione", title: "30. Reset Stagione" },
];

export default function UtentiPermessi() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // State for Users
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
  const [newUserImageBase64, setNewUserImageBase64] = useState<string | null>(null);
  const [uploadingNewUserImage, setUploadingNewUserImage] = useState(false);
  const [editUserImageBase64, setEditUserImageBase64] = useState<string | null>(null);
  const [uploadingEditUserImage, setUploadingEditUserImage] = useState(false);
  const [userDialogContext, setUserDialogContext] = useState<'team'|'staff'|'utenti'>('team');

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
      case "fullName": return `${u.lastName || ""} ${u.firstName || ""}`;
      case "phone": return u.phone || "";
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

  const { sortConfig: scLog, handleSort: hsLog, sortItems: siLog, isSortedColumn: iscLog } = useSortableTable<any>("createdAt", "desc");
  const getSortValueLog = (log: any, key: string) => {
    switch (key) {
      case "createdAt": return new Date(log.createdAt).getTime();
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
    if (newUserImageBase64) {
      data.profileImageUrl = newUserImageBase64;
    }
    createUserMutation.mutate(data);
  };

  const handleNewUserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File troppo grande", description: "L'immagine deve pesare al massimo 2 MB." });
      return;
    }

    setUploadingNewUserImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewUserImageBase64(event.target?.result as string);
      setUploadingNewUserImage(false);
    };
    reader.onerror = () => {
      setUploadingNewUserImage(false);
      toast({ variant: "destructive", title: "Errore di caricamento", description: "Impossibile leggere il file." });
    };
    reader.readAsDataURL(file);
  };

  const handleEditUserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File troppo grande", description: "L'immagine deve pesare al massimo 2 MB." });
      return;
    }

    setUploadingEditUserImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditUserImageBase64(event.target?.result as string);
      setUploadingEditUserImage(false);
    };
    reader.onerror = () => {
      setUploadingEditUserImage(false);
      toast({ variant: "destructive", title: "Errore di caricamento", description: "Impossibile leggere il file." });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (editUserImageBase64 !== null && editUserImageBase64 !== selectedUser?.profileImageUrl) {
      data.profileImageUrl = editUserImageBase64;
    }

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

  if (!hasWritePermission(currentUser, "/utenti-permessi")) {
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
            <p className="text-muted-foreground">Gestisci gli accessi, i ruoli e monitora i processi</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="flex flex-wrap w-full gap-2 justify-start h-auto bg-transparent p-0">
          <TabsTrigger value="team" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background shadow-sm py-2 px-4">
            <UserCog className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background shadow-sm py-2 px-4">
            <UserIcon className="w-4 h-4 mr-2" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="utenti" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background shadow-sm py-2 px-4">
            <UserIcon className="w-4 h-4 mr-2" />
            Utenti
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background shadow-sm py-2 px-4">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Ruoli (Team)
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background shadow-sm py-2 px-4">
            <History className="w-4 h-4 mr-2" />
            Log Accessi
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background shadow-sm py-2 px-4">
            <Activity className="w-4 h-4 mr-2" />
            Processi Svolti
          </TabsTrigger>
        </TabsList>

        {(() => {
          const renderUsersTable = (data: User[], category: 'team' | 'staff' | 'utenti', title: string) => (
            <TabsContent value={category} key={category}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{title}</h2>
                <Button onClick={() => {
                  setUserDialogContext(category);
                  setIsNewUserDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuovo {category === 'utenti' ? 'Utente' : category === 'staff' ? 'Membro Staff' : 'Membro Team'}
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
                          <SortableTableHead sortKey="username" currentSort={scUser} onSort={hsUser}>Username</SortableTableHead>
                          <SortableTableHead sortKey="fullName" currentSort={scUser} onSort={hsUser}>Nome Completo</SortableTableHead>
                          <SortableTableHead sortKey="phone" currentSort={scUser} onSort={hsUser}>Cellulare</SortableTableHead>
                          <SortableTableHead sortKey="email" currentSort={scUser} onSort={hsUser}>Email</SortableTableHead>
                          <SortableTableHead sortKey="role" currentSort={scUser} onSort={hsUser}>Ruolo Assegnato</SortableTableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {siUser(data, getSortValueUser).map((u: User) => (
                          <TableRow key={u.id}>
                            <TableCell className={cn("font-medium flex items-center gap-2", iscUser("username") && "sorted-column-cell")}>
                              <div className="w-8 h-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                                {u.profileImageUrl ? (
                                  <img src={u.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <UserIcon className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              {u.username}
                            </TableCell>
                            <TableCell className={cn(iscUser("fullName") && "sorted-column-cell")}>
                              {u.firstName || u.lastName ? `${u.lastName || ""} ${u.firstName || ""}` : "-"}
                            </TableCell>
                            <TableCell className={cn(iscUser("phone") && "sorted-column-cell")}>{u.phone || "-"}</TableCell>
                            <TableCell className={cn(iscUser("email") && "sorted-column-cell")}>{u.email || "-"}</TableCell>
                            <TableCell className={cn(iscUser("role") && "sorted-column-cell")}>
                              <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${u.role === 'admin' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-blue-100 text-blue-700'}`}>
                                {u.role === 'admin' ? 'MASTER' : (u.role || 'Nessuno')}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={`Modifica ${category === 'utenti' ? 'Utente' : 'Membro'}`}
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setEditUserImageBase64(u.profileImageUrl || null);
                                    setUserDialogContext(category);
                                    setIsEditUserDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <UserProfileDialog targetUser={u}>
                                  <Button variant="ghost" size="icon" title="Modifica Foto / Telefono / PIN">
                                    <Camera className="w-4 h-4" />
                                  </Button>
                                </UserProfileDialog>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Aggiorna Password Interna"
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
                                  title={`Elimina ${category === 'utenti' ? 'Utente' : 'Membro'} in modo irreversibile`}
                                  disabled={u.id === currentUser?.id}
                                  onClick={() => {
                                    if (confirm(`Attenzione: Vuoi eliminare in modo irreversibile l'anagrafica di ${u.username} e revocarne l'accesso al sistema?`)) {
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
                        {data.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                              Nessun account trovato in questa fascia.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );

          const sortedUsers = [...(users || [])].sort((a, b) =>
            (a.lastName || (a as any).cognome || '').localeCompare(b.lastName || (b as any).cognome || '', 'it') ||
            (a.firstName || (a as any).nome || '').localeCompare(b.firstName || (b as any).nome || '', 'it')
          );
          
          const teamUsers = sortedUsers.filter(u => getRoleCategory(u.role) === "team");
          const staffUsers = sortedUsers.filter(u => getRoleCategory(u.role) === "staff");
          const clientUsers = sortedUsers.filter(u => getRoleCategory(u.role) === "utenti");

          return (
            <>
              {renderUsersTable(teamUsers, 'team', 'Team e Personale Interno')}
              {renderUsersTable(staffUsers, 'staff', 'Staff Insegnanti e Personal')}
              {renderUsersTable(clientUsers, 'utenti', 'Pubblico e Allievi Iscritti')}
            </>
          );
        })()}

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
                    {siRole((roles || []).filter(r => getRoleCategory(r.name) === 'team'), getSortValueRole).map((r: UserRole) => (
                      <TableRow key={r.id}>
                        <TableCell className={cn("font-bold text-sm", iscRole("name") && "sorted-column-cell", r.name === 'admin' && "text-amber-600")}>
                          {r.name === 'admin' ? 'MASTER (System)' : r.name}
                        </TableCell>
                        <TableCell className={cn("text-sm", iscRole("description") && "sorted-column-cell")}>{r.description || "-"}</TableCell>
                        <TableCell className={cn(iscRole("permissions") && "sorted-column-cell")}>
                          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                            {(() => {
                              const p = typeof r.permissions === 'string' ? JSON.parse(r.permissions as string) : (r.permissions || {});
                              if (p["*"] === "write" || p["*"] === "read") return "Accesso Totale (100%)";
                              const active = Object.keys(p).filter(k => p[k] === "read" || p[k] === "write").length;
                              return `${active} settori abilitati`;
                            })()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title={r.name === 'admin' ? "Permessi Master non modificabili" : "Modifica Ruolo"}
                              disabled={r.name === 'admin'}
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
            <h2 className="text-xl font-semibold">Log Accessi Sistema</h2>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] })}>
              <Search className="w-4 h-4 mr-2" />
              Aggiorna
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <SharedActivityLog hideTitle type="access" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Processi Svolti</h2>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] })}>
              <Search className="w-4 h-4 mr-2" />
              Aggiorna
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <SharedActivityLog hideTitle type="activities" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Dialogs */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={(val) => {
        setIsNewUserDialogOpen(val);
        if (!val) setNewUserImageBase64(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo Utente</DialogTitle>
            <DialogDescription>Crea un nuovo account operatore.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200">
                {newUserImageBase64 ? (
                  <img src={newUserImageBase64} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingNewUserImage ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white mb-1" />
                      <span className="text-[9px] text-white font-medium">Carica</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleNewUserFileChange} disabled={uploadingNewUserImage} />
                </label>
              </div>
            </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Cellulare</Label>
                <Input id="phone" name="phone" placeholder="es. +39 333..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Ruolo Assegnato</Label>
              <Select name="role" defaultValue={userDialogContext === 'staff' ? 'insegnante' : userDialogContext === 'utenti' ? 'client' : 'operator'}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.filter(r => getRoleCategory(r.name) === userDialogContext).map(r => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                  {userDialogContext === 'utenti' && <SelectItem value="client">Client</SelectItem>}
                  {userDialogContext === 'staff' && <SelectItem value="insegnante">Insegnante</SelectItem>}
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

      <Dialog open={isEditUserDialogOpen} onOpenChange={(val) => {
        setIsEditUserDialogOpen(val);
        if (!val) setEditUserImageBase64(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>Aggiorna le informazioni di profilo dell'utente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative group cursor-pointer w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200">
                {editUserImageBase64 ? (
                  <img src={editUserImageBase64} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <UserIcon className="w-6 h-6" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingEditUserImage ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white mb-1" />
                      <span className="text-[9px] text-white font-medium">Cambia</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleEditUserFileChange} disabled={uploadingEditUserImage} />
                </label>
              </div>
            </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" type="email" defaultValue={selectedUser?.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Cellulare</Label>
                <Input id="edit-phone" name="phone" defaultValue={selectedUser?.phone || ""} placeholder="es. +39 333..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Ruolo Assegnato</Label>
              <Select name="role" defaultValue={selectedUser?.role || (userDialogContext === 'staff' ? 'insegnante' : userDialogContext === 'utenti' ? 'client' : 'operator')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map(r => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                  {/* Opzioni di fallback se la lista db è vuota */}
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="insegnante">Insegnante</SelectItem>
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
