import { type Exercise } from "@shared/schema";
import { CheckCircle, Lock, PlayCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

type ExerciseListProps = {
  exercises: Exercise[];
  completedIds: number[];
  currentId?: number;
};

export function ExerciseList({
  exercises,
  completedIds,
  currentId,
}: ExerciseListProps) {
  const sorted = [...exercises].sort((a, b) => a.order - b.order);

  return (
    <div className="py-1.5 px-1.5 space-y-0.5">
      {sorted.map((ex, index) => {
        const isCompleted = completedIds.includes(ex.id);
        const isCurrent = ex.id === currentId;
        const prev = sorted[index - 1];
        const isLocked = index > 0 && !completedIds.includes(prev?.id ?? -1);

        return (
          <Link
            key={ex.id}
            href={isLocked ? "#" : `/exercise/${ex.id}`}
            className={cn(
              "group flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all duration-200 relative",
              isCurrent
                ? "bg-primary/15 text-foreground active-accent-bar"
                : "hover:bg-muted/30 text-muted-foreground hover:text-foreground",
              isLocked &&
                "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
            )}
            onClick={(e) => isLocked && e.preventDefault()}
          >
            {/* Status Icon */}
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200",
                isCompleted
                  ? "bg-emerald-500/15 text-emerald-400"
                  : isCurrent
                    ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                    : isLocked
                      ? "bg-muted/40 text-muted-foreground/60"
                      : "bg-muted/25 text-muted-foreground group-hover:text-primary/80",
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : isLocked ? (
                <Lock className="w-3 h-3" />
              ) : isCurrent ? (
                <PlayCircle className="w-3.5 h-3.5 fill-current" />
              ) : (
                <span className="font-mono text-[10px] font-medium">
                  {index + 1}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "font-medium truncate leading-tight",
                  isCurrent ? "text-foreground" : "",
                )}
              >
                {ex.title}
              </div>
            </div>

            {/* Current indicator arrow */}
            {isCurrent && (
              <ChevronRight className="w-3 h-3 text-primary shrink-0" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
