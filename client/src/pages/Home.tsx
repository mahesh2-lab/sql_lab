import { useExercises } from "@/hooks/use-exercises";
import { useProgress } from "@/hooks/use-progress";
import { Link } from "wouter";
import {
  Database,
  ArrowRight,
  Terminal,
  Sparkles,
  Zap,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div
      className="min-h-screen relative overflow-hidden flex flex-col font-sans"
      style={{
        background:
          "linear-gradient(180deg, #09090B 0%, #0F0F11 40%, #09090B 100%)",
      }}
    >
      {/* ── Ambient Glow Effects ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[30%] -right-[100px] w-[400px] h-[400px] rounded-full pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[10%] -left-[100px] w-[300px] h-[300px] rounded-full pointer-events-none opacity-15"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
        }}
      />

      {/* ── Navbar ── */}
      <header className="border-b border-border/30 sticky top-0 z-50 glass">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center glow-sm"
              style={{
                background: "linear-gradient(135deg, #10B981, #06B6D4)",
              }}
            >
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-foreground">
              SQL Lab
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              Docs
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              GitHub
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 flex-1 relative z-10 flex flex-col items-center">
        {/* ── Hero Section ── */}
        <div className="text-center max-w-3xl space-y-8 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 text-xs font-medium text-primary"
            style={{ background: "rgba(16,185,129,0.06)" }}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Browser-native SQL — No setup required</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.1] tracking-tight">
            Master SQL <br className="hidden sm:block" />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #10B981, #06B6D4, #34D399)",
              }}
            >
              in the browser.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Interactive exercises powered by PGlite WebAssembly. Write real SQL,
            get instant feedback, and level up your database skills.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href={`/exercise/${continueId}`}>
              <Button
                size="lg"
                className="h-11 px-7 rounded-lg text-sm font-medium btn-glow text-white transition-all duration-200"
              >
                {completedCount > 0 ? "Continue Learning" : "Start Learning"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href={`/exercise/${continueId}`}>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-7 rounded-lg text-sm font-medium border-border/50 text-foreground hover:bg-muted/40 hover:border-primary/40 transition-all duration-200"
              >
                View Exercises
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Feature Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {[
            {
              icon: <Code2 className="w-5 h-5" />,
              title: "Real SQL Engine",
              desc: "Full PostgreSQL running in your browser via WebAssembly",
            },
            {
              icon: <Sparkles className="w-5 h-5" />,
              title: "Instant Feedback",
              desc: "Submit queries and get results validated in real-time",
            },
            {
              icon: <Database className="w-5 h-5" />,
              title: "Progressive Curriculum",
              desc: "From SELECT basics to advanced JOINs and aggregation",
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-border/25 group hover:border-primary/25 transition-all duration-300"
              style={{
                background:
                  "linear-gradient(180deg, rgba(24,24,27,0.3) 0%, rgba(9,9,11,0.3) 100%)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-primary mb-3 group-hover:text-primary transition-colors"
                style={{ background: "rgba(16,185,129,0.08)" }}
              >
                {feat.icon}
              </div>
              <h3 className="font-display font-semibold text-sm text-foreground mb-1.5">
                {feat.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── Course Card ── */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          {isLoading ? (
            <Skeleton className="h-[280px] w-full rounded-xl bg-muted/20" />
          ) : (
            <Link href={exercises ? `/exercise/${continueId}` : "#"}>
              <Card
                className="border-border/25 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_60px_rgba(16,185,129,0.1)] group cursor-pointer overflow-hidden relative rounded-xl"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(24,24,27,0.4) 0%, rgba(9,9,11,0.4) 100%)",
                }}
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                      style={{ background: "rgba(16,185,129,0.1)" }}
                    >
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <Badge className="font-mono text-[10px] bg-primary/15 text-primary border border-primary/25 rounded-md">
                      SQL Course
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-display font-bold group-hover:text-primary transition-colors duration-200">
                    PostgreSQL Lab
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 text-muted-foreground">
                    Complete interactive exercises to master SQL queries.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>Progress</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${percentage}%`,
                          background:
                            "linear-gradient(90deg, #10B981, #06B6D4)",
                          boxShadow:
                            percentage > 0 ? "0 0 10px #10B98140" : "none",
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 font-mono">
                      {completedCount} of {totalCount} exercises completed
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-border/20">
                  <Button className="w-full h-9 text-xs font-medium rounded-lg btn-glow text-white group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300">
                    {completedCount > 0
                      ? "Continue Learning"
                      : "Start SQL Course"}
                    <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/20 py-8">
        <div className="container mx-auto px-6 text-center text-xs text-muted-foreground/70 font-mono">
          <p>SQL Lab — Built with PGlite WebAssembly</p>
        </div>
      </footer>
    </div>
  );
}
