# 18_SCHEMA_OPERATIVO_QUOTE_PARAM_PRONTO_USO

## 18_A — Checklist di lavoro

1. Lavorare solo su `Copia di QUOTE_CORSI`.
2. Non modificare il vero `QUOTE_CORSI` finché il test non è completo.
3. Creare/compilare `QUOTE_PARAM`.
4. Usare colonne tecniche `AJ:AO` nella copia.
5. Validare colonna `A`, `B`, `C`, `D`.
6. Fare test di cambio prezzo in `QUOTE_PARAM`.
7. Solo dopo copiare la struttura nel vero `QUOTE_CORSI`.

---

## 18_B — Campi `QUOTE_PARAM`

| Campo | Obbligatorio | Quando |
|---|---|---|
| `codice` | sì | sempre |
| `descrizione_base` | sì | sempre |
| `categoria` | sì | consigliato sempre |
| `giorni` | no | se utile nel dettaglio |
| `eta` | no | se utile nel dettaglio |
| `fascia_oraria` | no | se utile nel dettaglio |
| `quota_base` | sì | sempre |
| `periodo` | sì | sempre |
| `sconto_stesso_gruppo` | no | uso informativo |
| `sconto_gruppo_diverso` | no | uso informativo |
| `qta_max` | sì | sempre |
| `prezzo_min_aggiuntivo` | sì per progressivi | solo `PROGRESSIVO_MEDIO` |
| `note` | no | consigliato |
| `scalino_medio` | sì | `0` se fisso |
| `tipo_calcolo` | sì | sempre |

---

## 18_C — Compilazione per `FISSO`

| Campo | Valore |
|---|---|
| `quota_base` | prezzo finale |
| `qta_max` | 1 |
| `prezzo_min_aggiuntivo` | vuoto o 0 |
| `scalino_medio` | 0 |
| `tipo_calcolo` | FISSO |

---

## 18_D — Compilazione per `PROGRESSIVO_MEDIO`

| Campo | Valore |
|---|---|
| `quota_base` | prezzo 1 corso |
| `qta_max` | quantità massima |
| `prezzo_min_aggiuntivo` | prezzo medio minimo |
| `scalino_medio` | riduzione progressiva |
| `tipo_calcolo` | PROGRESSIVO_MEDIO |

---

## 18_E — Formula concettuale progressiva

```text
prezzo_medio = MAX(prezzo_min_aggiuntivo; quota_base - ((quantità - 1) * scalino_medio))
quota_finale = quantità * prezzo_medio
sconto = quantità * quota_base - quota_finale
```

---

## 18_F — Esempio adulti

| Quantità | Prezzo medio | Totale | Sconto |
|---:|---:|---:|---:|
| 1 | 395 | 395 | 0 |
| 2 | 365 | 730 | 60 |
| 3 | 335 | 1005 | 180 |
| 4 | 305 | 1220 | 360 |
| 5 | 275 | 1375 | 600 |
| 6 | 245 | 1470 | 900 |
| 7 | 245 | 1715 | 1050 |
| 8 | 245 | 1960 | 1200 |
| 9 | 245 | 2205 | 1350 |
| 10 | 245 | 2450 | 1500 |
| 15 | 245 | 3675 | 2250 |

---

## 18_G — Esempio Aerial

Parametri:

| Parametro | Valore |
|---|---:|
| quota_base | 580 |
| scalino_medio | 100 |
| prezzo_min_aggiuntivo | 450 |
| qta_max | 3 |

Risultato:

| Quantità | Prezzo medio | Totale |
|---:|---:|---:|
| 1 | 580 | 580 |
| 2 | 480 | 960 |
| 3 | 450 | 1350 |

---

## 18_H — Mappa righe rapida

| Sezione | Righe |
|---|---:|
| OPEN | 4:17 |
| ADULTI | 22:36 |
| AERIAL | 38:41 |
| MIX | 43:46 |
| BAMBINI/RAGAZZI | 51:59 |
| PROVE/TESSERA | 65:68 |

---

## 18_I — Test finali

| Test | Azione | Risultato atteso |
|---|---|---|
| OPEN | cambiare `OPEN_DANZA` da 1300 a 1350 | cambia riga 4 |
| ADULTI | cambiare `AD_BDF` da 395 a 400 | cambiano righe 22:36 |
| AERIAL | cambiare `AD_AERIAL` da 580 a 600 | cambiano righe 38:40 |
| BAMBINI | cambiare `BAMBINI_BDF` da 370 a 380 | cambia riga 53 |
| TESSERA | cambiare `TESSERA` da 25 a 30 | cambia riga 68 |

---

## 18_L — Decisioni ancora aperte

### A. Bambini/ragazzi 2 e 3 corsi

1. Creare righe fisse separate.
2. Usare tabella `SCAGLIONI`.
3. Usare formula progressiva dedicata.

Scelta rapida consigliata: 1.

### B. Mix Aerial + BDF

1. Trattarli come righe `FISSO`.
2. Creare un vero calcolo `COMBINATO`.
3. Gestirli con promo/sconti.

Scelta rapida consigliata: 1.

### C. MASTER con quantità

1. Non toccarlo adesso.
2. Aggiungere colonna quantità in futuro.
3. Rifare completamente il checkout nel gestionale.

Scelta rapida consigliata: 1 adesso, 3 nel gestionale futuro.
