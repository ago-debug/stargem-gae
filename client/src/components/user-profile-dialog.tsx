import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Loader2, Camera } from "lucide-react";

interface UserProfileDialogProps {
  children: React.ReactNode;
  targetUser?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    profileImageUrl?: string | null;
  };
}

export function UserProfileDialog({ children, targetUser }: UserProfileDialogProps) {
  const { user: authUser } = useAuth();
  const user = targetUser || authUser;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { phone?: string; profileImageUrl?: string }) => {
      if (targetUser) {
        return await apiRequest("PATCH", `/api/users/${targetUser.id}`, data);
      }
      return await apiRequest("PATCH", "/api/users/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/presence/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] }); // Refresh users list for admin
      toast({ title: "Profilo aggiornato con successo" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    }
  });

  const handleUpdate = () => {
    updateProfileMutation.mutate({ phone });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File troppo grande", description: "L'immagine deve pesare al massimo 2 MB." });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64); // Show immediately in UI
      updateProfileMutation.mutate({ profileImageUrl: base64 }, {
        onSettled: () => setUploading(false)
      });
    };
    reader.onerror = () => {
      setUploading(false);
      toast({ variant: "destructive", title: "Errore di caricamento", description: "Impossibile leggere il file." });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setPreviewImage(null); // Reset preview on close
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{targetUser ? `Profilo di ${targetUser.username}` : "Il Mio Profilo"}</DialogTitle>
          <DialogDescription>
            Personalizza {targetUser ? "l'account" : "il tuo account"}. Scegli una foto profilo e aggiorna i recapiti.
            <br/><span className="text-[10px] text-muted-foreground block mt-1">(Supportati: JPG, PNG, WEBP. Max 2 Megabyte)</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200">
            {previewImage || user?.profileImageUrl ? (
              <img src={previewImage || user?.profileImageUrl!} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Camera className="w-8 h-8" />
              </div>
            )}
            
            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-white mb-1" />
                  <span className="text-[10px] text-white font-medium">Carica</span>
                </>
              )}
              <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} disabled={uploading} />
            </label>
          </div>

          <div className="w-full space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={user?.username || ""} disabled className="bg-slate-50 text-slate-500" />
            </div>
            {(user?.firstName || user?.lastName) && (
              <div className="grid gap-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" value={`${user.firstName || ""} ${user.lastName || ""}`.trim()} disabled className="bg-slate-50 text-slate-500" />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="es. +39 333..." 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Chiudi</Button>
          <Button onClick={handleUpdate} disabled={updateProfileMutation.isPending || phone === user?.phone}>
            {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva modifiche
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
