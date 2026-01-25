import { useEffect, useState, useCallback } from "react";
import { PGlite } from "@electric-sql/pglite";

type QueryResult = {
  columns: string[];
  rows: any[][];
  error?: string;
  affectedRows?: number;
};

export function usePGlite() {
  const [db, setDb] = useState<PGlite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initDB() {
      try {
        const pg = await PGlite.create();
        if (mounted) {
          setDb(pg);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize PGlite");
          setIsLoading(false);
        }
      }
    }

    initDB();

    return () => {
      mounted = false;
      // PGlite cleanup if necessary
    };
  }, []);

  const executeQuery = useCallback(async (sql: string): Promise<QueryResult> => {
    if (!db) return { columns: [], rows: [], error: "Database not initialized" };

    try {
      const start = performance.now();
      const res = await db.query(sql);
      const end = performance.now();
      console.log(`Query executed in ${(end - start).toFixed(2)}ms`);

      return {
        columns: res.fields.map((f) => f.name),
        rows: res.rows.map((row) => Object.values(row)),
        affectedRows: res.affectedRows,
      };
    } catch (err) {
      return {
        columns: [],
        rows: [],
        error: err instanceof Error ? err.message : "Unknown execution error",
      };
    }
  }, [db]);

  const resetDB = useCallback(async (setupSql: string) => {
    if (!db) return;
    try {
      // Basic reset strategy: Drop public schema and recreate
      await db.query(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
      `);
      // Run specific setup for the exercise
      await db.exec(setupSql);
    } catch (err) {
      console.error("Failed to reset DB:", err);
      throw err;
    }
  }, [db]);

  return { db, isLoading, error, executeQuery, resetDB };
}
