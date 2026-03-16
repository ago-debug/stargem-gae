import { insertBookingServiceCategorySchema } from "./shared/schema";

try {
  const payload = {
    name: "Casting",
    description: null,
    parentId: null,
    color: "#ff0000"
  };
  const parsed = insertBookingServiceCategorySchema.parse(payload);
  console.log("Parse Success:", parsed);
} catch (e) {
  console.error("Parse Error:", e);
}
