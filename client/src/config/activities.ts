import {
  Calendar,
  Sparkles,
  CreditCard,
  Gift,
  BookOpen,
  Dumbbell,
  Users,
  Sun,
  Award,
  Music,
  UserCheck,
  Building2,
  Globe,
  ShoppingBag,
  type LucideIcon
} from "lucide-react";

/**
 * Famiglie Logiche di Gestione: 
 * Controllano le interfacce form e le regole di business applicabili all'attività.
 */
export type GestioneFamily = 'didattica_gruppo' | 'didattica_privata' | 'evento' | 'affitto' | 'prodotto' | 'altro';

/**
 * Definizione Strict della Singola Attività.
 */
export interface ActivityDefinition {
  id: string; // Slug tecnico / Entity Type nel database (es. "corsi", "servizi")
  labelUI: string; // Nome Ufficiale Mostrato in Frontend
  order: number; // Posizione cardinale (da 1 a 14+)
  family: GestioneFamily; // Categoria descrittiva lato DB/Business Logic
  isActive: boolean; // Interruttore globale. Se false, l'attività scompare.
  isPlaceholder: boolean; // Indica se usare lo Stub nelle view di dettaglio
  routeUrl: string; // Navigazione interna per l'esplorazione
  apiEndpoint?: string; // Endpoint base per recuperare i record o categorie
  categoryManagementUrl?: string; // Route per la gestione categorie specifiche (se esiste)

  visibility: {
    sidebarMenu: boolean;
    hubAttivita: boolean;
    iscrittiPanel: boolean;
    categoriePanel: boolean;
    mascheraInput: boolean;
    listini: boolean;
    calendario: boolean;
  };

  design: {
    icon: LucideIcon;
    colorClass: string;
    description: string;
  };
}

/**
 * IL REGISTRO CENTRALE - SINGLE SOURCE OF TRUTH
 * Modificando questo file si auto-genereranno Sidebar, Categorie, Modal, Hubs e Tabelle.
 */
export const ACTIVITY_REGISTRY: ActivityDefinition[] = [
  {
    id: "corsi",
    labelUI: "Corsi",
    order: 1,
    family: "didattica_gruppo",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/corsi",
    apiEndpoint: "/api/categories",
    categoryManagementUrl: "/categorie-corsi",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: Calendar, colorClass: "icon-gold-bg", description: "Corsi regolari settimanali" }
  },
  {
    id: "workshop",
    labelUI: "Workshop",
    order: 2,
    family: "evento",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/workshops",
    apiEndpoint: "/api/workshop-categories",
    categoryManagementUrl: "/categorie-workshop",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: Sparkles, colorClass: "icon-gold-bg", description: "Workshop ed eventi speciali" }
  },
  {
    id: "prove-pagamento",
    labelUI: "Prove a Pagamento",
    order: 99,
    family: "didattica_gruppo",
    isActive: false,  // Disattivato per passaggio a modulo unificato
    isPlaceholder: false,
    routeUrl: "/attivita/prove-pagamento",
    categoryManagementUrl: "/categorie-prove-pagamento",
    apiEndpoint: "/api/categories",
    visibility: { sidebarMenu: false, hubAttivita: false, iscrittiPanel: false, categoriePanel: false, mascheraInput: false, listini: true, calendario: false },
    design: { icon: CreditCard, colorClass: "icon-gold-bg", description: "Lezioni di prova a pagamento" }
  },
  {
    id: "prove-gratuite",
    labelUI: "Prove Gratuite",
    order: 99,
    family: "didattica_gruppo",
    isActive: false, // Disattivato per passaggio a modulo unificato
    isPlaceholder: false,
    routeUrl: "/attivita/prove-gratuite",
    categoryManagementUrl: "/categorie-prove-gratuite",
    apiEndpoint: "/api/categories",
    visibility: { sidebarMenu: false, hubAttivita: false, iscrittiPanel: false, categoriePanel: false, mascheraInput: false, listini: true, calendario: false },
    design: { icon: Gift, colorClass: "icon-gold-bg", description: "Lezioni di prova gratuite" }
  },
  {
    id: "lezioni-singole",
    labelUI: "Lezioni Singole",
    order: 99,
    family: "didattica_gruppo",
    isActive: false, // Disattivato per passaggio a modulo unificato
    isPlaceholder: false,
    routeUrl: "/attivita/lezioni-singole",
    categoryManagementUrl: "/categorie-lezioni-singole",
    apiEndpoint: "/api/categories",
    visibility: { sidebarMenu: false, hubAttivita: false, iscrittiPanel: false, categoriePanel: false, mascheraInput: false, listini: true, calendario: false },
    design: { icon: BookOpen, colorClass: "icon-gold-bg", description: "Lezioni singole o drop-in" }
  },
  {
    id: "domeniche-movimento",
    labelUI: "Domeniche in Movimento",
    order: 3,
    family: "evento",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/domeniche-movimento",
    apiEndpoint: "/api/sunday-categories",
    categoryManagementUrl: "/categorie-domeniche",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: Sun, colorClass: "icon-gold-bg", description: "Attività domenicali speciali" }
  },
  {
    id: "lezioni-individuali",
    labelUI: "Lezioni Individuali",
    order: 4,
    family: "didattica_privata",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/lezioni-individuali",
    apiEndpoint: "/api/individual-lesson-categories",
    categoryManagementUrl: "/categorie-lezioni-individuali",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: UserCheck, colorClass: "icon-gold-bg", description: "Lezioni private one-to-one" }
  },
  {
    id: "allenamenti",
    labelUI: "Allenamenti",
    order: 5,
    family: "didattica_gruppo",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/allenamenti",
    apiEndpoint: "/api/training-categories",
    categoryManagementUrl: "/categorie-allenamenti",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: Dumbbell, colorClass: "icon-gold-bg", description: "Sessioni di allenamento libero" }
  },
  {
    id: "affitti",
    labelUI: "Affitti",
    order: 6,
    family: "affitto",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/affitti",
    apiEndpoint: "/api/rental-categories",
    categoryManagementUrl: "/categorie-affitti",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: Building2, colorClass: "icon-gold-bg", description: "Prenotazione Sale / Affitto Generico" }
  },
  {
    id: "campus",
    labelUI: "Campus",
    order: 7,
    family: "evento",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/campus",
    apiEndpoint: "/api/campus-categories",
    categoryManagementUrl: "/categorie-campus",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: Users, colorClass: "icon-gold-bg", description: "Campus e programmi intensivi" }
  },
  {
    id: "saggi",
    labelUI: "Saggi",
    order: 8,
    family: "evento",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/saggi",
    apiEndpoint: "/api/recital-categories",
    categoryManagementUrl: "/categorie-saggi",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: Award, colorClass: "icon-gold-bg", description: "Saggi e spettacoli" }
  },
  {
    id: "vacanze-studio",
    labelUI: "Vacanze Studio",
    order: 9,
    family: "evento",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/vacanze-studio",
    apiEndpoint: "/api/vacation-categories",
    categoryManagementUrl: "/categorie-vacanze-studio",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: Music, colorClass: "icon-gold-bg", description: "Vacanze studio e viaggi formativi" }
  },
  {
    id: "servizi",
    labelUI: "Eventi Esterni",
    order: 13,
    family: "evento",
    isActive: true,
    isPlaceholder: false,
    routeUrl: "/attivita/servizi",
    apiEndpoint: "/api/booking-service-categories",
    categoryManagementUrl: "/categorie-eventi-esterni",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: true },
    design: { icon: Globe, colorClass: "icon-gold-bg", description: "Eventi extra non a listino e contabilità" }
  },
  {
    id: "merchandising",
    labelUI: "Merchandising",
    order: 14,
    family: "prodotto",
    isActive: true,
    isPlaceholder: true,
    routeUrl: "/attivita/merchandising",
    apiEndpoint: "/api/merchandising-categories",
    categoryManagementUrl: "/categorie-merchandising",
    visibility: { sidebarMenu: true, hubAttivita: true, iscrittiPanel: true, categoriePanel: true, mascheraInput: true, listini: true, calendario: false },
    design: { icon: ShoppingBag, colorClass: "icon-gold-bg", description: "Vendita prodotti e abbigliamento" }
  }
];

// HELPER FUNCTIONS 
export const getActiveActivities = () => ACTIVITY_REGISTRY.filter(a => a.isActive).sort((a, b) => a.order - b.order);
export const getActivityById = (id: string) => ACTIVITY_REGISTRY.find(a => a.id === id);
