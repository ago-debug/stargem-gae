import { storage } from "./server/storage";

async function check() {
  const memberId = 1; // Based on image "Augusto Genca" might be ID 1
  const payments = await storage.getPaymentsByMemberId(memberId);
  console.log("PAYMENTS:", payments.map(p => ({ id: p.id, amount: p.amount, status: p.status, type: p.type, description: p.description })));
  const total = payments.filter(p => p.status === 'paid' || p.status === 'completed').reduce((s, p) => s + parseFloat(p.amount), 0);
  console.log("TOTAL PAID CALC:", total);
}

check().catch(console.error);
