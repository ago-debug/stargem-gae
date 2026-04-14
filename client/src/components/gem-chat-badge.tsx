import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageCircle, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/App";

export function GemChatBadge() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: counts = { member: 0, staff: 0 } } = useQuery({
    queryKey: ['/api/gemchat/unread-counts'],
    refetchInterval: 5000,
    queryFn: async () => {
      // Mock data in attesa di F1-012 backend API
      return { member: 0, staff: 0 };
    }
  });

  // RBAC tramite App.tsx as requested
  if (!hasPermission(user as any, '/gemchat')) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-1">
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" className="relative" data-testid="button-gemchat-member" onClick={() => setIsOpen(true)}>
            <MessageCircle className="w-5 h-5 text-amber-600" />
            {counts.member > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {counts.member > 99 ? '99+' : counts.member}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" className="relative" data-testid="button-gemchat-staff" onClick={() => setIsOpen(true)}>
            <Briefcase className="w-5 h-5 text-indigo-600" />
            {counts.staff > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {counts.staff > 99 ? '99+' : counts.staff}
              </span>
            )}
          </Button>
        </SheetTrigger>
      </div>

      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-4 border-l">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            GemChat
          </SheetTitle>
          <SheetDescription>
            Centro messaggi interno e verso i tesserati.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 mt-4 flex flex-col overflow-hidden">
          <Tabs defaultValue="member" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="member" className="flex items-center gap-2">
                💬 Tesserati
                {counts.member > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 ml-1">
                    {counts.member > 99 ? '99+' : counts.member}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                🎓 Staff
                {counts.staff > 0 && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 ml-1">
                    {counts.staff > 99 ? '99+' : counts.staff}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="member" className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-dashed rounded-lg">
              <MessageCircle className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-semibold text-slate-600 mb-1">Nessun messaggio recente</p>
              <p className="text-xs text-muted-foreground">La lista delle chat coi soci prenderà vita qui nel protocollo F2-011.</p>
            </TabsContent>

            <TabsContent value="staff" className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-dashed rounded-lg">
              <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-semibold text-slate-600 mb-1">Centro Comunicazioni Team</p>
              <p className="text-xs text-muted-foreground">Integrazione in arrivo per le chat dirette con gli insegnanti e i dipendenti.</p>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
