import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const [rows] = await connection.query('DESCRIBE members');
  
  const keywords = ['tutor', 'guardian', 'consent', 'nation', 'region', 'marketing'];
  const filtered = (rows as any[]).filter(r => 
    keywords.some(k => r.Field.toLowerCase().includes(k))
  );
  
  console.log("Matched fields:", filtered);
  await connection.end();
}

run().catch(console.error);
