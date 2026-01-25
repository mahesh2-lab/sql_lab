import { type Exercise } from "@shared/schema";
import { exercisesData } from "./data/exercises";

export interface IStorage {
  getExercises(): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
}

export class MemStorage implements IStorage {
  private exercises: Exercise[];

  constructor() {
    this.exercises = exercisesData;
  }

  async getExercises(): Promise<Exercise[]> {
    return this.exercises;
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.find((e) => e.id === id);
  }
}

export const storage = new MemStorage();
