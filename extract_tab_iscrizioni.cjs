const fs = require('fs');
const fileContent = fs.readFileSync('client/src/pages/maschera-input-generale.tsx', 'utf8');

const startIdx = fileContent.indexOf('{/* ATTIVITÀ */}');
if (startIdx === -1) {
    console.error("Could not find start of Attivita");
    process.exit(1);
}

const endIdx = fileContent.indexOf('{/* Duplicate Fiscal Codes Modal */}', startIdx);
if (endIdx === -1) {
    console.error("Could not find end of Attivita");
    process.exit(1);
}

const componentCode = fileContent.substring(startIdx, endIdx);

const newComponentCode = `import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, CreditCard, Gift, Sun, Dumbbell, UserCheck, Users, Award, Music, Building2, Globe, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { KnowledgeInfo } from "@/components/knowledge-info";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrollmentDetailBadge } from "@/components/multi-select-enrollment-details";

export function TabIscrizioni(props: any) {
  const {
    selectedMemberId,
    SectionBadge,
    renderGenericEnrollmentList,
    memberEnrollments,
    loadingEnrollments,
    courses,
    enrollmentDetails,
    removeEnrollmentMutation,
    memberPtEnrollments, paidTrials, removePtEnrollmentMutation,
    memberFtEnrollments, freeTrials, removeFtEnrollmentMutation,
    memberSlEnrollments, singleLessons, removeSlEnrollmentMutation,
    memberWorkshopEnrollments, workshops, removeWorkshopEnrollmentMutation,
    memberSaEnrollments, sundayActivities, removeSaEnrollmentMutation,
    memberTrEnrollments, trainings, removeTrEnrollmentMutation,
    memberIlEnrollments, individualLessons, removeIlEnrollmentMutation,
    memberCaEnrollments, campusActivities, removeCaEnrollmentMutation,
    memberReEnrollments, recitals, removeReEnrollmentMutation,
    memberVsEnrollments, vacationStudies, removeVsEnrollmentMutation,
    memberServEnrollments, bookingServices, removeServEnrollmentMutation,
    dummyMutation
  } = props;

  return (
    ${componentCode.trim()}
  );
}
`;

fs.writeFileSync('client/src/components/crm/TabIscrizioni.tsx', newComponentCode);

// Now remove the old code and insert the usage
let newFileContent = fileContent.substring(0, startIdx) + 
`        <TabIscrizioni
          selectedMemberId={selectedMemberId}
          SectionBadge={SectionBadge}
          renderGenericEnrollmentList={renderGenericEnrollmentList}
          memberEnrollments={memberEnrollments}
          loadingEnrollments={loadingEnrollments}
          courses={courses}
          enrollmentDetails={enrollmentDetails}
          removeEnrollmentMutation={removeEnrollmentMutation}
          memberPtEnrollments={memberPtEnrollments} paidTrials={paidTrials} removePtEnrollmentMutation={removePtEnrollmentMutation}
          memberFtEnrollments={memberFtEnrollments} freeTrials={freeTrials} removeFtEnrollmentMutation={removeFtEnrollmentMutation}
          memberSlEnrollments={memberSlEnrollments} singleLessons={singleLessons} removeSlEnrollmentMutation={removeSlEnrollmentMutation}
          memberWorkshopEnrollments={memberWorkshopEnrollments} workshops={workshops} removeWorkshopEnrollmentMutation={removeWorkshopEnrollmentMutation}
          memberSaEnrollments={memberSaEnrollments} sundayActivities={sundayActivities} removeSaEnrollmentMutation={removeSaEnrollmentMutation}
          memberTrEnrollments={memberTrEnrollments} trainings={trainings} removeTrEnrollmentMutation={removeTrEnrollmentMutation}
          memberIlEnrollments={memberIlEnrollments} individualLessons={individualLessons} removeIlEnrollmentMutation={removeIlEnrollmentMutation}
          memberCaEnrollments={memberCaEnrollments} campusActivities={campusActivities} removeCaEnrollmentMutation={removeCaEnrollmentMutation}
          memberReEnrollments={memberReEnrollments} recitals={recitals} removeReEnrollmentMutation={removeReEnrollmentMutation}
          memberVsEnrollments={memberVsEnrollments} vacationStudies={vacationStudies} removeVsEnrollmentMutation={removeVsEnrollmentMutation}
          memberServEnrollments={memberServEnrollments} bookingServices={bookingServices} removeServEnrollmentMutation={removeServEnrollmentMutation}
          dummyMutation={dummyMutation}
        />\n\n        ` + fileContent.substring(endIdx);

// Add import
if (!newFileContent.includes('import { TabIscrizioni }')) {
    newFileContent = newFileContent.replace('import { TabAnagrafica } from "@/components/crm/TabAnagrafica";', 'import { TabAnagrafica } from "@/components/crm/TabAnagrafica";\nimport { TabIscrizioni } from "@/components/crm/TabIscrizioni";');
}

fs.writeFileSync('client/src/pages/maschera-input-generale.tsx', newFileContent);
console.log("TabIscrizioni extracted.");
