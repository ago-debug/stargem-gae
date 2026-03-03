import { db } from "../server/db";
import { courseQuotesGrid } from "../shared/schema";

async function run() {
  try {
    await db.insert(courseQuotesGrid).values({
      activityType: "workshop",
      category: "NUOVO_TEST",
      description: "",
      details: "",
      corsiWeek: 1,
      monthsData: { "Settembre": { quota: 99, lezioni: null } },
      sortOrder: 1
    });
    console.log("Success");
  } catch (err) {
    console.error("DB Error:", err);
  }
}
run().then(() => process.exit(0));
