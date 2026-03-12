import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    Sparkles,
    Sun,
    Dumbbell,
    UserCheck,
    Users,
    Award,
    Music,
    ArrowLeft,
    Database,
    Table,
    CreditCard,
    Gift,
    BookOpen,
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface CategoryInfo {
    id: string;
    label: string;
    icon: typeof Calendar;
    color: string;
}

const listiniCategories: CategoryInfo[] = [
    { id: "corsi", label: "Corsi", icon: Calendar, color: "icon-gold-bg" },
    { id: "workshop", label: "Workshop", icon: Sparkles, color: "icon-gold-bg" },
    { id: "domeniche", label: "Domeniche in Movimento", icon: Sun, color: "icon-gold-bg" },
    { id: "allenamenti", label: "Allenamenti/Affitti", icon: Dumbbell, color: "icon-gold-bg" },
    { id: "lezioni-individuali", label: "Lezioni Individuali", icon: UserCheck, color: "icon-gold-bg" },
    { id: "campus", label: "Campus", icon: Users, color: "icon-gold-bg" },
    { id: "saggi", label: "Saggi", icon: Award, color: "icon-gold-bg" },
    { id: "vacanze-studio", label: "Vacanze Studio", icon: Music, color: "icon-gold-bg" },
    { id: "prove-pagamento", label: "Prove a Pagamento", icon: CreditCard, color: "icon-gold-bg" },
    { id: "prove-gratuite", label: "Prove Gratuite", icon: Gift, color: "icon-gold-bg" },
    { id: "lezioni-singole", label: "Lezioni Singole", icon: BookOpen, color: "icon-gold-bg" },
    { id: "servizi", label: "Servizi Extra", icon: Database, color: "icon-gold-bg" },
];

function CategoryListinoCard({ info, basePath }: { info: CategoryInfo, basePath: string }) {
    const url = `${basePath}/${info.id}`;
    return (
        <Link href={url}>
            <Card className="hover-elevate cursor-pointer h-full border-border/60 shadow-sm" data-testid={`card-listino-${info.id}`}>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg ${info.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <info.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-bold text-foreground leading-tight">{info.label}</h3>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function ListiniHome() {
    const [activeTab, setActiveTab] = useState("q1c");

    return (
        <div className="p-6 md:p-8 space-y-8 mx-auto">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1" data-testid="text-page-title">
                            Listini per Attività
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Gestisci i prezzi e le quote per ogni tipologia (Q1C Interattivo o Listini Base)
                        </p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex justify-center border-b pb-4">
                    <TabsList className="bg-slate-100 p-1 h-14">
                        <TabsTrigger value="q1c" className="px-8 flex items-center gap-2 text-base data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                            <Table className="w-5 h-5" /> Quote Q1C Mensili
                        </TabsTrigger>
                        <TabsTrigger value="base" className="px-8 flex items-center gap-2 text-base data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                            <Database className="w-5 h-5" /> Listini Base
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="q1c" className="mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {listiniCategories.map((info) => (
                            <CategoryListinoCard key={`q1c-${info.id}`} info={info} basePath="/quote-listini" />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="base" className="mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {listiniCategories.map((info) => (
                            <CategoryListinoCard key={`base-${info.id}`} info={info} basePath="/listini-base" />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
