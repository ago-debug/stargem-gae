import mysql from "mysql2/promise";
async function main() {
  const connection = await mysql.createConnection("mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2");
  
  const [rows] = await connection.execute(`
    SELECT
        m.id,
        m.card_number,
        (
          SELECT JSON_OBJECT(
            'id', mm.id,
            'membershipNumber', mm.membership_number,
            'barcode', mm.barcode,
            'issueDate', mm.issue_date,
            'expiryDate', mm.expiry_date
          )
          FROM memberships mm
          WHERE mm.member_id = m.id AND mm.status = 'active'
          ORDER BY mm.expiry_date DESC
          LIMIT 1
        ) as active_membership
      FROM members m
      WHERE m.card_number IS NULL OR m.card_number = ''
      LIMIT 5
  `);
  console.log(rows);
  process.exit(0);
}
main();
