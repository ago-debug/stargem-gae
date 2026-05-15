# 17_PROMPT_HANDOFF_PER_NUOVA_CHAT_ANALISI_QUOTE_PARAM

## 17_A — Prompt pronto da incollare in una nuova chat

Sto lavorando su un sistema GSheet per Studio GEM / StarGem. Ho un foglio originale chiamato `QUOTE_CORSI`, agganciato al `MASTER` usato dalla segreteria per vendere quote/corsi.

Il `MASTER` oggi funziona così:

- nella colonna `Q` si seleziona una o più quote;
- nella colonna `R` si seleziona il periodo;
- nella colonna `S` il sistema cerca la quota in `QUOTE_CORSI!A:A`;
- poi prende il prezzo dalla colonna periodo, in particolare dalla colonna `C` o dall’intervallo `C:AG`;
- la colonna `C` di `QUOTE_CORSI` è quindi fondamentale.

Sto lavorando su un foglio di test chiamato `Copia di QUOTE_CORSI`. Il foglio originale da non rompere è `QUOTE_CORSI`.

Obiettivo:

> Trasformare il listino in un sistema parametrico, mantenendo la compatibilità con il MASTER.

---

## 17_B — Decisione presa

Non voglio modificare subito il MASTER. Voglio invece:

1. creare un foglio `QUOTE_PARAM`;
2. inserire lì tutte le regole prezzo;
3. usare `Copia di QUOTE_CORSI` come vista/output ordinato;
4. mantenere in `Copia di QUOTE_CORSI` la stessa impaginazione del vero `QUOTE_CORSI`;
5. quando tutto funziona, replicare sul vero `QUOTE_CORSI`.

---

## 17_C — Struttura `QUOTE_PARAM`

Le colonne di `QUOTE_PARAM` sono:

```text
codice
descrizione_base
categoria
giorni
eta
fascia_oraria
quota_base
periodo
sconto_stesso_gruppo
sconto_gruppo_diverso
qta_max
prezzo_min_aggiuntivo
note
scalino_medio
tipo_calcolo
```

Significato sintetico:

| Campo | Significato |
|---|---|
| `codice` | codice tecnico univoco |
| `descrizione_base` | nome quota da mostrare |
| `categoria` | area commerciale/didattica |
| `giorni` | giorni validi |
| `eta` | fascia età |
| `fascia_oraria` | vincolo orario |
| `quota_base` | prezzo fisso o prezzo primo corso |
| `periodo` | validità |
| `sconto_stesso_gruppo` | informazione commerciale futura |
| `sconto_gruppo_diverso` | informazione commerciale futura |
| `qta_max` | quantità massima |
| `prezzo_min_aggiuntivo` | prezzo medio minimo |
| `note` | note operative |
| `scalino_medio` | riduzione del prezzo medio |
| `tipo_calcolo` | `FISSO`, `PROGRESSIVO_MEDIO`, `SCAGLIONI`, `COMBINATO` |

---

## 17_D — Tipi calcolo

### `FISSO`

Il prezzo finale è `quota_base`. Esempi: OPEN, Staff, Leonardo, Prove, Lezioni singole, Tessera, Mix trattati temporaneamente come prezzo fisso.

### `PROGRESSIVO_MEDIO`

Il prezzo dipende dalla quantità.

Formula:

```text
prezzo_medio = MAX(prezzo_min_aggiuntivo; quota_base - ((quantità - 1) * scalino_medio))
quota_finale = quantità * prezzo_medio
```

Esempio adulti:

- quota base = 395;
- scalino medio = 30;
- prezzo minimo medio = 245;
- qta max = 15.

### `SCAGLIONI`

Prezzi stabiliti per quantità specifiche. Esempio bambini:

- 1 corso = 370;
- 2 corsi = 690;
- 3 corsi = 990.

Per ora posso gestire questi casi come righe `FISSO`.

### `COMBINATO`

Prezzo derivato da combinazione di più prodotti. Esempi: open danza + fitness, mix aerial + BDF. Per ora posso trattarli come `FISSO`, scrivendo nelle note la logica.

---

## 17_E — Colonne tecniche in `Copia di QUOTE_CORSI`

Uso colonne a destra:

| Colonna | Campo |
|---|---|
| `AJ` | `codice_param` |
| `AK` | `qta_param` |
| `AL` | `base_param` |
| `AM` | `scalino_param` |
| `AN` | `minimo_param` |
| `AO` | `tipo_calcolo` |

Compilo manualmente `AJ` e `AK`, oppure uso una formula per la quantità progressiva. Le altre colonne leggono da `QUOTE_PARAM`.

---

## 17_F — Formule tecniche

### `AK` per blocchi progressivi

Esempio adulti da riga 22:

```gs
=SE($AJ22=""; ""; CONTA.SE($AJ$22:AJ22; $AJ22))
```

Esempio aerial da riga 38:

```gs
=SE($AJ38=""; ""; CONTA.SE($AJ$38:AJ38; $AJ38))
```

### `AL`

```gs
=SE.ERRORE(INDICE(QUOTE_PARAM!$G:$G; CONFRONTA($AJ22; QUOTE_PARAM!$A:$A; 0)); "")
```

### `AM`

```gs
=SE.ERRORE(INDICE(QUOTE_PARAM!$N:$N; CONFRONTA($AJ22; QUOTE_PARAM!$A:$A; 0)); "")
```

### `AN`

```gs
=SE.ERRORE(INDICE(QUOTE_PARAM!$L:$L; CONFRONTA($AJ22; QUOTE_PARAM!$A:$A; 0)); "")
```

### `AO`

```gs
=SE.ERRORE(INDICE(QUOTE_PARAM!$O:$O; CONFRONTA($AJ22; QUOTE_PARAM!$A:$A; 0)); "")
```

---

## 17_G — Formule principali

### Colonna `A`

```gs
=SE($AJ4=""; "";
  SE($AO4="FISSO";
    "1 " & INDICE(QUOTE_PARAM!$B:$B; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0));
    $AK4 & " " & SE($AK4=1; "CORSO"; "CORSI") & " " & INDICE(QUOTE_PARAM!$B:$B; CONFRONTA($AJ4; QUOTE_PARAM!$A:$A; 0))
  )
)
```

### Colonna `B`

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

### Colonna `C`

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

### Colonna `D`

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

## 17_H — Layout desiderato di `Copia di QUOTE_CORSI`

| Riga | Sezione |
|---:|---|
| 3 | intestazione OPEN |
| 4:17 | OPEN, Staff, Leonardo, Open mensili |
| 21 | intestazione CORSI ADULTI |
| 22:36 | AD_BDF da 1 a 15 |
| 37 | intestazione AEREAL |
| 38:41 | Aerial adulti / quadrimestre |
| 43:46 | Mix Aerial + BDF |
| 50 | intestazione Bambini/Ragazzi |
| 51:59 | Bambini/Ragazzi |
| 61:62 | note 2/3 corsi a scelta |
| 65:68 | Prove, Singole, Tessera |

---

## 17_I — Codici da usare in `Copia di QUOTE_CORSI`

### OPEN

| Riga | AJ | AK |
|---:|---|---:|
| 4 | OPEN_DANZA | 1 |
| 5 | OPEN_FITNESS | 1 |
| 6 | OPEN_COMPLETO | 1 |
| 7 | OPEN_MATTINO_14 | 1 |
| 8 | OPEN_MATTINO_11 | 1 |
| 9 | OPEN_VENERDI | 1 |
| 10 | OPEN_SABATO | 1 |
| 11 | OPEN_WE | 1 |
| 12 | OPEN_BAMBINI_RAGAZZI | 1 |
| 13 | STAFF_INSEGNANTI | 1 |
| 14 | OPEN_LEONARDO_1 | 1 |
| 15 | OPEN_LEONARDO_2 | 1 |
| 16 | OPEN_1_MESE | 1 |
| 17 | OPEN_2_MESE | 1 |

### ADULTI

| Righe | AJ | AK |
|---:|---|---|
| 22:36 | AD_BDF | 1-15 |

### AERIAL

| Riga | AJ | AK |
|---:|---|---:|
| 38 | AD_AERIAL | 1 |
| 39 | AD_AERIAL | 2 |
| 40 | AD_AERIAL | 3 |
| 41 | AD_QUADRIMESTRE | 1 |

### MIX

| Riga | AJ | AK |
|---:|---|---:|
| 43 | MIX_1AERIAL_1BDF | 1 |
| 44 | MIX_2AERIAL_1BDF | 1 |
| 45 | MIX_2BDF_1AERIAL | 1 |
| 46 | MIX_2BDF_2AERIAL | 1 |

### BAMBINI/RAGAZZI

| Riga | AJ | AK |
|---:|---|---:|
| 51 | BAMBINI_LANCIO_ORARIO | 1 |
| 52 | BAMBINI_LANCIO_GIORNO | 1 |
| 53 | BAMBINI_BDF | 1 |
| 54 | BAMBINI_AERIAL | 1 |
| 56 | RAGAZZI_DBF | 1 |
| 57 | RAGAZZI_DBF_LANCIO_GIORNO | 1 |
| 58 | RAGAZZI_AERIAL_DANZA_LANCIO_ORARIO | 1 |
| 59 | RAGAZZI_AERIAL | 1 |

### PROVE/TESSERA

| Riga | AJ | AK |
|---:|---|---:|
| 65 | PROVA_STANDARD | 1 |
| 66 | LEZIONE_SINGOLA | 1 |
| 67 | PROVA_AERIAL | 1 |
| 68 | TESSERA | 1 |

---

## 17_L — Cosa chiedere nella nuova chat

Chiedi di:

1. verificare se questa architettura è coerente;
2. migliorare i `tipo_calcolo`;
3. proporre una gestione migliore per `SCAGLIONI`;
4. proporre una gestione migliore per `COMBINATO`;
5. verificare le formule GSheet;
6. preparare il passaggio futuro a database gestionale;
7. valutare se aggiungere una colonna quantità nel MASTER in una fase successiva;
8. valutare come generare automaticamente tutte le righe di `QUOTE_CORSI` partendo da `QUOTE_PARAM`.
