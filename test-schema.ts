import { insertTeamNoteSchema } from "./shared/schema";

const payload = {
  title: "Test",
  content: "Test content",
  category: "generale",
  authorId: "1",
  authorName: "admin admin"
};

const result = insertTeamNoteSchema.safeParse(payload);
console.log(JSON.stringify(result, null, 2));
