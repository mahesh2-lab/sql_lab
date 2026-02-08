import { useExercises } from "@/hooks/use-exercises";
import { useProgress } from "@/hooks/use-progress";
import { Link } from "wouter";
import { Database, ArrowRight, Code2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: exercises, isLoading: loadingList } = useExercises();
  const { progress, isLoading: loadingProgress } = useProgress();

  const isLoading = loadingList || loadingProgress;

  const firstIncomplete = exercises
    ? [...exercises]
        .sort((a, b) => a.order - b.order)
        .find((ex) => !progress.completedExerciseIds.includes(ex.id))
    : null;

  const continueId =
    firstIncomplete?.id ||
    (exercises && exercises.length > 0
      ? exercises[exercises.length - 1].id
      : 1);

  const completedCount = progress?.completedExerciseIds?.length || 0;
  const totalCount = exercises?.length || 0;
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none opacity-30" />

      {/* Navbar */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold font-display">
              <Code2 className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              DevLab
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Documentation
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              GitHub
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 flex-1 relative z-10 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl space-y-8 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50 text-secondary-foreground text-sm font-medium shadow-sm">
            <Cpu className="w-4 h-4 text-primary" />
            <span>Interactive Browser Environment</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
            Master Postgres <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              without leaving the browser.
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Zero setup. Instant startup. A real runtime environment for Postgres
            running directly in your browser via WebAssembly (PGlite).
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href={`/exercise/${continueId}`}>
              <Button
                size="lg"
                className="h-12 px-8 rounded-full text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
              >
                Get Started
              </Button>
            </Link>
            <Link href={`/exercise/${continueId}`}>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-full text-base bg-background/50 backdrop-blur-sm"
              >
                View Curriculum
              </Button>
            </Link>
          </div>
        </div>

        {/* Labs Grid */}
        <div className="flex justify-center w-full max-w-xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {isLoading ? (
            <Skeleton className="h-[350px] w-full rounded-xl" />
          ) : (
            <Link href={exercises ? `/exercise/${continueId}` : "#"}>
              <Card className="h-full border-border/50 bg-card/40 backdrop-blur-sm hover:border-primary/50 transition-all hover:shadow-[0_0_40px_rgba(124,58,237,0.15)] group cursor-pointer overflow-hidden relative w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                      <Database className="w-6 h-6" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-mono bg-secondary/80 backdrop-blur"
                    >
                      SQL Curriculum
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                    Postgres Lab
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Complete interactive exercises to master SQL queries.
                    Powered by PGlite.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                      <span>Course Progress</span>
                      <span>{percentage}%</span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2 bg-muted/50"
                      indicatorClassName="bg-primary/80"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {completedCount} of {totalCount} exercises completed
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-6 border-t border-border/30 bg-muted/20">
                  <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {completedCount > 0
                      ? "Continue Learning"
                      : "Start SQL Course"}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-background/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2024 DevLab. Built with ❤️ and WebAssembly.</p>
        </div>
      </footer>
    </div>
  );
}
