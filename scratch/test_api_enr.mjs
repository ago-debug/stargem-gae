import http from 'http';

http.get('http://127.0.0.1:5001/api/enrollments?activityType=lezione_individuale', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`API returned ${parsed.length || 0} enrollments.`);
      // Count enrollments by course_id
      const byCourse = parsed.reduce((acc, curr) => {
        acc[curr.courseId] = (acc[curr.courseId] || 0) + 1;
        return acc;
      }, {});
      console.log("Enrollments by courseId:", byCourse);
    } catch (e) {
      console.log("Error parsing:", data.substring(0, 100));
    }
  });
}).on('error', (e) => {
  console.error("HTTP Error:", e.message);
});
