import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'gaetano_admin',
    password: 'StarGem2026!Secure',
    database: 'stargem_v2',
  });

  console.log("=== 1. Membri agganciati a corsi ma non in INSEGNANTE ===");
  const [q1] = await connection.execute(`
    SELECT m.id, m.first_name, m.last_name,
           m.participant_type, COUNT(c.id) as corsi_assegnati
      FROM members m
      INNER JOIN courses c
        ON c.instructor_id = m.id
           OR c.secondary_instructor1_id = m.id
      WHERE (m.participant_type != 'INSEGNANTE'
             OR m.participant_type IS NULL)
      GROUP BY m.id, m.first_name, m.last_name,
               m.participant_type
      ORDER BY corsi_assegnati DESC;
  `);
  console.table(q1);

  console.log("\n=== 2. GemStaff vs Instructors ===");
  const [q2] = await connection.execute(`
    SELECT
      (SELECT COUNT(*) FROM members
       WHERE participant_type = 'INSEGNANTE') as gemstaff_count,
      (SELECT COUNT(*) FROM members
       WHERE participant_type LIKE '%INSEGNANTE%'
          OR participant_type LIKE '%Staff%'
          OR id IN (SELECT DISTINCT instructor_id
                    FROM courses WHERE instructor_id IS NOT NULL)
          OR id IN (SELECT DISTINCT secondary_instructor1_id
                    FROM courses
                    WHERE secondary_instructor1_id IS NOT NULL)
      ) as instructors_totali;
  `);
  console.table(q2);

  console.log("\n=== 3. Caso Gaetano Ambrosio ===");
  const [q3] = await connection.execute(`
    SELECT id, first_name, last_name,
           participant_type, email
      FROM members
      WHERE first_name LIKE '%GAETANO%'
         OR last_name LIKE '%AMBROSIO%';
  `);
  console.table(q3);

  await connection.end();
}

run().catch(console.error);
