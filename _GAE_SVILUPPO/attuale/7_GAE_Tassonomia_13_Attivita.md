# Tassonomia Ufficiale Attività (13 Livelli)
*Documentazione Architetturale - Stato dell'Arte post-Decisione CTO.*

La seguente gerarchia rappresenta la singola verità di dominio del progetto. Qualsiasi interfaccia o logica futura (filtri, modali, hub) deve rispettare **tassativamente questo ordine** e questa suddivisione logica.

## Le 13 Attività Ufficiali
1. **Corsi**
2. **Workshop**
3. **Prove a pagamento** *(Correlato a Corsi)*
4. **Prove gratuite** *(Correlato a Corsi)*
5. **Lezioni singole** *(Correlato a Corsi)*
6. **Lezioni individuali** *(Private autonome)*
7. **Domenica in movimento**
8. **Allenamenti** *(Dominio indipendente, sciolto da Sale/Affitti)*
9. **Affitti** *(Dominio indipendente, assorbe le pure logiche di spazio)*
10. **Campus**
11. **Saggi**
12. **Vacanze studio**
13. **Eventi esterni** *(Erede ricalibrato dei "Servizi extra")*

---

## Gap Analysis e Stato dei Nodi Incongruenti (As-Is)

Questa sezione analizza le discrepanze attuali tra il DB/Codice ereditato e la Nuova Tassonomia Sopra.

### 1. Allenamenti
- **Stato Attuale:** Esiste la rotta legacy `/attivita/allenamenti` (e i component/tabelle `Trainings`).
- **Problema:** Spesso confuso/ibridato a livello logico con la concezione di affitto di uno spazio autogestito.
- **Decisione:** **Dominio Corretto**. Viene santificato come entità a sé stante della sfera "didattica/pratica" (Attività fisica). 

### 2. Affitti
- **Stato Attuale:** Gestito ambiguamente tra `/studios`, `/prenotazioni-sale` (che punta al componente `StudioBookings` e tocca `studio_bookings`).
- **Problema:** Mischia la gestione logistica del patrimonio murario ("La Stanza X ha il pavimento in legno") con il concetto contrattuale dell'Affitto ("Ti cedo la sala per 2 ore").
- **Decisione:** **Dominio da Separare e Chiarire**. "Affitti" diventa il dominio di business erogabile numero 9. `/studios` rimarrà il registry del patrimonio.

### 3. Servizi Extra / Eventi Esterni
- **Stato Attuale:** Storicamente inquadrati come "Servizi" generici o assenti dal radar prioritario.
- **Problema:** Terminologia povera ("Servizi") che finiva per accavallarsi col concetto SaaS (es. quota associativa = servizio).
- **Decisione:** **Dominio Corretto (Rinominato)**. Battezzato ufficialmente come "Eventi esterni". Conterrà l'offerta non-in-sede o speciale.

### 4. Booking Services / Servizi Prenotabili
- **Stato Attuale:** Ha rotte (`/booking-services`, `/attivita/servizi`), ha componenti pesanti (`BookingServices.tsx`) e un castello DB annesso.
- **Problema:** È un "calderone" legacy senza vera entità di dominio didattico. 
- **Decisione:** **Silo Legacy da Riassorbire/Eliminare**. Non fa parte delle 13 essenze. Resterà parcheggiato (nascosto in UI ma vivo a codice) fino alla Fase C, quando il valore delle sue tabelle verrà travasato altrove o purgato. Non va toccato oggi.

### Le Viste: Calendario e Planning
- **Status Dogmatico:** Non sono sorgenti di verità. Sono interfacce di lettura. Non avranno tabelle o CRUD diretti sulla propria natura.

---

## Proposta di Riallineamento Prudente (Action Plan)

Per far aderire l'hub Attività alla nuova tassonomia senza rompere i DB Legacy.

### 1. Azioni Conservative Eseguibili Subito (Basso Rischio)
- Entrare nel componente `app-sidebar.tsx` e **ordinare/rinominare** le voci target all'interno del mega-menu "Attività" copiando **esattamente i 13 punti** in quest'ordine.
- Affettuare un'operazione simile (solo testuale/UI) in eventuali file di raggruppamento (es. l'indici /attivita, se statici).
- Sostituire la label "Servizi extra" in "Eventi esterni" dove visibile in UI.
- Sdoppiare in UI "Allenamenti" da "Affitti", puntando per ora "Affitti" verso la legacy di `prenotazioni-sale` (in attesa del DB).

### 2. Azioni da Rimandare a Task Dedicato (Medio/Alto Rischio)
- Accorpare fisicamente le logiche di "Prove a pagamento", "Prove gratuite" e "Lezioni singole" dentro i form del Dominio Genitore "Corsi" richiede manipolazioni dei `Data-Fetcher` React massivi.
- Creare la tabella/silo per "Eventi esterni" se non vi è l'entità chiara.

### 3. Azioni in "Freeze" (Non toccare ancora)
- La route e il file `BookingServices.tsx` (`/booking-services`). Anche se spariti semanticamente, estirparli ora fa schiantare il backoffice. 
- I database `studio_bookings` e tabelle connesse ibride.
