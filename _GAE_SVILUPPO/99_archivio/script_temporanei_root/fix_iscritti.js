import fs from 'fs';

let fileStr = fs.readFileSync('client/src/pages/iscritti_per_attivita.tsx', 'utf8');

// 1. Update API endpoints
fileStr = fileStr.replace(/queryKey: \["\/api\/workshops"\]/g, 'queryKey: ["/api/courses?activityType=workshop"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/workshop-enrollments"\]/g, 'queryKey: ["/api/enrollments?activityType=workshop"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/booking-services"\]/g, 'queryKey: ["/api/courses?activityType=servizi"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/booking-service-enrollments"\]/g, 'queryKey: ["/api/enrollments?activityType=servizi"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/paid-trials"\]/g, 'queryKey: ["/api/courses?activityType=prova_pagamento"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/paid-trial-enrollments"\]/g, 'queryKey: ["/api/enrollments?activityType=prova_pagamento"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/free-trials"\]/g, 'queryKey: ["/api/courses?activityType=prova_gratuita"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/free-trial-enrollments"\]/g, 'queryKey: ["/api/enrollments?activityType=prova_gratuita"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/single-lessons"\]/g, 'queryKey: ["/api/courses?activityType=lezione_singola"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/single-lesson-enrollments"\]/g, 'queryKey: ["/api/enrollments?activityType=lezione_singola"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/sunday-activities"\]/g, 'queryKey: ["/api/courses?activityType=domenica_movimento"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/sunday-activity-enrollments"\]/g, 'queryKey: ["/api/enrollments?activityType=domenica_movimento"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/courses\?activityType=prenotazioni"\]/g, 'queryKey: ["/api/courses?activityType=lezione_individuale"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/enrollments\?activityType=prenotazioni"\]/g, 'queryKey: ["/api/enrollments?activityType=lezione_individuale"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/campus-enrollments"\]/g, 'queryKey: ["/api/enrollments?activityType=campus"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/"\]/g, 'queryKey: ["/api/courses?activityType=saggio"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/recital-enrollments"\]/g, 'queryKey: ["/api/enrollments?activityType=saggio"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/vacation-studies"\]/g, 'queryKey: ["/api/courses?activityType=vacanza_studio"]');
fileStr = fileStr.replace(/queryKey: \["\/api\/vacation-study-enrollments"\]/g, 'queryKey: ["/api/enrollments?activityType=vacanza_studio"]');

// 2. Change foreign keys in extraActivitiesMap to "courseId" for everything
fileStr = fileStr.replace(/foreignKey: "serviceId"/g, 'foreignKey: "courseId"');
fileStr = fileStr.replace(/foreignKey: "paidTrialId"/g, 'foreignKey: "courseId"');
fileStr = fileStr.replace(/foreignKey: "freeTrialId"/g, 'foreignKey: "courseId"');
fileStr = fileStr.replace(/foreignKey: "singleLessonId"/g, 'foreignKey: "courseId"');
fileStr = fileStr.replace(/foreignKey: "sundayActivityId"/g, 'foreignKey: "courseId"');
fileStr = fileStr.replace(/foreignKey: "recitalId"/g, 'foreignKey: "courseId"');
fileStr = fileStr.replace(/foreignKey: "vacationStudyId"/g, 'foreignKey: "courseId"');
fileStr = fileStr.replace(/foreignKey: "merchandisingId"/g, 'foreignKey: "courseId"');

// 3. Update totalWsEnrollments logic
fileStr = fileStr.replace(/w\.id === e\.workshopId/g, 'w.id === e.courseId');

// 4. Update getEnrollmentsForActivity
fileStr = fileStr.replace(/e\.workshopId === activityId/g, 'e.courseId === activityId');

fs.writeFileSync('client/src/pages/iscritti_per_attivita.tsx', fileStr);
console.log('Replacements done!');
