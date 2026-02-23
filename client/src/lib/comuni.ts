
interface Comune {
    nome: string;
    codice: string;
    zona: { codice: string; nome: string };
    regione: { codice: string; nome: string };
    provincia: { codice: string; nome: string };
    sigla: string;
    codiceCatastale: string;
    cap: string[];
    popolazione: number;
}

let cachedComuni: Comune[] | null = null;
let fetchPromise: Promise<Comune[]> | null = null;
const COMUNI_URL = "https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json";

export async function getComuni(): Promise<Comune[]> {
    if (cachedComuni) return cachedComuni;

    if (!fetchPromise) {
        fetchPromise = fetch(COMUNI_URL)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch comuni");
                return res.json();
            })
            .then(data => {
                cachedComuni = data;
                return data;
            })
            .catch(err => {
                console.error("Error fetching comuni:", err);
                return [];
            });
    }

    return fetchPromise;
}

export function findComune(query: string, list: Comune[]): Comune | undefined {
    if (!query || !list) return undefined;
    // Exact match first (case insensitive)
    return list.find(c => c.nome.toLowerCase() === query.toLowerCase());
}

export function searchComuni(query: string, list: Comune[]): Comune[] {
    if (!query || query.length < 2 || !list) return [];
    const lower = query.toLowerCase();
    // Starts with
    return list
        .filter(c => c.nome.toLowerCase().startsWith(lower))
        .slice(0, 10); // Limit results
}
