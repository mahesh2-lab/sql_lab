import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Exercises API
  app.get(api.exercises.list.path, async (_req, res) => {
    const exercises = await storage.getExercises();
    res.json(exercises);
  });

  app.get(api.exercises.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const exercise = await storage.getExercise(id);
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }
    res.json(exercise);
  });

  return httpServer;
}
