import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    uri: 'mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2'
  });

  await connection.beginTransaction();

  try {
    // Step 2: Operations
    await connection.query(`DROP TABLE IF EXISTS universal_enrollments`);
    const [updateRes] = await connection.query(`UPDATE courses SET activity_type = 'course' WHERE activity_type = 'corso'`);
    console.log("UPDATE result:", updateRes.affectedRows, "rows modified");
    
    await connection.query(`ALTER TABLE enrollments ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP`);
    console.log("ALTER completed");

    // Step 3: Verification PRE-COMMIT
    const [c1] = await connection.query(`SELECT COUNT(*) as c FROM courses WHERE activity_type='corso'`);
    const [c2] = await connection.query(`SELECT COUNT(*) as c FROM courses WHERE activity_type='course'`);
    const [c3] = await connection.query(`SHOW COLUMNS FROM enrollments LIKE 'updated_at'`);
    const [c4] = await connection.query(`SHOW TABLES LIKE 'universal_enrollments'`);

    console.log("PRE-COMMIT Checks:");
    console.log("Courses with 'corso':", c1[0].c, "(Expected: 0)");
    console.log("Courses with 'course':", c2[0].c, "(Expected: 333)");
    console.log("updated_at column exists:", c3.length > 0, "(Expected: true)");
    console.log("universal_enrollments exists:", c4.length > 0, "(Expected: false)");

    let pass = true;
    if (c1[0].c !== 0) pass = false;
    if (c2[0].c !== 333) pass = false;
    if (c3.length === 0) pass = false;
    if (c4.length !== 0) pass = false;

    if (pass) {
      await connection.commit();
      console.log("COMMIT SUCCESSFUL");
    } else {
      await connection.rollback();
      console.log("ROLLBACK EXECUTED due to verification failure");
    }
  } catch(e) {
    await connection.rollback();
    console.log("ROLLBACK EXECUTED due to error:", e.message);
  } finally {
    await connection.end();
  }
}
run().catch(console.error);
