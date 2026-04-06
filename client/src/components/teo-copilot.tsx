import React, { useState, useRef, useEffect } from "react";
import { useCopilot } from "@/hooks/use-copilot";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, Bot, User as UserIcon, Loader2, Sparkles, Receipt, FileText, X } from "lucide-react";

interface Message {
  id: string;
  sender: 'user' | 'system';
  text: string;
  isPdf?: boolean;
}

export function TeoCopilot() {
  const { isOpen, closeCopilot } = useCopilot();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'system', text: `Ciao ${user?.username || 'Utente'}, sono TeoCopilot! Come posso aiutarti oggi? ` }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll all'ultimo messaggio
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputVal.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: inputVal };
    setMessages(prev => [...prev, userMessage]);
    setInputVal("");
    setIsTyping(true);

    const valLower = userMessage.text.toLowerCase();

    // Mock della logica AI basata sui ruoli (RBAC) e funzioni
    setTimeout(() => {
      let responseText = "Ho capito. Sto elaborando la tua richiesta all'interno del gestionale...";

      // Esempio logica "Manuale del gestionale"
      if (valLower.includes('come funziona') || valLower.includes('spiega')) {
        responseText = "Per accedere alle prenotazioni di sale o attività, apri il modulo 'Planning' a sinistra. Lì potrai vedere tutte le allocazioni. Io sono stato collegato ai manuali interni, se hai bisogno di un iter preciso, chiedi pure!";
      } 
      // Esempio Simulazione Lettura File (OCR)
      else if (valLower.includes('archivia') || valLower.includes('fattur') || valLower.includes('ricevut')) {
        if (user?.role === 'master' || user?.role === 'admin') {
          responseText = "Ho simulato l'estrazione OCR del documento. Totale letto: €1,240.00. Ho archiviato il flusso nella sezione Contabilità. I tuoi permessi di Master ti permettono di vedere il dettaglio completo.";
        } else {
          responseText = "Ho protocollato il documento. Nota: in base al tuo ruolo (Segreteria), non posso mostrarti i dati finanziari macro, ma ho avvisato l'amministratore dell'avvenuto inserimento.";
        }
      }
      else if (valLower.includes('permessi') || valLower.includes('ruolo') || valLower.includes('chi sono')) {
         responseText = `Attualmente sei loggato come: ${user?.username} (Ruolo: ${user?.role}). La mia visibilità dei dati è tarata sui tuoi permessi.`;
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'system', text: responseText }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSimulateFileUpload = () => {
     const fileMessage: Message = { id: Date.now().toString(), sender: 'user', text: "Ricevuta_Telecom_Marzo.pdf", isPdf: true };
     setMessages(prev => [...prev, fileMessage]);
     setIsTyping(true);

     setTimeout(() => {
         let response = "File ricevuto. Analizzo l'immagine in corso...";
         if (user?.role === 'master' || user?.role === 'admin') {
            response = "Ho letto la ricevuta. Importo: €120.50. Categoria: Utenze. Vuoi che lo registri in Partita Doppia nella Scheda Contabile?";
         } else {
            response = "Ricevuta caricata e protocollata nei file temporanei fiduciari. Aspetto il via libera dall'Amministrazione.";
         }
         setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'system', text: response }]);
         setIsTyping(false);
     }, 2000);
  };

  if (!isOpen) return null;

  return (
      <aside className="w-[400px] border-l border-slate-200 bg-white flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-300 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
        <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary text-xl font-semibold">
            <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm">
                    <AvatarImage src="/assets/teo-head-new.png" alt="Teo Copilot" className="object-cover bg-white" />
                    <AvatarFallback className="bg-primary text-white"><Bot className="w-5 h-5" /></AvatarFallback>
                </Avatar>
            </div>
            <div>
               <div>TeoCopilot</div>
               <div className="text-xs text-slate-500 font-normal">
                  Assistente AI del Gestionale • {user?.role?.toUpperCase()} Access
               </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCopilot} className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50">
             <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Area Messaggi */}
        <ScrollArea className="flex-1 p-4 bg-slate-50/50">
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.sender === 'system' ? (
                    <Avatar className="w-8 h-8 shrink-0 border border-slate-200 shadow-sm">
                        <AvatarImage src="/assets/teo-head-new.png" alt="Teo" className="object-cover bg-white" />
                        <AvatarFallback className="bg-primary text-white"><Bot className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                ) : (
                    <Avatar className="w-8 h-8 shrink-0 border border-slate-200 shadow-sm">
                        <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold text-xs">
                           {user?.username ? user.username.substring(0, 2).toUpperCase() : 'ME'}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className={`filter max-w-[80%] rounded-xl p-3 text-sm shadow-sm ${msg.sender === 'system' ? 'bg-white border text-slate-800' : 'bg-primary text-white'}`}>
                  {msg.isPdf ? (
                     <div className="flex items-center gap-2 font-medium">
                        <FileText className="w-4 h-4" /> {msg.text}
                     </div>
                  ) : (
                     msg.text
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
                <div className="flex gap-3">
                    <Avatar className="w-8 h-8 shrink-0 border border-slate-200 shadow-sm">
                        <AvatarImage src="/assets/teo-head-new.png" alt="Teo" className="object-cover bg-white" />
                        <AvatarFallback className="bg-primary text-white"><Bot className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                    <div className="bg-white border max-w-[80%] rounded-xl p-3 text-sm shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" /> 
                        <span className="text-slate-400">Teo sta scrivendo...</span>
                    </div>
                </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t space-y-3">
           <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleSimulateFileUpload} title="Simula caricamento ricevuta/PDF" className="shrink-0 text-slate-500 rounded-full">
                    <Paperclip className="w-4 h-4" />
                </Button>
                <form 
                    className="flex flex-1 gap-2 relative"
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                >
                    <Input 
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Chiedi a Teo o condividi documenti..."
                        className="rounded-full pr-10 focus-visible:ring-primary/50 border-slate-300"
                        disabled={isTyping}
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!inputVal.trim() || isTyping} 
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
