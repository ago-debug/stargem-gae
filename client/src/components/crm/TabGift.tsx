import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Plus, Trash2 } from "lucide-react";

export interface TabGiftProps {
  selectedMemberId: number | null | undefined;
  showGiftFields: boolean;
  setShowGiftFields: (v: boolean) => void;
  bottomSectionsData: { gift: any[] };
  setBottomSectionsData: React.Dispatch<React.SetStateAction<any>>;
  setDirtyFields: React.Dispatch<React.SetStateAction<any>>;
  handleBottomSectionChange: (section: any, field: string, value: any, index?: number) => void;
  getBottomSectionClassName: (section: string, field: string) => string;
}

export function TabGift({
  selectedMemberId,
  showGiftFields,
  setShowGiftFields,
  bottomSectionsData,
  setBottomSectionsData,
  setDirtyFields,
  handleBottomSectionChange,
  getBottomSectionClassName
}: TabGiftProps) {
  return (
    <>

    {/* GIFT - BUONO - RESO - HELLO GEM */}
        <Card id="gift" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <Gift className="w-5 h-5 sidebar-icon-gold" />
                Gift - Buono - Reso - Hello Gem
              </span>
              <Button
                size="sm"
                className="gold-3d-button"
                data-testid="button-aggiungi-gift"
                disabled={!selectedMemberId}
                onClick={() => {
                  setShowGiftFields(true);
                  setBottomSectionsData(prev => ({
                    ...prev,
                    gift: [...prev.gift, { id: Date.now().toString(), tipo: "", valore: "", numero: "", dataEmissione: "", dataScadenza: "", motivazione: "", dataUtilizzo: "", iban: "" }]
                  }));
                  setDirtyFields(prev => ({ ...prev, gift_added: true }));
                }}
              >
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedMemberId ? (
              <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
                Salva o seleziona un partecipante per sbloccare questa sezione
              </div>
            ) : showGiftFields && bottomSectionsData.gift.length > 0 ? (
              <div className="space-y-8">
                {bottomSectionsData.gift.map((item, index) => (
                  <div key={item.id || index} className="space-y-4 relative pt-4 border-t border-border/50 first:pt-0 first:border-t-0">
                    {index > 0 && (
                      <div className="absolute top-4 right-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 px-2"
                          onClick={() => {
                            if (confirm("Sei sicuro di voler rimuovere questo elemento?")) {
                              setBottomSectionsData((prev: any) => ({ ...prev, gift: prev.gift.filter((_: any, i: number) => i !== index) }));
                              setDirtyFields((prev: any) => ({ ...prev, gift_removed: true }));
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Rimuovi
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={item.tipo} onValueChange={(v) => handleBottomSectionChange('gift', 'tipo', v, index)}>
                          <SelectTrigger className={getBottomSectionClassName('gift', `tipo_${index}`)}>
                            <SelectValue placeholder="Seleziona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gift">Gift Card</SelectItem>
                            <SelectItem value="buono">Buono</SelectItem>
                            <SelectItem value="reso">Reso</SelectItem>
                            <SelectItem value="hellogem">Hello Gem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Valore/Importo</Label>
                        <Input type="number" value={item.valore} onChange={(e) => handleBottomSectionChange('gift', 'valore', e.target.value, index)} className={getBottomSectionClassName('gift', `valore_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Numero</Label>
                        <Input value={item.numero} onChange={(e) => handleBottomSectionChange('gift', 'numero', e.target.value, index)} className={getBottomSectionClassName('gift', `numero_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Emissione</Label>
                        <Input type="date" value={item.dataEmissione} onChange={(e) => handleBottomSectionChange('gift', 'dataEmissione', e.target.value, index)} className={getBottomSectionClassName('gift', `dataEmissione_${index}`)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Data Scadenza</Label>
                        <Input type="date" value={item.dataScadenza} onChange={(e) => handleBottomSectionChange('gift', 'dataScadenza', e.target.value, index)} className={getBottomSectionClassName('gift', `dataScadenza_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Acquistato/Utilizzato per - Motivazione</Label>
                        <Input value={item.motivazione} onChange={(e) => handleBottomSectionChange('gift', 'motivazione', e.target.value, index)} className={getBottomSectionClassName('gift', `motivazione_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Utilizzo/Reso (Convalida)</Label>
                        <Input type="date" value={item.dataUtilizzo} onChange={(e) => handleBottomSectionChange('gift', 'dataUtilizzo', e.target.value, index)} className={getBottomSectionClassName('gift', `dataUtilizzo_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input value={item.iban} onChange={(e) => handleBottomSectionChange('gift', 'iban', e.target.value, index)} className={getBottomSectionClassName('gift', `iban_${index}`)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
    </>
  );
}
