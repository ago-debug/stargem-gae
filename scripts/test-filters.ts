import { storage } from "../server/storage";

async function run() {
  const allenamenti = await storage.getEnrollmentsBySeason(1, "allenamenti");
  console.log("allenamenti:", allenamenti.length);

  const prenotazioni = await storage.getEnrollmentsBySeason(1, "prenotazioni");
  console.log("prenotazioni:", prenotazioni.length);
  
  process.exit(0);
}
run();
