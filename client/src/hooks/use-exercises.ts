import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Hooks for API data
export function useExercises() {
  return useQuery({
    queryKey: [api.exercises.list.path],
    queryFn: async () => {
      const res = await fetch(api.exercises.list.path);
      if (!res.ok) throw new Error("Failed to fetch exercises");
      return api.exercises.list.responses[200].parse(await res.json());
    },
  });
}

export function useExercise(id: number) {
  return useQuery({
    queryKey: [api.exercises.get.path, id],
    queryFn: async () => {
      if (isNaN(id)) return null;
      const url = buildUrl(api.exercises.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch exercise");
      return api.exercises.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
