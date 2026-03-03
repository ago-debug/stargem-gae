import { db } from './server/db';
import { enrollments, members } from './shared/schema';
import { eq, desc } from 'drizzle-orm';

async function run() {
  try {
    const result = await db
      .select({
        id: enrollments.id,
        memberId: enrollments.memberId,
        courseId: enrollments.courseId,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        notes: enrollments.notes,
        details: enrollments.details,
        createdAt: enrollments.createdAt,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: members.email,
        memberFiscalCode: members.fiscalCode,
        memberGender: members.gender,
        seasonId: enrollments.seasonId,
      })
      .from(enrollments)
      .leftJoin(members, eq(enrollments.memberId, members.id))
      .orderBy(desc(enrollments.enrollmentDate));
      
    console.log("Success! Found:", result.length);
  } catch (error) {
    console.error("SQL Error:", error);
  }
  process.exit(0);
}
run();
