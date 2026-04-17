import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, CreditCard, CalendarDays, MessageCircle, Send, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AreaTesserati() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['/api/area-tesserati/profile'],
  });

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ['/api/gemchat/conversations'],
    refetchInterval: 5000,
  });

  const activeConversation = conversations[0];

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/gemchat/conversations");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gemchat/conversations"] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: number, message: string }) => {
      return apiRequest("POST", `/api/gemchat/conversations/${conversationId}/messages/member`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gemchat/conversations"] });
      setMessageText("");
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeConversation) return;
    sendMessageMutation.mutate({ conversationId: activeConversation.id, message: messageText });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Caricamento profilo...</div>;
  }

  const { member, enrollments = [], payments = [], documents = [] } = profile || {};
  const isExpired = member?.status?.toLowerCase() === 'scaduta';
  
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl animate-in fade-in zoom-in-95 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* SX COL - 4/12 */}
        <div className="md:col-span-4 space-y-6">
          <Card className="border-amber-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
            <CardHeader className="bg-amber-50/50 pb-4 border-b pt-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xl uppercase shadow-sm border border-amber-200">
                  {user?.firstName?.charAt(0) || user?.username?.charAt(0)}
                  {user?.lastName?.charAt(0) || ""}
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-800">{user?.lastName} {user?.firstName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1.5">Tessera Inscritti</p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-bold tracking-tight text-slate-800">{member?.cardNumber || 'N/A'}</span>
                    {member?.status === 'ATTIVA' && <Badge className="bg-emerald-500 font-bold tracking-wider">ATTIVA</Badge>}
                    {isExpired && <Badge variant="destructive" className="font-bold tracking-wider">SCADUTA</Badge>}
                    {member?.status === 'IN SCADENZA' && <Badge className="bg-amber-500 font-bold tracking-wider">IN SCADENZA</Badge>}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scadenza Medica</p>
                  <p className="font-medium text-slate-700">{member?.expirationDate ? new Date(member.expirationDate).toLocaleDateString() : 'Non impostata'}</p>
                </div>
                {isExpired && (
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md font-semibold tracking-wide border-0 mt-3">
                    Rinnova Tessera
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-slate-500" />
                I miei documenti
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Regolamento Generale</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px] uppercase font-bold tracking-wider">FIRMATO</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Certificato Medico</span>
                  {documents.find((d:any) => d.type === 'medical') ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px] uppercase font-bold tracking-wider">CARICATO</Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-xs border-dashed border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                       Carica file
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DX COL - 8/12 */}
        <div className="md:col-span-8 space-y-6">
          <Card>
            <CardHeader className="py-4 border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                Le mie iscrizioni
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {enrollments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 italic text-sm">
                  Nessun corso attivo al momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enr: any, i: number) => (
                    <div key={i} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm hover:border-indigo-200 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-800 text-base">{enr.courseName}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{enr.schedule}</span>
                          <span>•</span>
                          <span>{enr.instructor}</span>
                          <span>•</span>
                          <span>{enr.room}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest text-[9px] font-bold">ISCRITTO</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                I miei pagamenti (Ultimi 5)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 italic text-sm">
                  Nessun pagamento registrato.
                </div>
              ) : (
                <div className="divide-y">
                  {payments.slice(0, 5).map((pay: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 hover:bg-slate-50/80 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{pay.description || 'Quota'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(pay.date).toLocaleDateString()}
                          {pay.method && <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded border text-[10px] uppercase font-semibold">{pay.method}</span>}
                        </p>
                      </div>
                      <span className="font-bold text-slate-800">€ {Number(pay.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="chat" className="border-amber-200 overflow-hidden flex flex-col h-[400px] shadow-sm">
            <CardHeader className="bg-amber-50/50 border-b py-3 px-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <MessageCircle className="w-5 h-5 text-amber-600" />
                GemChat Segreteria
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-slate-50 focus-within:bg-white transition-colors duration-300">
              {!activeConversation ? (
                <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(252,211,77,0.5)]">
                    <MessageCircle className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-slate-800 font-bold mb-1 text-lg">Hai bisogno di aiuto?</p>
                  <p className="text-sm text-slate-500 mb-6 max-w-sm">Inizia una conversazione diretta con lo staff del centro. Ti risponderemo il prima possibile.</p>
                  <Button 
                    onClick={() => createConversationMutation.mutate()}
                    disabled={createConversationMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 shadow-md font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuova Richiesta
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeConversation.messages?.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-10 italic">
                        Invia un messaggio per iniziare la conversazione
                      </div>
                    ) : (
                      activeConversation.messages?.map((msg: any) => (
                        <div key={msg.id} className={`flex ${msg.senderType === 'member' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-4 py-2 text-sm shadow-sm ${msg.senderType === 'member' ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white rounded-2xl rounded-br-sm' : 'bg-white border text-slate-800 rounded-2xl rounded-bl-sm pb-3 text-left'}`}>
                            {msg.content}
                            <div className={`text-[9px] mt-1 text-right block ${msg.senderType === 'member' ? 'text-amber-100' : 'text-slate-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-white border-t flex gap-2 items-center">
                    <Input 
                      placeholder="Scrivi un messaggio qui..." 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-amber-500 rounded-full px-4 h-11"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !messageText.trim()}
                      className="bg-amber-600 hover:bg-amber-700 rounded-full w-11 h-11 p-0 shrink-0 shadow-sm"
                    >
                      <Send className="w-5 h-5 -ml-0.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
