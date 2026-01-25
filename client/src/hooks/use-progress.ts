import { useState, useEffect } from "react";
import { openDB } from "idb";

const DB_NAME = "sql-lab-progress";
const STORE_NAME = "user_progress";

type ProgressData = {
  completedExerciseIds: number[];
  lastActiveExerciseId?: number;
};

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>({ completedExerciseIds: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize DB
  useEffect(() => {
    async function loadProgress() {
      try {
        const db = await openDB(DB_NAME, 1, {
          upgrade(db) {
            db.createObjectStore(STORE_NAME);
          },
        });
        const saved = await db.get(STORE_NAME, "main");
        if (saved) {
          setProgress(saved);
        }
      } catch (err) {
        console.error("Failed to load progress:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProgress();
  }, []);

  const markCompleted = async (exerciseId: number) => {
    if (progress.completedExerciseIds.includes(exerciseId)) return;

    const newProgress = {
      ...progress,
      completedExerciseIds: [...progress.completedExerciseIds, exerciseId],
    };

    setProgress(newProgress);

    const db = await openDB(DB_NAME, 1);
    await db.put(STORE_NAME, newProgress, "main");
  };

  const setLastActive = async (exerciseId: number) => {
    const newProgress = { ...progress, lastActiveExerciseId: exerciseId };
    setProgress(newProgress);
    const db = await openDB(DB_NAME, 1);
    await db.put(STORE_NAME, newProgress, "main");
  };

  return { progress, isLoading, markCompleted, setLastActive };
}
