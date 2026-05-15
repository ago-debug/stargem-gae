# Recap modifica formula numero tessera

Stiamo lavorando sul file Google Sheets **“26_27_MASTER_ISCRIZIONI_e_PROVE”**, foglio **MASTER**.

Il problema riguarda la generazione del **numero tessera** nella colonna **CC**, in base alla **data pagamento tessera** in **BZ** e all’etichetta scelta nella colonna **CA**.

---

## Colonne coinvolte

| Colonna | Significato |
|---|---|
| **BZ** | Data emissione / pagamento tessera |
| **CA** | Tipo tessera |
| **CB** | Data scadenza quota tessera |
| **CC** | Numero tessera |

La colonna **CA** contiene un menu a tendina con queste opzioni:

- `Nuovo - Corrente`
- `Rinnovo - Corrente`
- `Nuovo - Successiva`
- `Rinnovo - Successiva`

---

## Logica precedente

La formula originale in **CC** funzionava già correttamente per:

- lasciare vuoto se **BZ** è vuota;
- lasciare vuoto se **C** è vuota;
- mostrare `⚠️ C.F. DOPPIO` se in **C** compare `⚠️`;
- mostrare `⛔ MANCA C.F.` se in **C** compare `⛔`;
- estrarre il numero ID dalla colonna **C**;
- formattarlo a 6 cifre;
- generare il prefisso stagione in formato `yy/yy`, per esempio `2526`.

---

## Modifica richiesta

La modifica richiesta riguarda solo la formula della colonna **CC**.

Quando in **CA** viene selezionato:

- `Nuovo - Corrente`
- `Rinnovo - Corrente`

allora in **CC** deve comparire il numero tessera con la **stagione corrente**.

### Esempio stagione corrente

| Campo | Valore |
|---|---|
| BZ | `11/05/2026` |
| CA | `Rinnovo - Corrente` |
| C | `ID-004570` |
| Risultato CC | `2526-004570` |

Quando invece in **CA** viene selezionato:

- `Nuovo - Successiva`
- `Rinnovo - Successiva`

allora in **CC** deve comparire il numero tessera con la **stagione successiva**.

### Esempio stagione successiva

| Campo | Valore |
|---|---|
| BZ | `11/05/2026` |
| CA | `Rinnovo - Successiva` |
| C | `ID-004570` |
| Risultato CC | `2627-004570` |

---

## Formula aggiornata per CC

Formula da inserire in **CC3** e trascinare giù:

```excel
=SE(
  BZ3="";
  "";
  SE(
    C3="";
    "";
    SE(
      REGEXMATCH(C3;"⚠️");
      "⚠️ C.F. DOPPIO";
      SE(
        REGEXMATCH(C3;"⛔");
        "⛔ MANCA C.F.";
        SE(
          O(CA3="Nuovo - Successiva"; CA3="Rinnovo - Successiva");
          TESTO(DATA(ANNO(BZ3)-SE(MESE(BZ3)<=8;1;0)+1;1;1);"yy")
          & TESTO(DATA(ANNO(BZ3)-SE(MESE(BZ3)<=8;1;0)+2;1;1);"yy");
          TESTO(DATA(ANNO(BZ3)-SE(MESE(BZ3)<=8;1;0);1;1);"yy")
          & TESTO(DATA(ANNO(BZ3)-SE(MESE(BZ3)<=8;1;0)+1;1;1);"yy")
        )
        & "-"
        & TESTO(VALORE(REGEXEXTRACT(C3;"\d+"));"000000")
      )
    )
  )
)
```

---

## Formula CB invariata

La formula in **CB** non è stata modificata.

Continua a calcolare la data di scadenza tessera così:

- `31/08` della stagione corrente per `Nuovo - Corrente` e `Rinnovo - Corrente`;
- `31/08` della stagione successiva per `Nuovo - Successiva` e `Rinnovo - Successiva`.

Formula attuale in **CB**:

```excel
=SE(
  O(BZ3=""; CA3="");
  "";
  SE(
    O(CA3="Nuovo - Corrente"; CA3="Rinnovo - Corrente");
    DATA(ANNO(BZ3)+SE(MESE(BZ3)>=9;1;0);8;31);
    SE(
      O(CA3="Nuovo - Successiva"; CA3="Rinnovo - Successiva");
      DATA(ANNO(BZ3)+SE(MESE(BZ3)>=9;2;1);8;31);
      ""
    )
  )
)
```

---

## Sintesi finale

- **CB** calcola la scadenza tessera.
- **CC** genera il numero tessera.
- La nuova logica in **CC** usa **CA** per decidere se anteporre la stagione corrente o quella successiva.
- Le etichette `Corrente` generano una tessera tipo `2526-xxxxxx`.
- Le etichette `Successiva` generano una tessera tipo `2627-xxxxxx`.
- Tutti i controlli già presenti su **C**, come C.F. doppio o C.F. mancante, sono stati mantenuti.
