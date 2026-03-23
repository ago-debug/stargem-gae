import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PriceList, PriceListItem, InsertPriceList, InsertPriceListItem, Course, Workshop, BookingService, Quote, InsertQuote, insertQuoteSchema, PaidTrial, FreeTrial, SingleLesson, SundayActivity, Training, IndividualLesson, CampusActivity, Recital, VacationStudy } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPriceListSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Calendar, Database, Search, Coins, Tag, Star, User, Users, Sun, Music, Plane, Dumbbell, PlayCircle, Building2, Globe, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import { getActiveActivities } from "@/config/activities";
export default function PriceLists() {
    const { toast } = useToast();
    const [selectedList, setSelectedList] = useState<PriceList | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isQuotesOpen, setIsQuotesOpen] = useState(false);

    const [, params] = useRoute("/listini-base/:activityType");
    const [, baseParams] = useRoute("/listini");
    const activityType = params?.activityType || "corsi"; // fallback for general view

    const { data: priceLists, isLoading: isLoadingLists } = useQuery<PriceList[]>({
        queryKey: ["/api/price-lists"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: InsertPriceList) => {
            const res = await apiRequest("POST", "/api/price-lists", data);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
            setIsCreateOpen(false);
            toast({ title: "Listino creato con successo" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/price-lists/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
            if (selectedList?.id === selectedList?.id) setSelectedList(null);
            toast({ title: "Listino eliminato" });
        },
    });

    if (isLoadingLists) {
        return <div className="p-8 text-center">Caricamento listini...</div>;
    }

    return (
        <div className="p-6 md:p-8 space-y-8 mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestione Quote e Listini</h1>
                    <p className="text-muted-foreground mt-1">
                        Crea e gestisci i listini prezzi con validità temporale per corsi e servizi.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isQuotesOpen} onOpenChange={setIsQuotesOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Coins className="w-4 h-4" />
                                Gestione Quote Base
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Gestione Quote Standard</DialogTitle>
                            </DialogHeader>
                            <QuotesManager />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Nuovo Listino
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crea Nuovo Listino</DialogTitle>
                            </DialogHeader>
                            <PriceListForm onSubmit={(data) => createMutation.mutate(data)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Tutti i Listini</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {priceLists?.map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => setSelectedList(list)}
                                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${selectedList?.id === list.id ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"}`}
                                >
                                    <p className="font-semibold text-sm">{list.name}</p>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground uppercase tracking-widest">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(list.validFrom), "dd/MM/yy")} - {format(new Date(list.validTo), "dd/MM/yy")}
                                    </div>
                                    {list.active ? (
                                        <Badge variant="outline" className="mt-2 text-[8px] h-4 bg-green-50 text-green-700 border-green-200">ATTIVO</Badge>
                                    ) : (
                                        <Badge variant="outline" className="mt-2 text-[8px] h-4 bg-gray-50 text-gray-500 border-gray-200">NON ATTIVO</Badge>
                                    )}
                                </button>
                            ))}
                            {priceLists?.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    Nessun listino trovato.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 shadow-md border-t-4 border-t-primary">
                    {selectedList ? (
                        <PriceListDetails
                            list={selectedList}
                            onDelete={() => deleteMutation.mutate(selectedList.id)}
                        />
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                            <Database className="w-12 h-12 mb-4 opacity-20" />
                            <p>Seleziona un listino per visualizzare e modificare le quote.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function PriceListForm({ onSubmit, initialData }: { onSubmit: (data: InsertPriceList) => void, initialData?: PriceList }) {
    const form = useForm<InsertPriceList>({
        resolver: zodResolver(insertPriceListSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            validFrom: new Date(initialData.validFrom),
            validTo: new Date(initialData.validTo),
            notes: initialData.notes,
            active: initialData.active,
        } : {
            name: "",
            validFrom: new Date(),
            validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            notes: "",
            active: true,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome Listino</FormLabel>
                            <FormControl>
                                <Input placeholder="es. Listino Corsi Danza 2025/26" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="validFrom"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valido Da</FormLabel>
                                <FormControl>
                                    <Input type="date" value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(new Date(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="validTo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valido A</FormLabel>
                                <FormControl>
                                    <Input type="date" value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""} onChange={(e) => field.onChange(new Date(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Note</FormLabel>
                            <FormControl>
                                <Input placeholder="Opzionale..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full mt-4">Salva Listino</Button>
            </form>
        </Form>
    );
}

function PriceListDetails({ list, onDelete }: { list: PriceList, onDelete: () => void }) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("corsi");

    const { data: items, isLoading: isLoadingItems } = useQuery<PriceListItem[]>({
        queryKey: [`/api/price-lists/${list.id}/items`],
    });

    const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
    const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
    const { data: services } = useQuery<BookingService[]>({ queryKey: ["/api/booking-services"] });
    const { data: sundayActivities } = useQuery<SundayActivity[]>({ queryKey: ["/api/sunday-activities"] });
    const { data: trainings } = useQuery<Training[]>({ queryKey: ["/api/trainings"] });
    const { data: individualLessons } = useQuery<IndividualLesson[]>({ queryKey: ["/api/individual-lessons"] });
    const { data: campusActivities } = useQuery<CampusActivity[]>({ queryKey: ["/api/campus-activities"] });
    const { data: recitals } = useQuery<Recital[]>({ queryKey: ["/api/recitals"] });
    const { data: vacationStudies } = useQuery<VacationStudy[]>({ queryKey: ["/api/vacation-studies"] });
    const { data: quotes } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });

    const upsertItemMutation = useMutation({
        mutationFn: async (data: InsertPriceListItem) => {
            const res = await apiRequest("POST", "/api/price-list-items", data);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/price-lists/${list.id}/items`] });
            toast({ title: "Quota salvata" });
        },
    });

    const deleteItemMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/price-list-items/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/price-lists/${list.id}/items`] });
            toast({ title: "Quota rimossa" });
        },
    });

    const getItemsByType = (type: string) => items?.filter(i => i.entityType === type) || [];

    return (
        <div className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
                <div>
                    <CardTitle className="text-xl flex items-center gap-3">
                        {list.name}
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                            {format(new Date(list.validFrom), "MMMM yyyy", { locale: it })}
                        </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestisci le quote per ogni servizio associato a questo listino.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                        <Plus className="w-3.5 h-3.5" /> Importa Quote
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8 gap-2" onClick={() => {
                        if (confirm("Sei sicuro di voler eliminare questo listino e tutte le sue quote?")) onDelete();
                    }}>
                        <Trash2 className="w-3.5 h-3.5" /> Elimina
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="w-full relative">
                        <TabsList className="bg-muted w-full flex justify-start p-1 h-12 overflow-x-auto scrollbar-hide shrink-0 pb-1 touch-pan-x">
                            {getActiveActivities().filter(a => a.visibility.listini).map(item => {
                                const Icon = item.design.icon;
                                return (
                                    <TabsTrigger key={item.id} value={item.id} className="h-full gap-2 whitespace-nowrap min-w-max">
                                        <Icon className="w-4 h-4" /> {item.labelUI}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    <TabsContent value="corsi" className="space-y-4">
                        <PriceItemManager
                            type="course"
                            entities={courses || []}
                            activeItems={getItemsByType("course")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "course", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="workshop" className="space-y-4">
                        <PriceItemManager
                            type="workshop"
                            entities={workshops || []}
                            activeItems={getItemsByType("workshop")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "workshop", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="eventi-esterni" className="space-y-4">
                        <PriceItemManager
                            type="booking_service"
                            entities={services || []}
                            activeItems={getItemsByType("booking_service")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "booking_service", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="affitti" className="space-y-4">
                        <PriceItemManager
                            type="affitto"
                            entities={[]}
                            activeItems={getItemsByType("affitto")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => {}}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="merchandising" className="space-y-4">
                        <PriceItemManager
                            type="merchandising"
                            entities={[]}
                            activeItems={getItemsByType("merchandising")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => {}}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="prove-pagamento" className="space-y-4">
                        <PriceItemManager
                            type="paid_trial"
                            entities={[]}
                            activeItems={getItemsByType("paid_trial")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "paid_trial", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="prove-gratuite" className="space-y-4">
                        <PriceItemManager
                            type="free_trial"
                            entities={[]}
                            activeItems={getItemsByType("free_trial")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "free_trial", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="lezioni-singole" className="space-y-4">
                        <PriceItemManager
                            type="single_lesson"
                            entities={[]}
                            activeItems={getItemsByType("single_lesson")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "single_lesson", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="domeniche" className="space-y-4">
                        <PriceItemManager
                            type="sunday_activity"
                            entities={sundayActivities || []}
                            activeItems={getItemsByType("sunday_activity")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "sunday_activity", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="allenamenti" className="space-y-4">
                        <PriceItemManager
                            type="training"
                            entities={trainings || []}
                            activeItems={getItemsByType("training")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "training", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="lezioni-individuali" className="space-y-4">
                        <PriceItemManager
                            type="individual_lesson"
                            entities={individualLessons || []}
                            activeItems={getItemsByType("individual_lesson")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "individual_lesson", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="campus" className="space-y-4">
                        <PriceItemManager
                            type="campus_activity"
                            entities={campusActivities || []}
                            activeItems={getItemsByType("campus_activity")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "campus_activity", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="saggi" className="space-y-4">
                        <PriceItemManager
                            type="recital"
                            entities={recitals || []}
                            activeItems={getItemsByType("recital")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "recital", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>

                    <TabsContent value="vacanze-studio" className="space-y-4">
                        <PriceItemManager
                            type="vacation_study"
                            entities={vacationStudies || []}
                            activeItems={getItemsByType("vacation_study")}
                            quotes={quotes || []}
                            onUpsert={(id, price, quoteId) => upsertItemMutation.mutate({ priceListId: list.id, entityType: "vacation_study", entityId: id, price: price.toString(), quoteId })}
                            onDelete={(itemId) => deleteItemMutation.mutate(itemId)}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </div>
    );
}

function PriceItemManager({ type, entities, activeItems, quotes, onUpsert, onDelete }: {
    type: string,
    entities: any[],
    activeItems: PriceListItem[],
    quotes: Quote[],
    onUpsert: (id: number, price: number, quoteId?: number) => void,
    onDelete: (itemId: number) => void
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredEntities = entities.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.sku && e.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<any>("name");

    const getSortValue = (entity: any, key: string) => {
        switch (key) {
            case "sku": return entity.sku || "";
            case "name": return entity.name;
            case "price": return entity.price ? parseFloat(entity.price) : 0;
            default: return null;
        }
    };

    const sortedEntities = sortItems(filteredEntities, getSortValue);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Cerca per nome o SKU..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <SortableTableHead sortKey="sku" currentSort={sortConfig} onSort={handleSort} className="w-[100px]">SKU</SortableTableHead>
                            <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>Nome</SortableTableHead>
                            <SortableTableHead sortKey="price" currentSort={sortConfig} onSort={handleSort} className="w-[150px]">Prezzo Base</SortableTableHead>
                            <TableHead className="w-[180px]">Applica Quota</TableHead>
                            <TableHead className="w-[150px] text-right">Quota Listino (€)</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedEntities.map((entity) => {
                            const activeItem = activeItems.find(i => i.entityId === entity.id);
                            return (
                                <TableRow key={entity.id} className={activeItem ? "bg-primary/5" : ""}>
                                    <TableCell className={cn("font-mono text-[10px] text-muted-foreground uppercase", isSortedColumn("sku") && "sorted-column-cell")}>{entity.sku || "-"}</TableCell>
                                    <TableCell className={cn("font-medium text-sm", isSortedColumn("name") && "sorted-column-cell")}>{entity.name}</TableCell>
                                    <TableCell className={cn("text-muted-foreground text-sm font-mono", isSortedColumn("price") && "sorted-column-cell")}>
                                        {entity.price ? `€ ${parseFloat(entity.price).toFixed(2)}` : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={activeItem?.quoteId?.toString() || ""}
                                            onValueChange={(val) => {
                                                const quote = quotes.find(q => q.id.toString() === val);
                                                if (quote) onUpsert(entity.id, parseFloat(quote.amount as any), quote.id);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Seleziona quota..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {quotes.map(q => (
                                                    <SelectItem key={q.id} value={q.id.toString()}>
                                                        {q.name} (€{q.amount})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-8 text-right font-mono"
                                            defaultValue={activeItem ? activeItem.price : ""}
                                            placeholder="-"
                                            onBlur={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) onUpsert(entity.id, val);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {activeItem && (
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(activeItem.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredEntities.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Nessuna voce trovata.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function Sparkles(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    )
}

function QuotesManager() {
    const { toast } = useToast();
    const { data: quotes, isLoading } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });

    const createQuoteMutation = useMutation({
        mutationFn: async (data: InsertQuote) => {
            const res = await apiRequest("POST", "/api/quotes", data);
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
            toast({ title: "Quota creata" });
        },
    });

    const deleteQuoteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/quotes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
            toast({ title: "Quota eliminata" });
        },
    });

    const form = useForm<InsertQuote>({
        resolver: zodResolver(insertQuoteSchema),
        defaultValues: {
            name: "",
            amount: "0.00",
            category: "Generale",
            notes: "",
            active: true
        }
    });

    const { sortConfig, handleSort, sortItems, isSortedColumn } = useSortableTable<Quote>("name");

    const getSortValue = (quote: Quote, key: string) => {
        switch (key) {
            case "name": return quote.name;
            case "category": return quote.category;
            case "amount": return quote.amount ? parseFloat(quote.amount as any) : 0;
            default: return null;
        }
    };

    const sortedQuotes = sortItems(quotes || [], getSortValue);

    if (isLoading) return <div>Caricamento quote...</div>;

    return (
        <div className="space-y-6">
            <Card className="border shadow-sm bg-muted/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Aggiungi Nuova Quota</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((data) => {
                            createQuoteMutation.mutate(data);
                            form.reset({ name: "", amount: "0.00", category: "Generale", notes: "", active: true });
                        })} className="flex gap-4 items-end">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className="text-xs">Nome Quota</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="es. Quota Mensile" className="h-9" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem className="w-[120px]">
                                        <FormLabel className="text-xs">Importo (€)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={field.value}
                                                onChange={e => field.onChange(e.target.value)}
                                                className="h-9"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem className="w-[180px]">
                                        <FormLabel className="text-xs">Categoria</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "Generale"}>
                                            <FormControl>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Categoria" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Generale">Generale</SelectItem>
                                                <SelectItem value="Corsi">Corsi</SelectItem>
                                                <SelectItem value="Workshop">Workshop</SelectItem>
                                                <SelectItem value="Iscrizione">Iscrizione</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" size="sm" className="h-9 px-4">Aggiungi</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <SortableTableHead sortKey="name" currentSort={sortConfig} onSort={handleSort}>Nome</SortableTableHead>
                            <SortableTableHead sortKey="category" currentSort={sortConfig} onSort={handleSort}>Categoria</SortableTableHead>
                            <SortableTableHead sortKey="amount" currentSort={sortConfig} onSort={handleSort}>Importo</SortableTableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedQuotes.map((quote) => (
                            <TableRow key={quote.id}>
                                <TableCell className={cn("font-medium", isSortedColumn("name") && "sorted-column-cell")}>{quote.name}</TableCell>
                                <TableCell className={cn(isSortedColumn("category") && "sorted-column-cell")}>
                                    <Badge variant="secondary" className="font-normal text-xs">{quote.category}</Badge>
                                </TableCell>
                                <TableCell className={cn("font-mono", isSortedColumn("amount") && "sorted-column-cell")}>€ {Number(quote.amount).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteQuoteMutation.mutate(quote.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
