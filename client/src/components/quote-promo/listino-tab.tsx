import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuoteListini from "@/pages/quote-listini";

export function ListinoTab() {
  const [selectedType, setSelectedType] = useState("adulti");

  const activityTypes = [
    { value: "adulti", label: "Corsi Adulti" },
    { value: "bambini", label: "Bambini/Ragazzi" },
    { value: "aerial", label: "Discipline Aeree" },
    { value: "open", label: "Abbonamenti Open" },
    { value: "privata", label: "Lezioni Private" },
    { value: "affitto", label: "Affitti Sale" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center bg-slate-50 border-b pb-4">
          <div>
            <CardTitle className="text-xl">Listino Prezzi</CardTitle>
            <CardDescription>
              Gestione quote mensili e calcolo automatico per lezioni.
            </CardDescription>
          </div>
          <div className="w-64">
             <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-white font-semibold">
                   <SelectValue placeholder="Seleziona Categoria..." />
                </SelectTrigger>
                <SelectContent>
                   {activityTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <QuoteListini activityType={selectedType} embeddedMode={true} />
        </CardContent>
      </Card>
    </div>
  );
}
