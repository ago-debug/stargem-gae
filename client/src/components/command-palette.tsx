import * as React from "react";
import { Command } from "cmdk";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Calendar, Users, Briefcase, Settings, X, Bot } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [, setLocation] = useLocation();

  // Ascolta la scorciatoia da tastiera CMD+K o CTRL+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl rounded-2xl sm:max-w-[600px] border-0 bg-transparent">
        <Command 
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-14 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 bg-background/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden"
          shouldFilter={true}
        >
          <div className="flex items-center border-b px-4" cmdk-input-wrapper="">
            <Search className="mr-3 shrink-0 text-slate-400" />
            <Command.Input 
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="Chiedi a Teo o cerca funzioni (es. Iscrivi utente...)" 
              className="flex h-16 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50" 
            />
            <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 rounded border border-border bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-xxs font-medium text-muted-foreground">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <p>Nessun risultato locale.</p>
                <p className="text-xs max-w-[250px]">L'integrazione AI diretta per la ricerca semantica è in arrivo nella Fase 3.</p>
              </div>
            </Command.Empty>

            <Command.Group heading="Suggerimenti Rapidi (AI)">
              <Command.Item 
                onSelect={() => runCommand(() => setLocation("/maschera-input"))}
                className="flex items-center cursor-pointer hover:bg-slate-100 dark:bg-slate-800 rounded-lg p-2 transition-colors data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
              >
                <Users className="mr-3 h-5 w-5 text-blue-500" />
                <div className="flex flex-col">
                  <span>Nuova Iscrizione</span>
                  <span className="text-xs text-muted-foreground">Aggiungi membro in anagrafica</span>
                </div>
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => setLocation("/planning"))}
                className="flex items-center cursor-pointer hover:bg-slate-100 dark:bg-slate-800 rounded-lg p-2 transition-colors data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
              >
                <Calendar className="mr-3 h-5 w-5 text-emerald-500" />
                <div className="flex flex-col">
                  <span>Calendario Planning</span>
                  <span className="text-xs text-muted-foreground">Visualizza o modifica il palinsesto</span>
                </div>
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => setLocation("/gemteam"))}
                className="flex items-center cursor-pointer hover:bg-slate-100 dark:bg-slate-800 rounded-lg p-2 transition-colors data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
              >
                <Briefcase className="mr-3 h-5 w-5 text-purple-500" />
                <div className="flex flex-col">
                  <span>Dashboard Shift</span>
                  <span className="text-xs text-muted-foreground">Gestisci i turni del GemTeam</span>
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Impostazioni Sistema">
               <Command.Item 
                onSelect={() => runCommand(() => setLocation("/admin"))}
                className="flex items-center cursor-pointer hover:bg-slate-100 dark:bg-slate-800 rounded-lg p-2 transition-colors data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
              >
                <Settings className="mr-3 h-5 w-5 text-muted-foreground" />
                <span>Pannello Amministratore</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
