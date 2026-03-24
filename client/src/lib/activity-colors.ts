import { GestioneFamily, getActivityById, getActiveActivities } from "@/config/activities";

/**
 * Standard Palette for Calendar Categories / Generic Sequential UI Iterations
 */
export const CATEGORY_COLORS_PALETTE = [
    "bg-emerald-100 border-emerald-500 text-emerald-900 shadow-md opacity-95 hover:opacity-100",
    "bg-purple-100 border-purple-500 text-purple-900 shadow-md opacity-95 hover:opacity-100",
    "bg-blue-100 border-blue-500 text-blue-900 shadow-md opacity-95 hover:opacity-100",
    "bg-rose-100 border-rose-500 text-rose-900 shadow-md opacity-95 hover:opacity-100",
    "bg-amber-100 border-amber-500 text-amber-900 shadow-md opacity-95 hover:opacity-100",
    "bg-indigo-100 border-indigo-500 text-indigo-900 shadow-md opacity-95 hover:opacity-100",
    "bg-teal-100 border-teal-500 text-teal-900 shadow-md opacity-95 hover:opacity-100",
    "bg-cyan-100 border-cyan-500 text-cyan-900 shadow-md opacity-95 hover:opacity-100",
    "bg-fuchsia-100 border-fuchsia-500 text-fuchsia-900 shadow-md opacity-95 hover:opacity-100",
];

export const OLD_CATEGORY_COLORS: Record<number, string> = {}; // Maintained for dynamic background assignment ref compatibility

/**
 * Common color classes mapping primarily mapped by `activity.id` / slug.
 * Used across the system (Planning, Calendar borders, Unified Events)
 */
export const ACTIVITY_TYPE_COLORS: Record<string, string> = {
    // Planning / Calendar Defaults
    "workshop": "bg-indigo-100 text-indigo-800 border-indigo-300",
    "saggi": "bg-rose-100 text-rose-800 border-rose-300",
    "vacanze-studio": "bg-orange-100 text-orange-800 border-orange-300 font-medium",
    "domeniche-movimento": "bg-amber-100 text-amber-800 border-amber-300",
    "campus": "bg-teal-100 text-teal-800 border-teal-300",
    "servizi": "bg-slate-200 text-slate-800 border-slate-300", // Eventi Esterni / Custom Ext.
    "corsi": "bg-emerald-100 text-emerald-800 border-emerald-300", // Corsi standard
    "prove-gratuite": "bg-blue-100 text-blue-800 border-blue-300",
    "prove-pagamento": "bg-cyan-100 text-cyan-800 border-cyan-300",
    "lezioni-individuali": "bg-purple-100 text-purple-800 border-purple-300",
    "lezioni-singole": "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
    "allenamenti": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "affitti": "bg-neutral-100 text-neutral-800 border-neutral-300",
    
    // Legacy Planning map back-compat
    "sunday": "bg-amber-100 text-amber-800 border-amber-300",
    "vacation": "bg-orange-100 text-orange-800 border-orange-300 font-medium",
    "recital": "bg-rose-100 text-rose-800 border-rose-300",
    "external": "bg-slate-200 text-slate-800 border-slate-300"
};

/**
 * Provides a canonical color class for any activity registry ID
 */
export const getEventColorClass = (activityId: string, fallbackClass: string = "bg-gray-100 text-gray-800 border-gray-300") => {
    if (ACTIVITY_TYPE_COLORS[activityId]) return ACTIVITY_TYPE_COLORS[activityId];
    return fallbackClass;
};
