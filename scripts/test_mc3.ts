import { db } from "../server/db";
import { externalPayers, societies, payments, paymentParticipants, members } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

async function runTest() {
  console.log("Testing MC3 pagamenti relazionali logic...");
  
  // 1. Get a random member
  const mems: any[] = await db.execute(sql`SELECT id FROM members LIMIT 1`);
  if (!mems || mems[0]?.length === 0) {
    console.log("No members found. Cannot test.");
    return;
  }
  const memberId = mems[0][0].id;
  const child1Id = memberId;
  const child2Id = memberId; // simuliamo 2 figlie usando lo stesso id
  
  // Scenario 1: Madre paga 2 corsi per 2 figlie
  console.log("--- Scenario 1: Madre paga 2 corsi ---");
  const { v4: uuidv4 } = await import("uuid");
  const paymentGroupId = uuidv4();
  
  const [pay1] = await db.insert(payments).values({
    amount: "200.00",
    type: 'multi',
    status: 'paid',
    paidDate: new Date(),
    payerId: memberId,
    payerType: 'member',
    billingSubjectId: memberId,
    billingSubjectType: 'member',
    documentType: 'ricevuta_istituzionale',
    paymentGroupId,
    balanceAmount: "200.00"
  });
  
  await db.insert(paymentParticipants).values({
    paymentId: pay1.insertId,
    memberId: child1Id,
    activityType: 'corso',
    amountAttributed: "100.00",
    tenantId: '1'
  });
  
  await db.insert(paymentParticipants).values({
    paymentId: pay1.insertId,
    memberId: child2Id,
    activityType: 'corso',
    amountAttributed: "100.00",
    tenantId: '1'
  });
  console.log(`Creato pagamento multiplo (id: ${pay1.insertId}) per member_id=${memberId}`);
  
  // Scenario 2: Scuola danza
  console.log("--- Scenario 2: Scuola danza (Society) ---");
  const [soc] = await db.insert(societies).values({
    businessName: 'Scuola Danza ABC',
    tenantId: '1'
  });
  const [pay2] = await db.insert(payments).values({
    amount: "500.00",
    type: 'multi',
    status: 'paid',
    paidDate: new Date(),
    payerId: soc.insertId,
    payerType: 'society',
    billingSubjectId: soc.insertId,
    billingSubjectType: 'society',
    documentType: 'fattura',
    balanceAmount: "500.00"
  });
  console.log(`Creato pagamento Society (id: ${pay2.insertId}) intestato a society_id=${soc.insertId}`);
  
  // Scenario 3: Comune (ExternalPayer)
  console.log("--- Scenario 3: Comune (ExternalPayer) ---");
  const [ext] = await db.insert(externalPayers).values({
    businessName: 'Comune di Verona',
    tenantId: '1'
  });
  const [pay3] = await db.insert(payments).values({
    amount: "300.00",
    type: 'multi',
    status: 'paid',
    paidDate: new Date(),
    payerId: ext.insertId,
    payerType: 'external',
    billingSubjectId: ext.insertId,
    billingSubjectType: 'external',
    documentType: 'fattura',
    balanceAmount: "300.00"
  });
  console.log(`Creato pagamento External (id: ${pay3.insertId}) intestato a external_id=${ext.insertId}`);
  
  // Scenario 4: Gift card
  console.log("--- Scenario 4: Gift card ---");
  const [pay4] = await db.insert(payments).values({
    amount: "150.00",
    type: 'multi',
    status: 'paid',
    paidDate: new Date(),
    payerId: memberId,
    payerType: 'member',
    billingSubjectId: memberId,
    billingSubjectType: 'member',
    documentType: 'ricevuta_istituzionale',
    giftCardAmount: "50.00",
    balanceAmount: "100.00"
  });
  console.log(`Creato pagamento GiftCard (id: ${pay4.insertId}) total: 150, balance: 100, gift: 50`);
  
  console.log("Tutti i test completati con successo.");
  process.exit(0);
}

runTest().catch(console.error);
