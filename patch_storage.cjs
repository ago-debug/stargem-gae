const fs = require('fs');
const path = require('path');

const storagePath = path.join(__dirname, 'server', 'storage.ts');
let content = fs.readFileSync(storagePath, 'utf8');

const tables = [
    { name: 'PaidTrial', table: 'paidTrialEnrollments', insertType: 'InsertPaidTrialEnrollment', type: 'PaidTrialEnrollment' },
    { name: 'FreeTrial', table: 'freeTrialEnrollments', insertType: 'InsertFreeTrialEnrollment', type: 'FreeTrialEnrollment' },
    { name: 'SingleLesson', table: 'singleLessonEnrollments', insertType: 'InsertSingleLessonEnrollment', type: 'SingleLessonEnrollment' },
    { name: 'SundayActivity', table: 'sundayActivityEnrollments', insertType: 'InsertSundayActivityEnrollment', type: 'SundayActivityEnrollment' },
    { name: 'Training', table: 'trainingEnrollments', insertType: 'InsertTrainingEnrollment', type: 'TrainingEnrollment' },
    { name: 'IndividualLesson', table: 'individualLessonEnrollments', insertType: 'InsertIndividualLessonEnrollment', type: 'IndividualLessonEnrollment' },
    { name: 'Campus', table: 'campusEnrollments', insertType: 'InsertCampusEnrollment', type: 'CampusEnrollment' },
    { name: 'Recital', table: 'recitalEnrollments', insertType: 'InsertRecitalEnrollment', type: 'RecitalEnrollment' },
    { name: 'VacationStudy', table: 'vacationStudyEnrollments', insertType: 'InsertVacationStudyEnrollment', type: 'VacationStudyEnrollment' },
];

let interfaceImports = [];
let interfaceMethods = '\n  // --- EXTRA ENROLLMENTS --- \n';
let classMethods = '\n  // --- EXTRA ENROLLMENTS IMPLEMENTATION --- \n';

tables.forEach(t => {
    interfaceImports.push(t.insertType, t.type, t.table);

    interfaceMethods += `
  get${t.name}Enrollments(): Promise<any[]>;
  get${t.name}EnrollmentsByMember(memberId: number): Promise<any[]>;
  get${t.name}Enrollment(id: number): Promise<${t.type} | undefined>;
  create${t.name}Enrollment(enrollment: ${t.insertType}): Promise<${t.type}>;
  update${t.name}Enrollment(id: number, enrollment: Partial<${t.insertType}>): Promise<${t.type}>;
  delete${t.name}Enrollment(id: number): Promise<void>;
`;

    classMethods += `
  async get${t.name}Enrollments(): Promise<any[]> {
    return await db.select({
      id: ${t.table}.id,
      memberId: ${t.table}.memberId,
      status: ${t.table}.status,
      enrollmentDate: ${t.table}.enrollmentDate,
      notes: ${t.table}.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
    .from(${t.table})
    .leftJoin(members, eq(${t.table}.memberId, members.id))
    .orderBy(desc(${t.table}.enrollmentDate));
  }

  async get${t.name}EnrollmentsByMember(memberId: number): Promise<any[]> {
    return await db.select({
      id: ${t.table}.id,
      memberId: ${t.table}.memberId,
      status: ${t.table}.status,
      enrollmentDate: ${t.table}.enrollmentDate,
      notes: ${t.table}.notes,
      memberFirstName: members.firstName,
      memberLastName: members.lastName,
      memberEmail: members.email,
      memberFiscalCode: members.fiscalCode
    })
    .from(${t.table})
    .leftJoin(members, eq(${t.table}.memberId, members.id))
    .where(eq(${t.table}.memberId, memberId))
    .orderBy(desc(${t.table}.enrollmentDate));
  }

  async get${t.name}Enrollment(id: number): Promise<${t.type} | undefined> {
    const [enrollment] = await db.select().from(${t.table}).where(eq(${t.table}.id, id));
    return enrollment;
  }

  async create${t.name}Enrollment(enrollment: ${t.insertType}): Promise<${t.type}> {
    const activeSeason = await this.getActiveSeason();
    const dataWithSeason = {
      ...enrollment,
      seasonId: enrollment.seasonId || activeSeason?.id || null
    };
    const [result] = await db.insert(${t.table}).values(dataWithSeason as any);
    const [newEnrollment] = await db.select().from(${t.table}).where(eq(${t.table}.id, result.insertId));
    return newEnrollment;
  }

  async update${t.name}Enrollment(id: number, enrollment: Partial<${t.insertType}>): Promise<${t.type}> {
    await db.update(${t.table}).set(enrollment as any).where(eq(${t.table}.id, id));
    const [updated] = await db.select().from(${t.table}).where(eq(${t.table}.id, id));
    return updated;
  }

  async delete${t.name}Enrollment(id: number): Promise<void> {
    await db.delete(${t.table}).where(eq(${t.table}.id, id));
  }
`;
});

// Update imports
content = content.replace(
    'import {',
    'import { ' + interfaceImports.join(', ') + ',\n  '
);

// Inject interface
content = content.replace(
    '  deleteWorkshopAttendance(id: number): Promise<void>;',
    '  deleteWorkshopAttendance(id: number): Promise<void>;\n' + interfaceMethods
);

// Inject class implementation
content = content.replace(
    '  // ==== Workshop Attendances ====',
    classMethods + '\n  // ==== Workshop Attendances ===='
);

fs.writeFileSync(storagePath, content);
console.log('Successfully patched storage.ts');
