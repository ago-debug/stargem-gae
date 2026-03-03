import { db } from "../server/db";
import { priceLists, priceListItems, courseQuotesGrid } from "../shared/schema";

async function run() {
  const lists = await db.select().from(priceLists);
  console.log("Price lists count:", lists.length);
  const items = await db.select().from(priceListItems);
  console.log("Price list items count:", items.length);
  const quotes = await db.select().from(courseQuotesGrid);
  console.log("CourseQuotesGrid count:", quotes.length);
  process.exit(0);
}
run();
