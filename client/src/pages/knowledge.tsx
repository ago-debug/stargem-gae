import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Save, Plus, Trash2, Info } from "lucide-react";

export interface KnowledgeItem {
  id: string;
  sezione: string;
  titolo: string;
  descrizione: string;
}

const KNOWLEDGE_ITEMS_DEFAULT: KnowledgeItem[] = [
  {
    id: "allenamenti",
    sezione: "Attività",
    titolo: "Allenamenti",
    descrizione: "Gli allenamenti comprendono tutte le sessioni di attività fisica programmate per i soci. Includono:\n\n• Allenamenti individuali personalizzati\n• Sessioni di gruppo\n• Programmi di preparazione atletica\n• Recupero funzionale\n\nPer ogni allenamento è possibile specificare la categoria, il tipo di attività, la durata e l'istruttore assegnato."
  },
  {
    id: "corsi",
    sezione: "Attività",
    titolo: "Corsi",
    descrizione: "I corsi sono attività formative strutturate con un programma definito. Possono essere settimanali, mensili o stagionali."
  },
  {
    id: "workshop",
    sezione: "Attività", 
    titolo: "Workshop",
    descrizione: "I workshop sono eventi formativi intensivi, solitamente di breve durata (1-2 giorni), focalizzati su argomenti specifici."
  },
  {
    id: "merchandising",
    sezione: "Attività",
    titolo: "Merchandising",
    descrizione: "Il merchandising comprende tutti gli articoli e prodotti venduti ai soci:\n\n• Abbigliamento sportivo (magliette, felpe, pantaloni)\n• Accessori (borse, zaini, cappellini)\n• Attrezzature (guanti, protezioni)\n• Materiale didattico\n\nPer ogni articolo è possibile specificare codice, taglia, colore, quantità e prezzo."
  }
];

let globalKnowledgeItems = [...KNOWLEDGE_ITEMS_DEFAULT];

export function getKnowledgeItem(id: string): KnowledgeItem | undefined {
  return globalKnowledgeItems.find(item => item.id === id);
}

export function getAllKnowledgeItems(): KnowledgeItem[] {
  return globalKnowledgeItems;
}

export default function Knowledge() {
  const [items, setItems] = useState<KnowledgeItem[]>(globalKnowledgeItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<KnowledgeItem>>({
    sezione: "",
    titolo: "",
    descrizione: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const updateItem = (id: string, field: keyof KnowledgeItem, value: string) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(updated);
    globalKnowledgeItems = updated;
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    globalKnowledgeItems = updated;
  };

  const addItem = () => {
    if (!newItem.titolo || !newItem.sezione) return;
    
    const item: KnowledgeItem = {
      id: newItem.titolo.toLowerCase().replace(/\s+/g, '-'),
      sezione: newItem.sezione,
      titolo: newItem.titolo,
      descrizione: newItem.descrizione || ""
    };
    
    const updated = [...items, item];
    setItems(updated);
    globalKnowledgeItems = updated;
    setNewItem({ sezione: "", titolo: "", descrizione: "" });
    setShowAddForm(false);
  };

  const sezioni = Array.from(new Set(items.map(i => i.sezione)));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-knowledge">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Voce
          </Button>
        </div>

        <p className="text-muted-foreground">
          Gestisci le informazioni e descrizioni che appaiono nelle icone <Info className="w-4 h-4 inline" /> delle varie sezioni.
        </p>

        {showAddForm && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-lg">Nuova Voce Knowledge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sezione *</Label>
                  <Input
                    value={newItem.sezione}
                    onChange={(e) => setNewItem(prev => ({ ...prev, sezione: e.target.value }))}
                    placeholder="Es. Attività"
                    data-testid="input-new-sezione"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titolo *</Label>
                  <Input
                    value={newItem.titolo}
                    onChange={(e) => setNewItem(prev => ({ ...prev, titolo: e.target.value }))}
                    placeholder="Es. Allenamenti"
                    data-testid="input-new-titolo"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrizione</Label>
                <Textarea
                  value={newItem.descrizione}
                  onChange={(e) => setNewItem(prev => ({ ...prev, descrizione: e.target.value }))}
                  placeholder="Inserisci la descrizione dettagliata..."
                  rows={5}
                  data-testid="textarea-new-descrizione"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addItem} data-testid="button-save-new">
                  <Save className="w-4 h-4 mr-2" />
                  Salva
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Annulla
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sezioni.map(sezione => (
          <div key={sezione} className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="outline">{sezione}</Badge>
            </h2>
            
            {items.filter(i => i.sezione === sezione).map(item => (
              <Card key={item.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      {editingId === item.id ? (
                        <Input
                          value={item.titolo}
                          onChange={(e) => updateItem(item.id, 'titolo', e.target.value)}
                          className="h-8 w-48"
                        />
                      ) : (
                        item.titolo
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                        data-testid={`button-edit-${item.id}`}
                      >
                        {editingId === item.id ? "Fatto" : "Modifica"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingId === item.id ? (
                    <Textarea
                      value={item.descrizione}
                      onChange={(e) => updateItem(item.id, 'descrizione', e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {item.descrizione || "Nessuna descrizione"}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

        {items.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nessuna voce knowledge presente.</p>
            <p className="text-sm">Clicca "Aggiungi Voce" per iniziare.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
