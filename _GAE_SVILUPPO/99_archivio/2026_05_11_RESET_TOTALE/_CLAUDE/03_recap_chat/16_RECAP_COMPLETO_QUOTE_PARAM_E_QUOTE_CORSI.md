# 16_RECAP_COMPLETO_QUOTE_PARAM_E_QUOTE_CORSI

## 16_A — Scopo del lavoro

Questa estrapolazione riassume tutta la progettazione fatta sulla trasformazione del foglio **QUOTE_CORSI** in un sistema più parametrico, leggibile, scalabile e compatibile con il **MASTER** attualmente usato dalla segreteria.

Il problema iniziale era questo:

- il foglio `QUOTE_CORSI` contiene oggi molte righe manuali;
- molte righe rappresentano lo stesso prodotto con quantità diverse, per esempio `1 CORSO Adulti`, `2 CORSI Adulti`, `3 CORSI Adulti`, fino a `6 CORSI Adulti`;
- è emersa la necessità di vendere anche 8, 9, 10, 15 corsi;
- non si vuole scrivere manualmente ogni prezzo su ogni riga;
- il foglio `MASTER` attuale legge la colonna `A` del foglio `QUOTE_CORSI` e prende il prezzo dalla colonna `C` o dalle colonne periodo;
- il foglio originale agganciato al MASTER è `QUOTE_CORSI`;
- la copia di test su cui si sta lavorando è `Copia di QUOTE_CORSI`.

Obiettivo finale:

> Rendere `QUOTE_PARAM` il foglio sorgente delle regole prezzo, e rendere `QUOTE_CORSI` una vista ordinata, quasi identica all’attuale listino, ma generata/controllata da parametri.

---

## 16_B — Decisione architetturale principale

Sono stati valutati due approcci.

### Approccio 1 — Non modificare il MASTER

In questo caso il MASTER continua a funzionare come oggi:

- in `Q` la segreteria seleziona una descrizione quota;
- in `R` seleziona il periodo;
- in `S` il foglio cerca la quota dentro `QUOTE_CORSI!A:A`;
- poi restituisce il prezzo dalla colonna corretta di `QUOTE_CORSI!C:AG`.

Questo approccio richiede che in `QUOTE_CORSI` esistano comunque righe del tipo:

- `1 CORSO ADULTI`
- `2 CORSI ADULTI`
- ...
- `15 CORSI ADULTI`

Vantaggi:

- non si tocca il MASTER;
- la segreteria continua a lavorare come prima;
- rischio basso.

Svantaggio:

- `QUOTE_CORSI` contiene ancora righe multiple, però generate e controllate da parametri.

### Approccio 2 — Aggiungere colonna quantità nel MASTER

È stato valutato anche di cambiare il MASTER aggiungendo una colonna `quantità`, così:

- `Q = CORSO ADULTI`;
- `quantità = 8`;
- il prezzo viene calcolato come pacchetto da 8.

Questa opzione è più corretta per il gestionale futuro, ma richiede modifiche alle formule del MASTER, comprese le formule degli sconti e delle promo.

Decisione operativa attuale:

> Per non perdere tempo e non rischiare di rompere il MASTER, nel test attuale NON si modifica il MASTER. Si mantiene la struttura attuale, ma si parametra il foglio `QUOTE_CORSI`.

---

## 16_C — Struttura finale desiderata

### Foglio 1 — `QUOTE_PARAM`

È il motore del listino. Contiene:

- codice tecnico;
- descrizione base;
- categoria;
- giorni;
- età;
- fascia oraria;
- quota base;
- periodo;
- sconti;
- quantità massima;
- prezzo minimo;
- note;
- scalino medio;
- tipo calcolo.

### Foglio 2 — `Copia di QUOTE_CORSI`

È il foglio di test. Deve essere impaginato come il vero `QUOTE_CORSI`, cioè nello stesso ordine del listino attuale.

### Foglio 3 — `QUOTE_CORSI`

È il foglio originale agganciato al `MASTER`. Non va modificato subito. Si copierà la struttura definitiva solo quando la copia sarà verificata.

---

## 16_D — Colonne di `QUOTE_PARAM`

| Colonna | Campo | Uso |
|---|---|---|
| `A` | `codice` | Codice tecnico univoco della quota |
| `B` | `descrizione_base` | Nome che comparirà nella descrizione quota |
| `C` | `categoria` | Categoria commerciale/didattica |
| `D` | `giorni` | Giorni validi per la quota |
| `E` | `eta` | Fascia età |
| `F` | `fascia_oraria` | Fascia oraria |
| `G` | `quota_base` | Prezzo base o prezzo fisso |
| `H` | `periodo` | Periodo di validità |
| `I` | `sconto_stesso_gruppo` | Sconto informativo/futuro |
| `J` | `sconto_gruppo_diverso` | Sconto informativo/futuro |
| `K` | `qta_max` | Quantità massima generabile |
| `L` | `prezzo_min_aggiuntivo` | Prezzo minimo medio |
| `M` | `note` | Note operative |
| `N` | `scalino_medio` | Riduzione progressiva del prezzo medio |
| `O` | `tipo_calcolo` | Tipo formula da usare |

---

## 16_E — Spiegazione dettagliata delle colonne

### `codice`

Codice tecnico univoco. Esempi:

- `OPEN_DANZA`
- `AD_BDF`
- `AD_AERIAL`
- `BAMBINI_BDF`
- `RAGAZZI_AERIAL`
- `TESSERA`

Regole:

- niente spazi;
- meglio tutto maiuscolo;
- usare underscore `_`;
- deve essere identico al codice che si scrive nella colonna tecnica `AJ` di `QUOTE_CORSI`.

### `descrizione_base`

È il nome leggibile della quota. Esempi:

- `ADULTI`
- `ADULTI AERIAL`
- `OPEN DANZA`
- `OPEN FITNESS`
- `BAMBINI dai 6 ai 12 anni`
- `QUOTA TESSERA`

Nota importante: per i corsi progressivi, non scrivere il numero nella descrizione base. La formula costruirà automaticamente `1 CORSO ADULTI`, `2 CORSI ADULTI`, ecc.

### `categoria`

Serve a classificare la voce. Esempi:

- `OPEN`
- `DANZA, BALLO, FITNESS`
- `AERIAL`
- `BAMBINI`
- `RAGAZZI`
- `MIX`
- `PROVA`
- `TESSERA`
- `STAFF`

### `giorni`

Indica i giorni in cui vale la quota. Esempi:

- `TUTTI`
- `DAL LUNEDÌ AL GIOVEDÌ`
- `DAL LUN AL VEN`
- `DAL LUN AL SAB`
- `VENERDÌ`
- `SABATO`
- `VEN+SAB`

### `eta`

Indica a chi si applica la quota. Esempi:

- `ADULTI`
- `DAI 3 AI 5`
- `DAI 6 AI 12`
- `DAI 13 AI 17`
- `FINO A 17 ANNI`
- `STAFF`
- `INSEGNANTI`

### `fascia_oraria`

Indica il vincolo orario. Esempi:

- `DALLE 09 ALLE 21.30`
- `FINO ALLE 11`
- `FINO ALLE 14`
- `DALLE 17.30 ALLE 19.30`
- `DALLE 18.30 ALLE 21.30`
- `DALLE 15.00 ALLE 17.00`

### `quota_base`

È il prezzo principale.

Se `tipo_calcolo = FISSO`, `quota_base` è il prezzo finale. Esempi:

- `OPEN_DANZA = 1300`
- `LEZIONE_PROVA = 25`
- `TESSERA = 25`

Se `tipo_calcolo = PROGRESSIVO_MEDIO`, `quota_base` è il prezzo del primo corso. Esempi:

- `AD_BDF = 395`
- `AD_AERIAL = 580`

Non scrivere il simbolo euro. Scrivere solo numeri.

### `periodo`

Descrive la validità. Esempi:

- `Settembre-giugno`
- `Settembre-luglio`
- `Settembre-maggio`
- `Annuale`
- `1 mese`
- `Quadrimestre`

### `sconto_stesso_gruppo`

Colonna informativa per la logica commerciale futura. Esempio: `15%`. Può indicare lo sconto applicato a un corso aggiuntivo dello stesso gruppo. Nel sistema di test attuale non è ancora usata direttamente dalla formula principale.

### `sconto_gruppo_diverso`

Colonna informativa per logiche future. Esempio: `10%`. Può indicare lo sconto applicato quando si combinano gruppi diversi, per esempio Aerial + BDF. Nel sistema di test attuale non è ancora usata direttamente dalla formula principale.

### `qta_max`

Numero massimo di righe da generare.

| Codice | qta_max | Significato |
|---|---:|---|
| `AD_BDF` | `15` | genera da 1 a 15 corsi adulti |
| `AD_AERIAL` | `3` | genera da 1 a 3 corsi aerial |
| `OPEN_DANZA` | `1` | una riga sola |
| `TESSERA` | `1` | una riga sola |

### `prezzo_min_aggiuntivo`

Serve per le quote progressive. Indica il prezzo medio minimo sotto cui il sistema non deve scendere.

Esempio adulti:

- quota base: `395`;
- scalino medio: `30`;
- prezzo minimo: `245`.

Risultato:

| Quantità | Prezzo medio |
|---:|---:|
| 1 | 395 |
| 2 | 365 |
| 3 | 335 |
| 4 | 305 |
| 5 | 275 |
| 6+ | 245 |

### `note`

Campo libero. Esempi:

- `SOLO 50 POSTI`
- `lancio fascia oraria`
- `lancio giorno`
- `secondo open più basso al 50%`
- `obbligatoria tessera + certificato medico`
- `2 corsi a scelta tra quelli sopra`

### `scalino_medio`

Riduzione del prezzo medio a ogni corso aggiuntivo.

Formula concettuale:

```text
prezzo_medio = MAX(prezzo_min_aggiuntivo; quota_base - ((quantità - 1) * scalino_medio))
quota_finale = quantità * prezzo_medio
```

### `tipo_calcolo`

È la colonna che decide come calcolare la quota.

| Tipo | Significato |
|---|---|
| `FISSO` | Il prezzo è quello scritto in quota_base |
| `PROGRESSIVO_MEDIO` | Il prezzo cambia in base alla quantità |
| `SCAGLIONI` | Prezzi diversi per quantità specifiche |
| `COMBINATO` | Prezzo derivato da combinazioni, per ora trattabile come fisso |

---

## 16_F — Tipi di calcolo

### `FISSO`

Usato quando la quota ha un prezzo unico.

Esempi:

- `OPEN_DANZA`
- `OPEN_FITNESS`
- `OPEN_COMPLETO`
- `OPEN_MATTINO_14`
- `PROVA_STANDARD`
- `LEZIONE_SINGOLA`
- `TESSERA`
- `STAFF_INSEGNANTI`

Compilazione tipica:

| Campo | Valore |
|---|---|
| `quota_base` | prezzo finale |
| `qta_max` | `1` |
| `prezzo_min_aggiuntivo` | vuoto oppure `0` |
| `scalino_medio` | `0` |
| `tipo_calcolo` | `FISSO` |

### `PROGRESSIVO_MEDIO`

Usato quando la quota cambia in base alla quantità.

Esempi:

- `AD_BDF`
- `AD_AERIAL`
- `AD_BDF_VS`

Compilazione tipica:

| Campo | Valore |
|---|---|
| `quota_base` | prezzo del primo corso |
| `qta_max` | massimo corsi |
| `prezzo_min_aggiuntivo` | prezzo medio minimo |
| `scalino_medio` | riduzione media |
| `tipo_calcolo` | `PROGRESSIVO_MEDIO` |

### `SCAGLIONI`

Usato quando i prezzi non seguono una formula lineare ma scaglioni decisi.

Esempio bambini:

- `BAMBINI_BDF` 1 corso = 370;
- 2 corsi a scelta = 690;
- 3 corsi a scelta = 990.

Soluzione veloce: creare righe separate come `FISSO`.

### `COMBINATO`

Usato quando il prezzo deriva da più componenti. Esempi:

- `OPEN_COMPLETO = OPEN DANZA + OPEN FITNESS`;
- `MIX_1AERIAL_1BDF`;
- `MIX_2AERIAL_1BDF`;
- `MIX_2BDF_1AERIAL`.

Nel test attuale conviene trattarlo come `FISSO` e scrivere nelle note la logica commerciale.

---

## 16_G — Colonne tecniche in `Copia di QUOTE_CORSI`

Sono state aggiunte colonne tecniche da `AJ` in poi, perché `AH` e `AI` erano già usate nel foglio.

| Colonna | Nome | Uso |
|---|---|---|
| `AJ` | `codice_param` | codice da cercare in `QUOTE_PARAM` |
| `AK` | `qta_param` | quantità della riga |
| `AL` | `base_param` | quota base letta da `QUOTE_PARAM` |
| `AM` | `scalino_param` | scalino medio letto da `QUOTE_PARAM` |
| `AN` | `minimo_param` | minimo letto da `QUOTE_PARAM` |
| `AO` | `tipo_calcolo` | tipo calcolo letto da `QUOTE_PARAM` |

Regola: si compila manualmente solo `AJ` e, quando serve, `AK`. Le altre colonne tecniche si popolano da formula.

---

## 16_H — Formule tecniche

### Formula `AK` per quantità progressiva

Da usare quando si genera un blocco progressivo, per esempio adulti da riga 22:

```gs
=SE($AJ22=""; ""; CONTA.SE($AJ$22:AJ22; $AJ22))
```

Per blocchi che partono da un’altra riga, il range deve partire da quella riga.

Esempio Aerial da riga 38:

```gs
=SE($AJ38=""; ""; CONTA.SE($AJ$38:AJ38; $AJ38))
```

### Formula `AL`

```gs
=SE.ERRORE(INDICE(QUOTE_PARAM!$G:$G; CONFRONTA($AJ22; QUOTE_PARAM!$A:$A; 0)); "")
```

### Formula `AM`

```gs
=SE.ERRORE(INDICE(QUOTE_PARAM!$N:$N; CONFRONTA($AJ22; QUOTE_PARAM!$A:$A; 0)); "")
```

### Formula `AN`

```gs
=SE.ERRORE(INDICE(QUOTE_PARAM!$L:$L; CONFRONTA($AJ22; QUOTE_PARAM!$A:$A; 0)); "")
```

### Formula `AO`

```gs
=SE.ERRORE(INDICE(QUOTE_PARAM!$O:$O; CONFRONTA($AJ22; QUOTE_PARAM!$A:$A; 0)); "")
```

---

## 16_I — Formule principali per `QUOTE_CORSI`

### Colonna `A` — descrizione quota

Esempio da `A4`:

```gs
=SE($AJ4=""; "";
  SE($AO4="FISSO";
    "1 " & INDICE(QUOTE_PARAM!$B:$B; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0));
    $AK4 & " " & SE($AK4=1; "CORSO"; "CORSI") & " " & INDICE(QUOTE_PARAM!$B:$B; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0))
  )
)
```

### Colonna `B` — dettaglio

```gs
=SE($AJ4=""; "";
  SE($AO4="FISSO";
    INDICE(QUOTE_PARAM!$H:$H; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0)) & " - " &
    INDICE(QUOTE_PARAM!$C:$C; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0)) & " - " &
    INDICE(QUOTE_PARAM!$M:$M; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0));
    SE($AO4="PROGRESSIVO_MEDIO";
      SE($AK4=1;
        INDICE(QUOTE_PARAM!$H:$H; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0)) & " - " &
        INDICE(QUOTE_PARAM!$C:$C; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0)) & " - " &
        INDICE(QUOTE_PARAM!$D:$D; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0)) & " - " &
        INDICE(QUOTE_PARAM!$F:$F; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0));
        $AL4 & " x " & $AK4 & " = " & ($AL4*$AK4) & " - " & $D4 & "€ di riduzione (" & ARROTONDA($C4/$AK4; 2) & " a corso)"
      );
      ""
    )
  )
)
```

### Colonna `C` — quota finale

```gs
=SE($AJ4=""; "";
  SE($AO4="FISSO";
    $AL4;
    SE($AO4="PROGRESSIVO_MEDIO";
      ARROTONDA($AK4 * MAX($AN4; $AL4 - (($AK4-1) * $AM4)); 2);
      ""
    )
  )
)
```

### Colonna `D` — sconto

```gs
=SE($AJ4=""; "";
  SE($AO4="FISSO";
    "";
    SE($AO4="PROGRESSIVO_MEDIO";
      SE($AK4=1; ""; ARROTONDA(($AK4*$AL4)-$C4; 2));
      ""
    )
  )
)
```

---

## 16_L — Layout finale richiesto in `Copia di QUOTE_CORSI`

| Riga | Contenuto |
|---:|---|
| `3` | intestazione OPEN |
| `4:17` | righe OPEN / staff / Leonardo / open 1 mese |
| `21` | intestazione CORSI ADULTI |
| `22:36` | adulti standard da 1 a 15 |
| `37` | intestazione AEREAL |
| `38:41` | Aerial adulti e quadrimestre |
| `43:46` | mix Aerial + BDF |
| `50` | intestazione CORSI BAMBINI E RAGAZZI |
| `51:59` | bambini/ragazzi |
| `61:62` | note 2/3 corsi a scelta |
| `65:68` | prove, singole, tessera |

---

## 16_M — Mappa codici da mettere in `Copia di QUOTE_CORSI`

### OPEN — da riga 4

| Riga | AJ | AK |
|---:|---|---:|
| 4 | `OPEN_DANZA` | 1 |
| 5 | `OPEN_FITNESS` | 1 |
| 6 | `OPEN_COMPLETO` | 1 |
| 7 | `OPEN_MATTINO_14` | 1 |
| 8 | `OPEN_MATTINO_11` | 1 |
| 9 | `OPEN_VENERDI` | 1 |
| 10 | `OPEN_SABATO` | 1 |
| 11 | `OPEN_WE` | 1 |
| 12 | `OPEN_BAMBINI_RAGAZZI` | 1 |
| 13 | `STAFF_INSEGNANTI` | 1 |
| 14 | `OPEN_LEONARDO_1` | 1 |
| 15 | `OPEN_LEONARDO_2` | 1 |
| 16 | `OPEN_1_MESE` | 1 |
| 17 | `OPEN_2_MESE` | 1 |

### ADULTI — da riga 22

| Righe | AJ | AK |
|---:|---|---|
| 22:36 | `AD_BDF` | da 1 a 15 |

Formula in `AK22`:

```gs
=SE($AJ22=""; ""; CONTA.SE($AJ$22:AJ22; $AJ22))
```

### AERIAL — da riga 38

| Riga | AJ | AK |
|---:|---|---:|
| 38 | `AD_AERIAL` | 1 |
| 39 | `AD_AERIAL` | 2 |
| 40 | `AD_AERIAL` | 3 |
| 41 | `AD_QUADRIMESTRE` | 1 |

### MIX — da riga 43

| Riga | AJ | AK |
|---:|---|---:|
| 43 | `MIX_1AERIAL_1BDF` | 1 |
| 44 | `MIX_2AERIAL_1BDF` | 1 |
| 45 | `MIX_2BDF_1AERIAL` | 1 |
| 46 | `MIX_2BDF_2AERIAL` | 1 |

### BAMBINI/RAGAZZI — da riga 51

| Riga | AJ | AK |
|---:|---|---:|
| 51 | `BAMBINI_LANCIO_ORARIO` | 1 |
| 52 | `BAMBINI_LANCIO_GIORNO` | 1 |
| 53 | `BAMBINI_BDF` | 1 |
| 54 | `BAMBINI_AERIAL` | 1 |
| 56 | `RAGAZZI_DBF` | 1 |
| 57 | `RAGAZZI_DBF_LANCIO_GIORNO` | 1 |
| 58 | `RAGAZZI_AERIAL_DANZA_LANCIO_ORARIO` | 1 |
| 59 | `RAGAZZI_AERIAL` | 1 |

### PROVE / SINGOLE / TESSERA — da riga 65

| Riga | AJ | AK |
|---:|---|---:|
| 65 | `PROVA_STANDARD` | 1 |
| 66 | `LEZIONE_SINGOLA` | 1 |
| 67 | `PROVA_AERIAL` | 1 |
| 68 | `TESSERA` | 1 |

---

## 16_N — Parametri proposti per `QUOTE_PARAM`

### OPEN

| codice | descrizione_base | categoria | giorni | eta | fascia_oraria | quota_base | periodo | qta_max | note | scalino_medio | tipo_calcolo |
|---|---|---|---|---|---|---:|---|---:|---|---:|---|
| `OPEN_DANZA` | `OPEN DANZA` | `OPEN` | `TUTTI` | `ADULTI` | `09-21.30` | 1300 | `Settembre-luglio` | 1 | `SOLO 50 POSTI` | 0 | `FISSO` |
| `OPEN_FITNESS` | `OPEN FITNESS` | `OPEN` | `TUTTI` | `ADULTI` | `09-21.30` | 950 | `Settembre-luglio` | 1 | `SOLO 50 POSTI` | 0 | `FISSO` |
| `OPEN_COMPLETO` | `OPEN DANZA + FITNESS` | `OPEN` | `TUTTI` | `ADULTI` | `09-21.30` | 1775 | `Settembre-luglio` | 1 | `1300 + 475, secondo open più basso al 50%` | 0 | `FISSO` |
| `OPEN_MATTINO_14` | `OPEN MATTINO ore 14` | `OPEN` | `TUTTI` | `ADULTI` | `FINO ALLE 14.00` | 590 | `Settembre-giugno` | 1 | `SOLO 90 POSTI` | 0 | `FISSO` |
| `OPEN_MATTINO_11` | `OPEN MATTINO ore 11` | `OPEN` | `TUTTI` | `ADULTI` | `FINO ALLE 11.00` | 320 | `Settembre-giugno` | 1 | `SOLO 50 POSTI` | 0 | `FISSO` |
| `OPEN_VENERDI` | `OPEN VENERDI` | `OPEN` | `VENERDI` | `ADULTI` | `09-21.30` | 490 | `Settembre-giugno` | 1 | `SOLO 50 POSTI` | 0 | `FISSO` |
| `OPEN_SABATO` | `OPEN SABATO` | `OPEN` | `SABATO` | `ADULTI` | `09-21.30` | 490 | `Settembre-giugno` | 1 | `SOLO 50 POSTI` | 0 | `FISSO` |
| `OPEN_WE` | `OPEN WE - VENERDI + SABATO` | `OPEN` | `VEN+SAB` | `ADULTI` | `09-21.30` | 690 | `Settembre-giugno` | 1 | `weekend venerdì + sabato` | 0 | `FISSO` |
| `OPEN_BAMBINI_RAGAZZI` | `OPEN BAMBINI E RAGAZZI` | `OPEN` | `TUTTI` | `FINO A 17 ANNI` | `ORARI RAGAZZI` | 750 | `Settembre-maggio` | 1 | `SOLO 50 POSTI` | 0 | `FISSO` |

### STAFF / LEONARDO

| codice | descrizione_base | categoria | quota_base | periodo | note | tipo_calcolo |
|---|---|---|---:|---|---|---|
| `STAFF_INSEGNANTI` | `CORSO per INSEGNANTI` | `STAFF` | 150 | `Settembre-luglio` | `obbligatoria tessera + certificato medico` | `FISSO` |
| `OPEN_LEONARDO_1` | `OPEN LEONARDO V. 1 MESE` | `STAFF` | 50 | `1 mese` | `no open ballo` | `FISSO` |
| `OPEN_LEONARDO_2` | `2 OPEN LEONARDO V. 1 MESE` | `STAFF` | 100 | `1 mese` | `no open ballo` | `FISSO` |
| `OPEN_1_MESE` | `OPEN 1 MESE` | `STAFF` | 150 | `1 mese` | `no open ballo` | `FISSO` |
| `OPEN_2_MESE` | `2 OPEN 1 MESE` | `STAFF` | 350 | `1 mese` | `no open ballo` | `FISSO` |

### ADULTI

| codice | descrizione_base | quota_base | prezzo_min_aggiuntivo | scalino_medio | qta_max | tipo_calcolo |
|---|---|---:|---:|---:|---:|---|
| `AD_BDF` | `ADULTI` | 395 | 245 | 30 | 15 | `PROGRESSIVO_MEDIO` |
| `AD_BDF_VS` | `ADULTI VENERDI O SABATO` | 320 | 245 | 45 | 2 | `PROGRESSIVO_MEDIO` |
| `AD_AERIAL` | `ADULTI AERIAL` | 580 | 450 | 100 | 3 | `PROGRESSIVO_MEDIO` |
| `AD_MATTINO` | `ADULTI MATTINO` | 295 | 245 | 0 | 1 | `FISSO` |
| `AD_QUADRIMESTRE` | `ADULTI Quadrimestre` | 295 | 0 | 0 | 1 | `FISSO` |

### MIX AERIAL + BDF

| codice | descrizione_base | categoria | quota_base | periodo | note | tipo_calcolo |
|---|---|---|---:|---|---|---|
| `MIX_1AERIAL_1BDF` | `Adulti 1 Aerial + 1 BDF` | `MIX` | 880 | `Settembre-giugno` | `580 + 395 - 95€ riduzione` | `FISSO` |
| `MIX_2AERIAL_1BDF` | `Adulti 2 Aerial + 1 BDF` | `MIX` | 1260 | `Settembre-giugno` | `960 + 395 - 95€ riduzione` | `FISSO` |
| `MIX_2BDF_1AERIAL` | `Adulti 2 BDF + 1 Aerial` | `MIX` | 1220 | `Settembre-giugno` | `690 + 580 - 50€ riduzione` | `FISSO` |
| `MIX_2BDF_2AERIAL` | `Adulti 2 BDF + 2 Aerial` | `MIX` | 1560 | `Settembre-giugno` | `690 + 960 - 90€ riduzione` | `FISSO` |

### BAMBINI / RAGAZZI

| codice | descrizione_base | categoria | giorni | eta | fascia_oraria | quota_base | periodo | note | tipo_calcolo |
|---|---|---|---|---|---|---:|---|---|---|
| `BAMBINI_LANCIO_ORARIO` | `Bambini dai 3 ai 5 anni LANCIO ORARIO` | `DANZA, BALLO` | `DAL LUN AL VEN` | `DAI 3 AI 5` | `16.30-17.30` | 295 | `Settembre-maggio` | `lancio fascia oraria` | `FISSO` |
| `BAMBINI_LANCIO_GIORNO` | `Bambini dai 6 ai 12 anni LANCIO DEL GIORNO` | `DANZA, BALLO` | `VENERDI/SABATO` | `DAI 6 AI 12` | `17.30-19.30` | 320 | `Settembre-maggio` | `lancio giorni` | `FISSO` |
| `BAMBINI_BDF` | `Bambini dai 6 ai 12 anni` | `DANZA, BALLO` | `DAL LUN AL GIO` | `DAI 6 AI 12` | `17.30-19.30` | 370 | `Settembre-maggio` | `standard bambini` | `FISSO` |
| `BAMBINI_AERIAL` | `Bambini dai 6 ai 12 anni AERIAL` | `AERIAL` | `DAL LUN AL VEN` | `DAI 6 AI 12` | `17.30-19.30` | 395 | `Settembre-maggio` | `aerial bambini` | `FISSO` |
| `RAGAZZI_DBF` | `RAGAZZI dai 13 ai 17 anni DBF` | `DANZA, BALLO, FITNESS` | `DAL LUN AL GIO` | `DAI 13 AI 17` | `18.30-21.30` | 370 | `Settembre-maggio` | `ragazzi standard` | `FISSO` |
| `RAGAZZI_DBF_LANCIO_GIORNO` | `RAGAZZI dai 13 ai 17 anni DBF - LANCIO DEL GIORNO` | `DANZA, BALLO, FITNESS` | `VEN E SAB` | `DAI 13 AI 17` | `09.00-21.30` | 320 | `Settembre-maggio` | `lancio giorni` | `FISSO` |
| `RAGAZZI_AERIAL_DANZA_LANCIO_ORARIO` | `RAGAZZI dai 13 ai 17 anni AERIAL e DANZA - LANCIO ORARIO` | `AERIAL, DANZA` | `DAL LUN AL VEN` | `DAI 13 AI 17` | `15.00-17.00` | 345 | `Settembre-maggio` | `lancio fascia oraria` | `FISSO` |
| `RAGAZZI_AERIAL` | `RAGAZZI dai 13 ai 17 anni AERIAL` | `AERIAL` | `DAL LUN AL VEN` | `DAI 13 AI 17` | `18.30-21.30` | 395 | `Settembre-maggio` | `aerial ragazzi` | `FISSO` |

### PROVE / SINGOLE / TESSERA

| codice | descrizione_base | quota_base | periodo | note | tipo_calcolo |
|---|---|---:|---|---|---|
| `PROVA_STANDARD` | `LEZIONE Prova` | 25 | `Settembre-giugno` | `lezione prova standard` | `FISSO` |
| `LEZIONE_SINGOLA` | `LEZIONE Singola` | 25 | `Settembre-giugno` | `lezione singola` | `FISSO` |
| `PROVA_AERIAL` | `LEZIONE Prova POLE O CERCHIO` | 30 | `Settembre-giugno` | `prova pole/cerchio` | `FISSO` |
| `TESSERA` | `QUOTA TESSERA` | 25 | `Annuale` | `tesseramento annuale` | `FISSO` |

---

## 16_O — Problemi incontrati e soluzioni

### Errore `#NAME?`

È comparso quando si è provato a usare funzioni come `MAP`, `LAMBDA`, `SEQUENZA`.

Soluzione adottata:

- abbandonare temporaneamente `MAP`;
- usare formule semplici riga per riga;
- introdurre parametrico con colonne tecniche `AJ:AO`.

### Errore `#REF!`

È comparso quando alcune formule dipendevano da `AO` o da range copiati male.

Soluzione:

- cancellare `AJ22:AO40`;
- ricostruire da zero;
- non usare più `AO` come riga parametro;
- usare direttamente `CONFRONTA($AJ22; QUOTE_PARAM!$A:$A; 0)` nelle formule.

### Problema descrizione doppia

Quando in `QUOTE_PARAM!B2` era scritto `CORSO ADULTI`, la formula generava `1 CORSO CORSO ADULTI`.

Soluzione:

- in `QUOTE_PARAM!B2` scrivere solo `ADULTI`;
- la parola `CORSO` viene aggiunta dalla formula in `QUOTE_CORSI`.

---

## 16_P — Test da fare

| Test | Azione | Risultato atteso |
|---|---|---|
| OPEN | cambiare `OPEN_DANZA` da 1300 a 1350 | cambia riga open |
| ADULTI | cambiare `AD_BDF` da 395 a 400 | cambiano righe 22:36 |
| AERIAL | cambiare `AD_AERIAL` da 580 a 600 | cambiano righe 38:40 |
| BAMBINI | cambiare `BAMBINI_BDF` da 370 a 380 | cambia riga 53 |

---

## 16_Q — Relazione con il gestionale futuro

Il foglio parametrico non serve solo per GSheet. È anche una bozza logica del futuro gestionale.

Nel gestionale, la struttura dovrebbe diventare:

- `price_lists`;
- `price_rules`;
- `price_rule_tiers`;
- `cart_items`;
- `payments`;
- `quotes`.

Concetto:

- `QUOTE_PARAM` corrisponde alle regole prezzo;
- `QUOTE_CORSI` corrisponde alla vista listino;
- `MASTER` corrisponde al checkout/segreteria.

Regola architetturale:

> Il prezzo base deve venire da una riga ufficiale del listino, non da un importo scritto a mano al momento del pagamento.

---

## 16_R — Stato finale della chat

Funziona:

- parametrico adulti standard;
- lettura da `QUOTE_PARAM`;
- colonne tecniche `AJ:AO`;
- formula `FISSO`;
- formula `PROGRESSIVO_MEDIO`;
- test con cambio prezzo base;
- impostazione per rendere parametrica anche la sezione OPEN.

Da completare:

- inserire tutte le righe in `QUOTE_PARAM`;
- impaginare `Copia di QUOTE_CORSI` come vero `QUOTE_CORSI`;
- verificare le descrizioni esatte della colonna `A`;
- verificare tutti i prezzi in colonna `C`;
- decidere se bambini/ragazzi 2 e 3 corsi vanno come righe fisse o come `SCAGLIONI`;
- decidere se i mix restano `FISSO` o diventano `COMBINATO`;
- solo dopo, replicare tutto sul foglio originale `QUOTE_CORSI`.

---

## 16_S — Regola finale da non dimenticare

Il foglio originale agganciato al MASTER è:

```text
QUOTE_CORSI
```

Il foglio di test è:

```text
Copia di QUOTE_CORSI
```

Prima si completa e si valida `Copia di QUOTE_CORSI`. Solo dopo si trasferisce la struttura sul vero `QUOTE_CORSI`.
