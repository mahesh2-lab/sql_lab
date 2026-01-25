import { type Exercise } from "@shared/schema";
import { CheckCircle, Lock, PlayCircle, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

type ExerciseListProps = {
  exercises: Exercise[];
  completedIds: number[];
  currentId?: number;
};

export function ExerciseList({ exercises, completedIds, currentId }: ExerciseListProps) {
  // Sort by order
  const sorted = [...exercises].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-1 p-2">
      {sorted.map((ex, index) => {
        const isCompleted = completedIds.includes(ex.id);
        const isCurrent = ex.id === currentId;
        // Unlock logic: First one is always unlocked. Others unlocked if previous is completed.
        const prev = sorted[index - 1];
        const isLocked = index > 0 && !completedIds.includes(prev?.id ?? -1);

        return (
          <Link 
            key={ex.id} 
            href={isLocked ? "#" : `/exercise/${ex.id}`}
            className={cn(
              "group flex items-center gap-3 p-3 rounded-lg text-sm transition-all duration-200 border border-transparent",
              isCurrent 
                ? "bg-primary/10 border-primary/20 text-primary-foreground shadow-sm" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground",
              isLocked && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
            )}
            onClick={(e) => isLocked && e.preventDefault()}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors",
              isCompleted 
                ? "bg-green-500/20 border-green-500/30 text-green-500" 
                : isCurrent 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : isLocked 
                    ? "bg-muted border-border" 
                    : "bg-background border-border group-hover:border-primary/50"
            )}>
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : isLocked ? (
                <Lock className="w-4 h-4" />
              ) : isCurrent ? (
                <PlayCircle className="w-4 h-4 fill-current" />
              ) : (
                <span className="font-mono text-xs">{index + 1}</span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-medium truncate",
                isCurrent ? "text-primary" : "text-foreground"
              )}>
                {ex.title}
              </div>
              <div className="text-xs truncate opacity-70">
                Exercise {index + 1}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
