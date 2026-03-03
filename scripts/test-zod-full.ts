import { insertCourseQuotesGridSchema } from "../shared/schema";

const payload = {
  "activityType": "corsi",
  "category": "NUOVO",
  "description": "",
  "details": "",
  "corsiWeek": null,
  "sortOrder": null,
  "monthsData":{ "Settembre": {"quota":null,"lezioni":null}}
};

const result = insertCourseQuotesGridSchema.safeParse(payload);
console.log(result.success ? "Valid!" : JSON.stringify(result.error.issues, null, 2));
