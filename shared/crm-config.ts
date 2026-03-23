/**
 * Configurazione Scala Valori CRM
 * Architettura a Pesi scalare (Totale MAX 100 pt)
 * 
 * Modificare queste soglie nel tempo per aggiornare liberamente 
 * il modello di classificazione senza intervenire sulla logica backend.
 */

export const CRM_CONFIG = {
  WEIGHTS: {
    SPESA: 40,
    FREQUENZA: 25,
    ATTIVITA: 20,
    RECENCY: 15
  },
  
  LEVELS: {
    DIAMOND: { minScore: 85, label: "DIAMOND" },
    PLATINUM: { minScore: 65, label: "PLATINUM" },
    GOLD: { minScore: 40, label: "GOLD" },
    SILVER: { minScore: 0, label: "SILVER" }
  },

  SPESA_THRESHOLDS: [
    { minAmount: 1500, score: 40 },
    { minAmount: 1000, score: 30 },
    { minAmount: 500, score: 20 },
    { minAmount: 250, score: 10 },
    { minAmount: 1, score: 5 },
    { minAmount: 0, score: 0 }
  ],

  FREQUENZA_THRESHOLDS: [
    { minCount: 8, score: 25 },
    { minCount: 4, score: 15 },
    { minCount: 2, score: 10 },
    { minCount: 1, score: 5 },
    { minCount: 0, score: 0 }
  ],

  ATTIVITA_THRESHOLDS: [
    { minCount: 3, score: 20 },
    { minCount: 2, score: 15 },
    { minCount: 1, score: 8 },
    { minCount: 0, score: 0 }
  ],

  RECENCY_THRESHOLDS: [
    { maxMonths: 1, score: 15 },
    { maxMonths: 3, score: 10 },
    { maxMonths: 6, score: 5 },
    { maxMonths: Infinity, score: 0 }
  ]
};

export function getScoreFromThresholds(value: number, thresholds: Array<{minAmount?: number, minCount?: number, score: number}>): number {
  for (const t of thresholds) {
    if (t.minAmount !== undefined && value >= t.minAmount) return t.score;
    if (t.minCount !== undefined && value >= t.minCount) return t.score;
  }
  return 0; 
}

export function getRecencyScore(months: number, thresholds: Array<{maxMonths: number, score: number}>): number {
  for (const t of thresholds) {
    if (months <= t.maxMonths) return t.score;
  }
  return 0; 
}
