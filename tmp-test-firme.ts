import { db } from "./server/db";
import { memberFormsSubmissions } from "./shared/schema";
async function test() {
  try {
    await db.insert(memberFormsSubmissions).values({
      memberId: 1,
      formType: "PRIVACY_ADULTI",
      formVersion: '2025-06-30',
      seasonId: 1,
      payloadData: null,
      signedAt: new Date(),
      createdBy: null
    });
    console.log("Success");
  } catch (e: any) {
    console.error("DB Error:", e);
  }
  process.exit();
}
test();
