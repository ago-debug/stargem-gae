const fs = require("fs");
const path = "/Users/augustogenca/.gemini/antigravity/playground/inner-zenith/client/src/pages/calendar.tsx";
let content = fs.readFileSync(path, "utf8");

const startDivider = "{/* Content Columns */}";
const endDivider = "{/* Calendar Content Grid - Timeline Labels */}";

const startIndex = content.indexOf(startDivider);
const endIndex = content.indexOf(endDivider);

const newBody = `{/* Content Columns */}
                            {selectedDay === "all" ? (
                                WEEKDAYS.map(day => (
                                    <div key={day.id} className="relative pointer-events-none min-w-[120px]">
                                        {/* Courses */}
                                        {filteredCourses
                                            .filter(c => normalizeDay(c.dayOfWeek) === day.id)
                                            .map(course => {
                                                const startMin = timeToMinutes(course.startTime || undefined);
                                                const endMin = timeToMinutes(course.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getCourseColor(course);
                                                const stats = getCourseStats(course.id);
                                                const availability = course.maxCapacity ? Math.max(0, course.maxCapacity - stats.total) : null;

                                                return (
                                                    <div
                                                        key={\`course-weekly-\${course.id}\`}
                                                        onClick={(e) => { e.stopPropagation(); handleEditCourse(course); }}
                                                        className={\`absolute left-0.5 right-0.5 p-2 rounded-lg border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col items-center justify-center text-center \${colorData.className || ""}\`}
                                                        style={{
                                                            top: \`\${startMin + 3}px\`,
                                                            height: \`\${duration - 3}px\`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        {course.sku && <span className="text-[6px] opacity-40 absolute top-1 right-1">{course.sku}</span>}
                                                        <div className="bg-black/5 px-1.5 py-0.5 rounded-full text-[8px] font-bold mb-1">
                                                            {course.startTime}-{course.endTime}
                                                        </div>
                                                        <span className="font-extrabold truncate w-full uppercase leading-tight mb-0.5">{course.name}</span>
                                                        <span className="truncate opacity-90 font-semibold mb-1.5">{instructors?.find(i => i.id === course.instructorId)?.lastName}</span>
                                                        <div className="flex gap-2 text-[8px] font-bold mt-auto pt-1 border-t border-black/5 w-full justify-center">
                                                            <span className="text-blue-600">U:\${stats.men}</span>
                                                            <span className="text-pink-600">D:\${stats.women}</span>
                                                            {availability !== null && (
                                                                <span className={availability <= 2 ? "text-red-600" : "text-green-600"}>
                                                                    Disp:\${availability}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {/* Workshops */}
                                        {filteredWorkshops
                                            .filter(w => normalizeDay(w.dayOfWeek) === day.id)
                                            .map(workshop => {
                                                const startMin = timeToMinutes(workshop.startTime || undefined);
                                                const endMin = timeToMinutes(workshop.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getCourseColor(workshop as any);
                                                const stats = getWorkshopStats(workshop.id);
                                                const availability = workshop.maxCapacity ? Math.max(0, workshop.maxCapacity - stats.total) : null;

                                                return (
                                                    <div
                                                        key={\`workshop-weekly-\${workshop.id}\`}
                                                        onClick={(e) => { e.stopPropagation(); setLocation(\`/workshops?search=\${encodeURIComponent(workshop.name)}\`); }}
                                                        className={\`absolute left-0.5 right-0.5 p-2 rounded-lg border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col items-center justify-center text-center \${colorData.className || ""}\`}
                                                        style={{
                                                            top: \`\${startMin + 3}px\`,
                                                            height: \`\${duration - 6}px\`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="bg-primary/20 px-1.5 py-0.5 rounded-full text-[8px] font-bold mb-1 flex items-center gap-1">
                                                            <Sparkles className="w-2 h-2 text-primary" />
                                                            {workshop.startTime}-{workshop.endTime}
                                                        </div>
                                                        <span className="font-extrabold truncate w-full uppercase leading-tight mb-0.5">{workshop.name}</span>
                                                        <span className="truncate opacity-90 font-semibold mb-1.5">{instructors?.find(i => i.id === workshop.instructorId)?.lastName}</span>
                                                        <div className="flex gap-2 text-[8px] font-bold mt-auto pt-1 border-t border-black/5 w-full justify-center">
                                                            <span className="text-blue-600">U:\${stats.men}</span>
                                                            <span className="text-pink-600">D:\${stats.women}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {/* Bookings */}
                                        {Array.isArray(studioBookings) && studioBookings
                                            ?.filter(booking => {
                                                if (!booking || !booking.bookingDate) return false;
                                                const bDate = new Date(booking.bookingDate);
                                                const today = new Date();
                                                const weekStart = startOfWeek(today, { weekStartsOn: 1 });
                                                const dayIdx = WEEKDAYS.findIndex(d => d.id === day.id);
                                                const targetDate = addDays(weekStart, dayIdx);
                                                return isSameDay(bDate, targetDate);
                                            })
                                            .map(booking => {
                                                const startMin = timeToMinutes(booking.startTime || undefined);
                                                const endMin = timeToMinutes(booking.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getBookingColor(booking);

                                                return (
                                                    <div
                                                        key={\`booking-weekly-\${booking.id}\`}
                                                        onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                                                        className={\`absolute left-0.5 right-0.5 p-2 rounded-lg border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col items-center justify-center text-center\`}
                                                        style={{
                                                            top: \`\${startMin + 3}px\`,
                                                            height: \`\${duration - 6}px\`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="bg-black/10 px-1.5 py-0.5 rounded-full text-[8px] font-bold mb-1 flex items-center gap-1">
                                                            <MapPin className="w-2 h-2" />
                                                            {booking.startTime}-{booking.endTime}
                                                        </div>
                                                        <span className="font-extrabold truncate w-full uppercase leading-tight mb-0.5">{booking.serviceName || "PRENOTAZIONE"}</span>
                                                        <span className="truncate opacity-90 text-[10px] font-medium leading-tight">{booking.memberFirstName ? \`\${booking.memberFirstName} \${booking.memberLastName}\` : booking.title}</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ))
                            ) : (
                                studios?.map(studio => (
                                    <div key={studio.id} className="relative pointer-events-none min-w-[140px]">
                                        {/* Courses */}
                                        {filteredCourses
                                            .filter(c => c.studioId === studio.id && normalizeDay(c.dayOfWeek) === selectedDay)
                                            .map(course => {
                                                const startMin = timeToMinutes(course.startTime || undefined);
                                                const endMin = timeToMinutes(course.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getCourseColor(course);
                                                const stats = getCourseStats(course.id);
                                                const availability = course.maxCapacity ? Math.max(0, course.maxCapacity - stats.total) : null;

                                                return (
                                                    <div
                                                        key={\`course-daily-\${course.id}\`}
                                                        onClick={(e) => { e.stopPropagation(); handleEditCourse(course); }}
                                                        className={\`absolute left-1.5 right-1.5 p-2 rounded-md border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col justify-between items-center text-center \${colorData.className || ""}\`}
                                                        style={{
                                                            top: \`\${startMin + 3}px\`,
                                                            height: \`\${duration - 6}px\`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="w-full flex flex-col items-center">
                                                            {course.sku && <span className="text-[7px] opacity-40 absolute top-1 right-2">{course.sku}</span>}
                                                            <span className="font-bold uppercase leading-none mt-2 px-1 text-[11px]">{course.name}</span>
                                                            <span className="opacity-80 text-[10px] mt-1 font-medium">{instructors?.find(i => i.id === course.instructorId)?.lastName}</span>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-1.5 w-full">
                                                            <div className="flex gap-2.5 text-[8px] font-bold">
                                                                <span className="text-blue-600">U:\${stats.men}</span>
                                                                <span className="text-pink-600">D:\${stats.women}</span>
                                                            </div>
                                                            <div className="bg-black/5 px-2 py-0.5 rounded-full text-[8px] font-bold text-black/60">
                                                                {course.startTime}-{course.endTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {/* Workshops */}
                                        {filteredWorkshops
                                            .filter(w => w.studioId === studio.id && normalizeDay(w.dayOfWeek) === selectedDay)
                                            .map(workshop => {
                                                const startMin = timeToMinutes(workshop.startTime || undefined);
                                                const endMin = timeToMinutes(workshop.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getCourseColor(workshop as any);
                                                const stats = getWorkshopStats(workshop.id);
                                                const availability = workshop.maxCapacity ? Math.max(0, workshop.maxCapacity - stats.total) : null;

                                                return (
                                                    <div
                                                        key={\`workshop-daily-\${workshop.id}\`}
                                                        onClick={(e) => { e.stopPropagation(); setLocation(\`/workshops?search=\${encodeURIComponent(workshop.name)}\`); }}
                                                        className={\`absolute left-1.5 right-1.5 p-2 rounded-md border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col justify-between items-center text-center \${colorData.className || ""}\`}
                                                        style={{
                                                            top: \`\${startMin + 3}px\`,
                                                            height: \`\${duration - 6}px\`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="w-full flex flex-col items-center">
                                                            <div className="bg-primary/20 px-1.5 py-0.5 rounded-full text-[8px] font-bold mb-1 flex items-center justify-center gap-1 w-fit">
                                                                <Sparkles className="w-2 h-2 text-primary" />
                                                                <span>WORKSHOP</span>
                                                            </div>
                                                            <span className="font-bold uppercase leading-none mt-1 px-1 text-[11px]">{workshop.name}</span>
                                                            <span className="opacity-80 text-[10px] mt-1 font-medium">{instructors?.find(i => i.id === workshop.instructorId)?.lastName}</span>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-1.5 w-full">
                                                            <div className="flex gap-2.5 text-[8px] font-bold">
                                                                <span className="text-blue-600">U:\${stats.men}</span>
                                                                <span className="text-pink-600">D:\${stats.women}</span>
                                                            </div>
                                                            <div className="bg-black/5 px-2 py-0.5 rounded-full text-[8px] font-bold text-black/60">
                                                                {workshop.startTime}-{workshop.endTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {/* Bookings */}
                                        {Array.isArray(studioBookings) && studioBookings
                                            ?.filter(booking => {
                                                if (!booking || !booking.bookingDate) return false;
                                                const bDate = new Date(booking.bookingDate);
                                                const today = new Date();
                                                const weekStart = startOfWeek(today, { weekStartsOn: 1 });
                                                const dayIdx = WEEKDAYS.findIndex(d => d.id === selectedDay);
                                                const targetDate = addDays(weekStart, dayIdx);
                                                return isSameDay(bDate, targetDate) && booking.studioId === studio.id;
                                            })
                                            .map(booking => {
                                                const startMin = timeToMinutes(booking.startTime || undefined);
                                                const endMin = timeToMinutes(booking.endTime || undefined);
                                                const duration = (endMin || startMin + 60) - startMin;
                                                const colorData = getBookingColor(booking);

                                                return (
                                                    <div
                                                        key={\`booking-daily-\${booking.id}\`}
                                                        onClick={(e) => { e.stopPropagation(); handleEditBooking(booking); }}
                                                        className={\`absolute left-1.5 right-1.5 p-2 rounded-md border-l-[6px] shadow-sm pointer-events-auto cursor-pointer transition-all hover:scale-[1.02] z-20 flex flex-col justify-between items-center text-center\`}
                                                        style={{
                                                            top: \`\${startMin + 3}px\`,
                                                            height: \`\${duration - 6}px\`,
                                                            fontSize: "10px",
                                                            ...colorData
                                                        }}
                                                    >
                                                        <div className="w-full flex flex-col items-center">
                                                            <span className="font-bold uppercase leading-none mt-2 px-1 text-[11px]">{booking.serviceName || "PRENOTAZIONE"}</span>
                                                            <span className="opacity-80 text-[10px] mt-1 font-medium">{booking.memberFirstName ? \`\${booking.memberFirstName} \${booking.memberLastName}\` : booking.title}</span>
                                                        </div>
                                                        <div className="bg-black/5 px-2 py-0.5 rounded-full text-[8px] font-bold text-black/60 mt-auto">
                                                            {booking.startTime}-{booking.endTime}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ))
                            )}`;

if (startIndex !== -1 && endIndex !== -1) {
    const finalContent = content.substring(0, startIndex) + newBody + "\n\n                        " + content.substring(endIndex);
    fs.writeFileSync(path, finalContent);
} else {
    process.exit(1);
}
