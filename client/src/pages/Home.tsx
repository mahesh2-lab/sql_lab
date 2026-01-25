import { useExercises } from "@/hooks/use-exercises";
import { useProgress } from "@/hooks/use-progress";
import { Link } from "wouter";
import { PlayCircle, Award, Terminal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: exercises, isLoading: loadingList } = useExercises();
  const { progress, isLoading: loadingProgress } = useProgress();

  if (loadingList || loadingProgress) {
    return <div className="p-8"><Skeleton className="h-96 w-full max-w-4xl mx-auto" /></div>;
  }

  const firstIncomplete = exercises 
    ? [...exercises].sort((a, b) => a.order - b.order).find(ex => !progress.completedExerciseIds.includes(ex.id))
    : null;

  const continueId = firstIncomplete?.id || (exercises && exercises.length > 0 ? exercises[exercises.length - 1].id : 1);

  const completedCount = progress.completedExerciseIds.length;
  const totalCount = exercises?.length || 0;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-6 py-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-12 items-center mb-24">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Terminal className="w-3 h-3" /> SQL Learning Lab
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              Master SQL <br />
              <span className="text-primary">Interactively.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              A browser-based environment to practice SQL queries. 
              Real execution engine, instant feedback, zero setup.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href={`/exercise/${continueId}`}>
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all">
                  <PlayCircle className="mr-2 w-5 h-5" />
                  {completedCount > 0 ? "Continue Learning" : "Start Coding"}
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md">
             <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Your Progress</h3>
                    <p className="text-sm text-muted-foreground">Keep up the momentum!</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-end justify-between">
                      <span className="text-4xl font-bold text-foreground">{percentage}%</span>
                      <span className="text-sm text-muted-foreground mb-1">{completedCount}/{totalCount} Exercises</span>
                   </div>
                   <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }} />
                   </div>
                </div>

                {firstIncomplete && (
                   <div className="mt-8 p-4 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-colors group cursor-pointer">
                      <Link href={`/exercise/${firstIncomplete.id}`}>
                        <div className="flex items-center justify-between">
                           <div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Up Next</div>
                              <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {firstIncomplete.title}
                              </div>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                              <ArrowRight className="w-4 h-4" />
                           </div>
                        </div>
                      </Link>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
