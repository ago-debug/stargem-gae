import { useActiveUsers } from "@/hooks/use-active-users";
import { useAuth } from "@/hooks/use-auth";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Clock } from "lucide-react";
import { KnowledgeInfo } from "@/components/knowledge-info";

export function ActiveUserAvatars() {
  const { data: users = [] } = useActiveUsers();
  const { user: currentUser } = useAuth();

  // Filtriamo quelli online e in pausa (ping < 20 minuti fa e con sessione aperta) escludendo se stessi
  const activeUsers = users.filter((u) => {
    if (u.id === currentUser?.id) return false;
    if (!u.lastSeenAt || !u.currentSessionStart) return false;
    const diff = new Date().getTime() - new Date(u.lastSeenAt).getTime();
    return diff <= 20 * 60 * 1000;
  });

  const displayLimit = 3;
  const visibleUsers = activeUsers.slice(0, displayLimit);
  const hiddenCount = Math.max(0, activeUsers.length - displayLimit);

  if (activeUsers.length === 0) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2 py-1 shadow-sm opacity-60">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-500 shadow-sm hover:bg-slate-300 transition-colors cursor-pointer">
              0
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                <Users className="w-3 h-3" /> 
                Nessun utente live oltre a te
              </h4>
            </div>
            <div className="text-xs text-slate-400 p-2 text-center">
              Tutti gli altri membri del team sono attualmente offline.
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2 py-1 shadow-sm">
      {visibleUsers.map((u) => {
        const isMe = u.id === currentUser?.id;
        const diffMins = (new Date().getTime() - new Date(u.lastSeenAt!).getTime()) / 60000;
        const isAway = diffMins > 2;
        const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}` || (u.username?.[0] || "?").toUpperCase();
        
        return (
          <TooltipProvider key={u.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`relative w-7 h-7 rounded-full border-2 ${isMe ? 'border-primary' : 'border-white'} flex items-center justify-center bg-emerald-100 text-[10px] font-bold text-emerald-800 shadow-sm overflow-hidden`}>
                  {u.profileImageUrl ? (
                    <img src={u.profileImageUrl} alt="avatar" className={`w-full h-full object-cover ${isAway ? 'opacity-60 grayscale-[50%]' : ''}`} />
                  ) : (
                     initials
                  )}
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-white rounded-full ${isAway ? 'bg-amber-400' : 'bg-green-500'}`}></span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isMe ? "Tu" : (u.firstName ? `${u.firstName} ${u.lastName}` : u.username)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}

      {hiddenCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-600 shadow-sm hover:bg-slate-200 transition-colors cursor-pointer">
              +{hiddenCount}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                <Users className="w-3 h-3" /> 
                Tutti gli utenti live ({activeUsers.length})
              </h4>
              <KnowledgeInfo id="tempo-di-lavoro" />
            </div>
            <div className="space-y-1">
              {activeUsers.map(u => {
                const isMe = u.id === currentUser?.id;
                const diffMins = (new Date().getTime() - new Date(u.lastSeenAt!).getTime()) / 60000;
                const isAway = diffMins > 2; // aggiornato a 2 minuti
                const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}` || (u.username?.[0] || "?").toUpperCase();
                
                // Calcoliamo quanti minuti EFFETTIVI ha lavorato (netto pause)
                let workingMins = 0;
                if (u.currentSessionStart) {
                  let endT = u.lastSeenAt ? new Date(u.lastSeenAt).getTime() : Date.now();
                  endT = !isAway ? Date.now() : endT;
                  workingMins = Math.round((endT - new Date(u.currentSessionStart).getTime()) / 60000);
                }

                return (
                  <div key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-md">
                    <div className="relative w-6 h-6 rounded-full flex items-center justify-center bg-emerald-100 text-[9px] font-bold text-emerald-800 shrink-0 overflow-hidden">
                      {u.profileImageUrl ? (
                        <img src={u.profileImageUrl} alt="avatar" className={`w-full h-full object-cover ${isAway ? 'opacity-60 grayscale-[50%]' : ''}`} />
                      ) : (
                         initials
                      )}
                      <span className={`absolute bottom-0 right-0 w-2 h-2 border border-white rounded-full ${isAway ? 'bg-amber-400' : 'bg-green-500'}`}></span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate">
                        {isMe ? "Tu" : (u.firstName ? `${u.firstName} ${u.lastName}` : u.username)}
                      </span>
                      {u.currentSessionStart && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {workingMins} min netti lavorati 
                        </span>
                      )}
                    </div>
                  </div>
                );
            	})}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
