import { config } from "dotenv";
config();
import { db, pool } from "../server/db";
import { members, teamEmployees } from "../shared/schema";
import * as fs from "fs";

async function restore() {
  const data = JSON.parse(fs.readFileSync('./scratch/extracted_staff.json', 'utf8'));
  
  await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
  
  // Restore Team Employees
  if (data.teamEmployees.length > 0) {
    await db.delete(teamEmployees);
    
    for (const emp of data.teamEmployees) {
      try {
        if (emp.birthDate) emp.birthDate = new Date(emp.birthDate);
        if (emp.hireDate) emp.hireDate = new Date(emp.hireDate);
        if (emp.terminationDate) emp.terminationDate = new Date(emp.terminationDate);
        if (emp.createdAt) emp.createdAt = new Date(emp.createdAt);
        if (emp.updatedAt) emp.updatedAt = new Date(emp.updatedAt);
        await db.insert(teamEmployees).values(emp);
      } catch (e) {
        console.error('Error inserting team employee:', emp.id, e.message);
      }
    }
    console.log('Restored', data.teamEmployees.length, 'team employees');
  }

  // Restore Staff Members
  if (data.staffMembers.length > 0) {
    for (const member of data.staffMembers) {
      try {
        // Convert dates
        const dateFields = ['dateOfBirth', 'cardIssueDate', 'cardExpiryDate', 'entityCardIssueDate', 'entityCardExpiryDate', 'medicalCertificateExpiry', 'motherBirthDate', 'fatherBirthDate', 'insertionDate', 'tesserinoTecnicoIssueDate', 'cancellationDate', 'alboDataIscrizione', 'patenteScadenza', 'documentIssueDate', 'educationDate', 'firstEnrollmentDate', 'tutor1BirthDate', 'tutor2BirthDate', 'documentExpiry', 'privacyDate', 'residencePermitExpiry', 'createdAt', 'updatedAt', 'lezioniPrivateAutorizzateAt'];
        
        for (const df of dateFields) {
          if (member[df]) {
            member[df] = new Date(member[df]);
          }
        }

        // Clean complex objects
        delete member.attachmentMetadata;
        delete member.giftMetadata;
        delete member.tessereMetadata;
        delete member.certificatoMedicoMetadata;

        await db.insert(members).values(member);
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
