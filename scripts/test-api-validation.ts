import { insertCourseQuotesGridSchema } from "../shared/schema";

const payload = [{
  "category": "NUOVO1",
  "description": "prv",
  "details": "dddd",
  "corsiWeek": null,
  "sortOrder": 1,
  "activityType": "workshop",
  "monthsData":{ "Settembre": {"quota":1000,"lezioni":null},"Ottobre":{"quota":null,"lezioni":null},"Novembre":{"quota":null,"lezioni":null},"Dicembre":{"quota":null,"lezioni":null},"Gennaio":{"quota":null,"lezioni":null},"Febbraio":{"quota":null,"lezioni":null},"Marzo":{"quota":null,"lezioni":null},"Aprile":{"quota":null,"lezioni":null},"Maggio":{"quota":null,"lezioni":null},"Giugno":{"quota":null,"lezioni":null},"Luglio":{"quota":null,"lezioni":null}}
}];

for (const item of payload) {
  const result = insertCourseQuotesGridSchema.safeParse(item);
  console.log(result.success ? "Valid!" : JSON.stringify(result.error.issues, null, 2));
}

