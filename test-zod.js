const { insertBookingServiceCategorySchema } = require("./dist/shared/schema.js");

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
