import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, GraduationCap, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Course } from "@shared/schema";

export default function CourseEnrollments() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: any[], total: number }>({
    queryKey: ["/api/members"],
  });

  const members = membersData?.members || [];
  const isLoading = coursesLoading || enrollmentsLoading || membersLoading;

  const getEnrollmentsForCourse = (courseId: number) => {
    if (!enrollments || !members.length) return [];
    return enrollments
      .filter(e => e.courseId === courseId && e.status === 'active')
      .map(e => {
        const member = members.find(m => m.id === e.memberId);
        return member ? {
          enrollmentId: e.id,
          memberId: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          startDate: e.startDate,
        } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  };

  const filteredCourses = courses?.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-2" data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Indietro
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Iscritti per Corso</h1>
          <p className="text-muted-foreground mt-1">Visualizza e gestisci le iscrizioni ai corsi</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            {totalEnrollments} iscrizioni attive
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cerca corso per nome o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          ) : filteredCourses && filteredCourses.length > 0 ? (
            <div className="space-y-6">
              {filteredCourses.map((course) => {
                const courseEnrollments = getEnrollmentsForCourse(course.id);
                return (
                  <Card key={course.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{course.name}</h3>
                            {course.sku && (
                              <p className="text-sm text-muted-foreground">SKU: {course.sku}</p>
                            )}
                            {course.dayOfWeek && course.startTime && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {course.dayOfWeek} • {course.startTime}
                                {course.endTime && ` - ${course.endTime}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {courseEnrollments.length} {courseEnrollments.length === 1 ? 'iscritto' : 'iscritti'}
                          </Badge>
                          <Link href={`/courses?search=${encodeURIComponent(course.name)}`}>
                            <Button variant="ghost" size="sm" data-testid={`button-view-course-${course.id}`}>
                              Dettagli Corso
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {courseEnrollments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nessun iscritto per questo corso
                        </p>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Cognome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Data Iscrizione</TableHead>
                                <TableHead className="text-right">Azioni</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {courseEnrollments.map((enrollment) => (
                                <TableRow key={enrollment.enrollmentId}>
                                  <TableCell className="font-medium">{enrollment.firstName}</TableCell>
                                  <TableCell>{enrollment.lastName}</TableCell>
                                  <TableCell>{enrollment.email || '-'}</TableCell>
                                  <TableCell>
                                    {enrollment.startDate 
                                      ? new Date(enrollment.startDate).toLocaleDateString('it-IT')
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Link href={`/members?search=${enrollment.lastName}`}>
                                      <Button variant="ghost" size="sm" data-testid={`button-view-member-${enrollment.memberId}`}>
                                        Visualizza Profilo
                                      </Button>
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nessun corso trovato" : "Nessun corso disponibile"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
