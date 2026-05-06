import { config } from "dotenv";
config();
import { pool } from "../server/db";
import * as fs from "fs";

async function restore() {
  const data = JSON.parse(fs.readFileSync('./scratch/extracted_staff.json', 'utf8'));
  
  await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
  
  // Restore Team Employees
  if (data.teamEmployees.length > 0) {
    await pool.query('DELETE FROM team_employees');
    
    for (const emp of data.teamEmployees) {
      const keys = Object.keys(emp).filter(k => emp[k] !== undefined);
      const values = keys.map(k => emp[k]);
      
      const sql = `INSERT INTO team_employees (${keys.map(k => '\`' + k.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase()) + '\`').join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
      
      try {
        await pool.query(sql, values);
      } catch (e) {
        console.error('Error inserting team employee:', emp.id, e.message);
      }
    }
    console.log('Restored', data.teamEmployees.length, 'team employees');
  }

  // Restore Staff Members
  if (data.staffMembers.length > 0) {
    for (const member of data.staffMembers) {
      const keys = Object.keys(member).filter(k => member[k] !== undefined && typeof member[k] !== 'object');
      const values = keys.map(k => member[k]);
      
      const sql = `INSERT INTO members (${keys.map(k => '\`' + k.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase()) + '\`').join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
      
      try {
        await pool.query(sql, values);
      } catch (e) {
        console.error('Error inserting member:', member.id, e.message);
      }
    }
    console.log('Restored', data.staffMembers.length, 'staff members');
  }

  await pool.query('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('Done!');
  process.exit(0);
}

restore();
