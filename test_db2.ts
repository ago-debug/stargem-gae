import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [cols] = await conn.query("SHOW COLUMNS FROM payments");
    console.log(cols);
    
    // Add columns if they don't exist
    await conn.execute("ALTER TABLE payments ADD COLUMN payment_note_labels TEXT");
    console.log("Added payment_note_labels");
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('payment_note_labels already exists');
    } else {
      console.error(err);
    }
  }

  try {
    await conn.execute("ALTER TABLE payments ADD COLUMN enrollment_detail_labels TEXT");
    console.log("Added enrollment_detail_labels");
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('enrollment_detail_labels already exists');
    } else {
      console.error(err);
    }
  }
  await conn.end();
}
main();
