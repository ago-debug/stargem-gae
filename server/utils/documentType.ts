import { type Member, type Society, type ExternalPayer } from "@shared/schema";

export function determineDocumentType(
  participant: Partial<Member>,
  payerType: 'member' | 'society' | 'external',
  payer: Partial<Member> | Partial<Society> | Partial<ExternalPayer>,
  activityType: 'corso' | 'tesseramento' | 'lezione_individuale' | 'workshop' | 'campus' | 'affitto' | 'merchandising' | 'altro'
): 'ricevuta_istituzionale' | 'fattura' | 'booking_only' {
  
  // Regole da classificazione_utenti_2026_05_13bis:

  // 1. Prova gratuita -> booking_only
  // Sebbene nel payload possa mancare l'informazione se è una "prova gratuita",
  // ci basiamo sul totale a 0 (che dovrebbe essere validato altrove) o su logiche future.
  // Assumiamo che venga gestito al momento della creazione, qui valutiamo le tre casistiche base.

  // 2. Affitto sala -> sempre fattura
  if (activityType === 'affitto') {
    return 'fattura';
  }

  // 3. Merchandising -> sempre fattura (anche tesserati, come deciso da Gaetano)
  if (activityType === 'merchandising') {
    return 'fattura';
  }

  // Se il pagante è esterno o una società (che non sia un welfare provider che paga con voucher), di default emettiamo fattura per la società
  // Questo dipende dalle direttive. Supponiamo che se paga un'azienda, vuole fattura.
  if (payerType === 'society' || payerType === 'external') {
    return 'fattura';
  }

  // 4. Non-tesserato -> fattura (Commerciale)
  // Controlliamo se il partecipante ha una membership. Se non la ha, è commerciale.
  // Questo richiederebbe di passare un flag "isTesserato" oppure controllare "cardNumber" se è l'unico modo per vederlo.
  // Assumiamo che se ha un cardNumber valido, sia tesserato (semplificazione).
  const isTesserato = participant.cardNumber && participant.cardNumber.trim() !== '';
  if (!isTesserato) {
    return 'fattura';
  }

  // 5. Tesserato + attività di sistema istituzionale -> ricevuta_istituzionale
  return 'ricevuta_istituzionale';
}
