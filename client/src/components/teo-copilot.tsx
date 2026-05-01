import React, { useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { useCopilot } from "@/hooks/use-copilot";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Bot, Loader2, FileText, X } from "lucide-react";

export function TeoCopilot() {
  const { isOpen, closeCopilot } = useCopilot();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    initialMessages: [
      { id: '1', role: 'assistant', content: `Ciao ${user?.username || 'Utente'}, sono TeoCopilot, la tua AI operativa! Come posso aiutarti oggi?` }
    ]
  });

  // Auto-scroll all'ultimo messaggio
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSimulateFileUpload = () => {
    // Simula caricamento file e aggiunge messaggio di contesto
    append({ role: 'user', content: "Ho caricato un file PDF per l'analisi (SIMULAZIONE)." });
  };

  if (!isOpen) return null;

  return (
      <aside className="w-[400px] border-l border-border bg-background flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-300 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
        <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary text-xl font-semibold">
            <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm">
                    <AvatarImage src="/assets/teo-head-new.png" alt="Teo Copilot" className="object-cover bg-background" />
                    <AvatarFallback className="bg-primary text-white"><Bot className="w-5 h-5" /></AvatarFallback>
                </Avatar>
            </div>
            <div>
               <div>TeoCopilot</div>
               <div className="text-xs text-muted-foreground font-normal">
                  Assistente AI del Gestionale • {user?.role?.toUpperCase()} Access
               </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCopilot} className="text-slate-400 hover:text-muted-foreground rounded-full hover:bg-slate-200/50">
             <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Area Messaggi */}
        <ScrollArea className="flex-1 p-4 bg-muted/50">
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role !== 'user' ? (
                    <Avatar className="w-8 h-8 shrink-0 border border-border shadow-sm">
                        <AvatarImage src="/assets/teo-head-new.png" alt="Teo" className="object-cover bg-background" />
                        <AvatarFallback className="bg-primary text-white"><Bot className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                ) : (
                    <Avatar className="w-8 h-8 shrink-0 border border-border shadow-sm">
                        <AvatarFallback className="bg-slate-200 text-foreground/80 font-semibold text-xs">
                           {user?.username ? user.username.substring(0, 2).toUpperCase() : 'ME'}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className={`filter max-w-[80%] rounded-xl p-3 text-sm shadow-sm whitespace-pre-wrap ${msg.role !== 'user' ? 'bg-background border text-foreground' : 'bg-primary text-white'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                    <Avatar className="w-8 h-8 shrink-0 border border-border shadow-sm">
                        <AvatarImage src="/assets/teo-head-new.png" alt="Teo" className="object-cover bg-background" />
                        <AvatarFallback className="bg-primary text-white"><Bot className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                    <div className="bg-background border max-w-[80%] rounded-xl p-3 text-sm shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" /> 
                        <span className="text-slate-400">Teo sta scrivendo...</span>
                    </div>
                </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Bar */}
        <div className="p-4 bg-background border-t space-y-3">
           <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleSimulateFileUpload} title="Simula caricamento ricevuta/PDF" className="shrink-0 text-muted-foreground rounded-full">
                    <Paperclip className="w-4 h-4" />
                </Button>
                <form 
                    className="flex flex-1 gap-2 relative"
                    onSubmit={handleSubmit}
                >
                    <Input 
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Chiedi a Teo..."
                        className="rounded-full pr-10 focus-visible:ring-primary/50 border-border"
                        disabled={isLoading}
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!input.trim() || isLoading} 
                        className="absolute right-1 top-1 bottom-1 h-8 w-8 rounded-full bg-primary"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
           </div>
           <div className="text-[10px] text-center text-slate-400">
               TeoCopilot può commettere errori. Usa le risposte come supporto operativo.
           </div>
        </div>
      </aside>
  );
}
