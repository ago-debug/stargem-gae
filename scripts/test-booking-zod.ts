import { insertBookingServiceCategorySchema } from "../shared/schema";

try {
  const payload1 = {
    name: "Casting",
    description: null,
    parentId: null,
    color: null
  };
  
  const result = insertBookingServiceCategorySchema.parse(payload1);
  console.log("Success:", result);
} catch (e) {
  console.error("Zod Error:", e);
}
