import { db } from './server/db';
import { members, courses, memberships, payments, medicalCertificates, enrollments, users } from './shared/schema';
import { count, eq, gt, lt, and, sql, desc, asc, sum } from 'drizzle-orm';

async function run() {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const nextMonth = new Date(currentYear, currentMonth + 1, 1);

  console.time('DB Stats');
  const [
    [{ totalMembers }],
    [{ activeCourses }],
    [{ totalEnrollments }],
    [{ activeMemberships }],
    [{ expiringMemberships }],
    [{ expiringCertificates }],
    [{ monthlyRevenue }],
    [{ pendingPayments }]
  ] = await Promise.all([
    db.select({ totalMembers: count() }).from(members),
    db.select({ activeCourses: count() }).from(courses).where(eq(courses.active, true)),
    db.select({ totalEnrollments: count() }).from(enrollments),
    db.select({ activeMemberships: count() }).from(memberships)
      .where(and(eq(memberships.status, 'active'), gt(memberships.expiryDate, today))),
    db.select({ expiringMemberships: count() }).from(memberships)
      .where(and(gt(memberships.expiryDate, today), lt(memberships.expiryDate, nextWeek))),
    db.select({ expiringCertificates: count() }).from(medicalCertificates)
      .where(and(gt(medicalCertificates.expiryDate, today), lt(medicalCertificates.expiryDate, nextWeek))),
    db.select({ monthlyRevenue: sum(payments.amount) }).from(payments)
      .where(and(
        eq(payments.status, 'paid'),
        gt(payments.createdAt, firstDayOfMonth),
        lt(payments.createdAt, nextMonth)
      )),
    db.select({ pendingPayments: count() }).from(payments).where(eq(payments.status, 'pending'))
  ]);

  console.log(totalMembers, monthlyRevenue, pendingPayments);
  console.timeEnd('DB Stats');
  process.exit(0);
}
run();
