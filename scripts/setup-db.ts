
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function checkConnection(config: any): Promise<boolean> {
  try {
    const conn = await mysql.createConnection(config);
    await conn.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function setup() {
  const credentials = [
    { user: 'root', password: '', host: 'localhost', port: 3306 },
    { user: 'root', password: 'password', host: 'localhost', port: 3306 },
    { user: 'root', password: 'root', host: 'localhost', port: 3306 }, // MAMP default
    { user: 'root', password: 'root', host: 'localhost', port: 8889 }, // MAMP default port
    { user: 'root', password: '', host: '127.0.0.1', port: 3306 },
  ];

  let workingConfig = null;

  console.log("Attempting to find a working MySQL connection...");

  for (const cred of credentials) {
    console.log(`Trying ${cred.user}@${cred.host}:${cred.port}...`);
    if (await checkConnection(cred)) {
      workingConfig = cred;
      console.log("Success!");
      break;
    }
  }

  if (!workingConfig) {
    console.error("Could not connect to MySQL with standard credentials.");
    console.error("Please ensure MySQL is running (e.g. via MAMP, XAMPP, or native install).");
    process.exit(1);
  }

  // Connect to create DB/User
  const adminConn = await mysql.createConnection(workingConfig);

  const targetDb = 'gestione_corsi';
  const targetUser = 'app_user';
  const targetPass = 'password_sicura';

  try {
    console.log(`Creating database ${targetDb} if not exists...`);
    await adminConn.query(`CREATE DATABASE IF NOT EXISTS ${targetDb}`);

    console.log(`Creating user ${targetUser}...`);
    // Create user if not exists. MySQL 5.7 vs 8.0 syntax differs slightly, but CREATE USER IF NOT EXISTS works in both (usually).
    // Safest is to try create and ignore error or check existence.
    try {
      await adminConn.query(`CREATE USER IF NOT EXISTS '${targetUser}'@'%' IDENTIFIED BY '${targetPass}'`);
    } catch (e: any) {
      console.log("User creation warning:", e.message);
      // User might exist, lets update password
      await adminConn.query(`ALTER USER '${targetUser}'@'%' IDENTIFIED BY '${targetPass}'`);
    }

    console.log(`Granting privileges...`);
    await adminConn.query(`GRANT ALL PRIVILEGES ON ${targetDb}.* TO '${targetUser}'@'%'`);
    await adminConn.query(`FLUSH PRIVILEGES`);

    // Update .env
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Construct new DATABASE_URL
    // encoding password if it has special chars? standard mysql url
    const newDbUrl = `mysql://${targetUser}:${targetPass}@localhost:${workingConfig.port}/${targetDb}`;

    // Simple regex replace for DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=${newDbUrl}`);
    } else {
      envContent += `\nDATABASE_URL=${newDbUrl}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("Updated .env with correct configuration.");

  } catch (err) {
    console.error("Error setting up database:", err);
    process.exit(1);
  } finally {
    await adminConn.end();
  }
}

setup();
