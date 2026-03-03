import type { Member, Enrollment, Payment, Attendance } from "@shared/schema";

export function buildEnrolledMembersData(params: {
    activityId: number;
    isWorkshop: boolean;
    idField?: string;
    enrollments?: Enrollment[] | any[];
    membersData?: { members: Member[] } | Member[] | any;
    payments?: Payment[] | any[];
    attendances?: Attendance[] | any[];
}) {
    const { activityId, isWorkshop, enrollments, membersData, payments, attendances, idField: customIdField } = params;

    if (!enrollments) return [];

    // Extract the members array regardless of whether it's wrapped in an object or direct
    let membersArray: Member[] = [];
    if (membersData) {
        if (Array.isArray(membersData)) {
            membersArray = membersData;
        } else if (Array.isArray(membersData.members)) {
            membersArray = membersData.members;
        }
    }

    // Determine the correct ID field based on activity type
    const idField = customIdField || (isWorkshop ? 'workshopId' : 'courseId');
    const targetId = Number(activityId);

    // Filter enrollments for this specific activity and active status
    const activeEnrollments = enrollments.filter(e => {
        const eActivityId = Number(e[idField]);
        return eActivityId === targetId && (e.status === 'active' || !e.status);
    });

    return activeEnrollments.map(enrollment => {
        const enrMemberId = Number(enrollment.memberId);

        // Try to find the full member object
        let member = membersArray.find(m => Number(m.id) === enrMemberId);

        // Fallback: If not found in the pre-loaded members (e.g. due to pagination), 
        // construct a partial member object from the enrollment's joined data if available
        if (!member) {
            member = {
                id: enrMemberId,
                firstName: enrollment.memberFirstName || "N/A",
                lastName: enrollment.memberLastName || "N/A",
                email: enrollment.memberEmail || null,
                phone: null,
                status: 'active',
                // Keep dates as null if not available, UI should handle it
                cardExpiryDate: null,
                medicalCertificateExpiry: null,
            } as unknown as Member;
        }

        const memberPayments = (payments || []).filter(p =>
            Number(p.memberId) === enrMemberId &&
            Number(p.enrollmentId) === Number(enrollment.id)
        );

        const memberAttendances = (attendances || []).filter(a =>
            Number(a.memberId) === enrMemberId &&
            Number(a[idField]) === targetId
        );

        let medicalCertStatus: 'valid' | 'warning' | 'expired' | 'missing' = 'missing';
        let medicalCertFormattedDate: string | null = null;

        if (member.medicalCertificateExpiry) {
            const expiryDate = new Date(member.medicalCertificateExpiry);
            const isValidCertDate = !Number.isNaN(expiryDate.getTime());

            if (isValidCertDate) {
                medicalCertFormattedDate = expiryDate.toLocaleDateString("it-IT");
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                const thirtyDaysFromNow = new Date(todayDate);
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

                if (expiryDate < todayDate) {
                    medicalCertStatus = 'expired';
                } else if (expiryDate <= thirtyDaysFromNow) {
                    medicalCertStatus = 'warning';
                } else {
                    medicalCertStatus = 'valid';
                }
            } else {
                medicalCertStatus = 'expired';
            }
        }

        return {
            member,
            enrollment,
            payments: memberPayments,
            attendances: memberAttendances,
            medicalCertStatus,
            medicalCertFormattedDate
        };
    }).filter(data => data.member !== null); // Ensure we always have a member object (even partial)
}
