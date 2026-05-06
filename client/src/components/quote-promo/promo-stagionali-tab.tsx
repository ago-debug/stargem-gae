import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PromoStagionaliTabProps {
  seasonId: number | "active";
}

export function PromoStagionaliTab({ seasonId }: PromoStagionaliTabProps) {
  // BOZZA: Dati fittizi per la visualizzazione
  const [selectedPromo, setSelectedPromo] = useState("autunno");

  const promos = [
    { id: "autunno", name: "Promo Autunno" },
    { id: "inverno", name: "Promo Inverno" },
    { id: "primavera", name: "Promo Primavera" },
    { id: "estate", name: "Promo Estate" },
  ];

  // Matrice fittizia simile al "Listino Base"
  const [matrix, setMatrix] = useState([
    {
      category: "Adulti",
      course1: "-10%",
      course2: "-15%",
      course3: "-20%",
      pack10: "",
    },
    {
      category: "Bambini",
      course1: "-10€",
      course2: "-15€",
      course3: "",
      pack10: "",
    },
    { category: "Aerial", course1: "", course2: "", course3: "", pack10: "" },
    {
      category: "Privata sing.",
      course1: "",
      course2: "",
      course3: "",
      pack10: "",
    },
    {
      category: "Affitto 1+1",
      course1: "",
      course2: "",
      course3: "",
      pack10: "",
    },
  ]);

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newMatrix = [...matrix];
    (newMatrix[rowIndex] as any)[field] = value;
    setMatrix(newMatrix);
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
        <AlertCircle className="size-4 text-blue-600" />
        <AlertDescription>
          <strong>Bozza Interfaccia:</strong> Questa è un'anteprima della nuova
          logica per le Promozioni. Le celle accettano sia valori fissi (es.{" "}
          <strong>-10€</strong>) sia percentuali (es. <strong>-15%</strong>).
          Lasciando vuoto, la promo non si applica.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/50 pb-4">
          <div>
            <CardTitle className="text-xl">
              Gestione Promozioni Stagionali
            </CardTitle>
            <CardDescription>
              Configura gli sconti da applicare al Listino Base per ogni periodo
              promozionale.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPromo} onValueChange={setSelectedPromo}>
              <SelectTrigger className="w-[200px] bg-background font-semibold">
                <SelectValue placeholder="Seleziona Promo..." />
              </SelectTrigger>
              <SelectContent>
                {promos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="shadow-sm">
              <Plus className="mr-2 size-4" /> Nuova Promo
            </Button>
            <Button className="bg-indigo-600 shadow-sm hover:bg-indigo-700">
              <Save className="mr-2 size-4" /> Salva Griglia
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome Promozione
              </label>
              <Input
                defaultValue={promos.find((p) => p.id === selectedPromo)?.name}
                className="font-semibold"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Validità (Dal - Al)
              </label>
              <div className="flex items-center gap-2">
                <Input type="date" defaultValue="2026-09-01" />
                <span className="text-muted-foreground">-</span>
                <Input type="date" defaultValue="2026-10-31" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="w-[200px] border-r font-semibold">
                    Categoria (Listino Base)
                  </TableHead>
                  <TableHead className="border-r text-center font-semibold">
                    1 corso
                  </TableHead>
                  <TableHead className="border-r text-center font-semibold">
                    2 corsi
                  </TableHead>
                  <TableHead className="border-r text-center font-semibold">
                    3+ corsi
                  </TableHead>
                  <TableHead className="text-center font-semibold">
                    Pack 10 / Extra
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.map((row, i) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="border-r bg-muted/10 font-medium">
                      {row.category}
                    </TableCell>
                    <TableCell className="border-r p-2">
                      <Input
                        value={row.course1}
                        onChange={(e) =>
                          handleCellChange(i, "course1", e.target.value)
                        }
                        placeholder="-10% o -15€"
                        className="h-9 text-center"
                      />
                    </TableCell>
                    <TableCell className="border-r p-2">
                      <Input
                        value={row.course2}
                        onChange={(e) =>
                          handleCellChange(i, "course2", e.target.value)
                        }
                        placeholder="-10% o -15€"
                        className="h-9 text-center"
                      />
                    </TableCell>
                    <TableCell className="border-r p-2">
                      <Input
                        value={row.course3}
                        onChange={(e) =>
                          handleCellChange(i, "course3", e.target.value)
                        }
                        placeholder="-10% o -15€"
                        className="h-9 text-center"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input
                        value={row.pack10}
                        onChange={(e) =>
                          handleCellChange(i, "pack10", e.target.value)
                        }
                        placeholder="-10% o -15€"
                        className="h-9 text-center"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 p-3 text-sm text-muted-foreground dark:bg-slate-900">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <p>
              In questa griglia decidi quali categorie e pacchetti beneficiano
              della promozione selezionata. Scrivi <strong>-15%</strong> per uno
              sconto percentuale, oppure <strong>-20€</strong> per uno sconto
              fisso. Se lasci una cella vuota, il prezzo base rimarrà invariato
              per quella combinazione.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
