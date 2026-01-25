import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We'll treat exercises as a static resource served by the API, 
// but defining the schema here ensures type safety across fullstack.
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // The setup SQL to initialize the DB state for this question
  setupSql: text("setup_sql").notNull(),
  // The solution SQL to compare results against
  solutionSql: text("solution_sql").notNull(),
  // Hint for the user
  hint: text("hint"),
  // Order in the curriculum
  order: integer("order").notNull(),
  // Expected columns structure for display/validation hints (optional)
  expectedColumns: jsonb("expected_columns").$type<string[]>(),
});

export const insertExerciseSchema = createInsertSchema(exercises);

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

// Progress tracking (client-side mostly, but typing it here is good practice)
export type UserProgress = {
  completedExerciseIds: number[];
  currentExerciseId: number;
};
