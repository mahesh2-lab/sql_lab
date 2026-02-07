import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useExercises, useExercise } from "@/hooks/use-exercises";
import { usePGlite } from "@/hooks/use-pglite";
import { useProgress } from "@/hooks/use-progress";
import type { editor } from "monaco-editor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ExerciseList } from "@/components/ExerciseList";
import { ResultTable } from "@/components/ResultTable";
import { SchemaViewer } from "@/components/SchemaViewer";
import Editor from "@monaco-editor/react";
import {
  Play,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  PartyPopper,
  Database,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export default function Lab() {
  const [match, params] = useRoute("/exercise/:id");
  const [, setLocation] = useLocation();
  const exerciseId = params?.id ? parseInt(params.id) : undefined;

  const { data: exercises, isLoading: loadingList } = useExercises();
  const { data: exercise, isLoading: loadingExercise } = useExercise(
    exerciseId || 0,
  );
  const {
    progress,
    isLoading: loadingProgress,
    markCompleted,
    setLastActive,
  } = useProgress();
  const { db, executeQuery, resetDB, isLoading: loadingDB } = usePGlite();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [result, setResult] = useState<{
    columns: string[];
    rows: any[][];
    error?: string;
    affectedRows?: number;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Redirect to last active or first exercise if none selected
  useEffect(() => {
    if (!match && !loadingList && !loadingExercise && exercises?.length) {
      const target = progress.lastActiveExerciseId || exercises[0].id;
      setLocation(`/exercise/${target}`);
    }
  }, [
    match,
    exercises,
    loadingList,
    loadingExercise,
    progress.lastActiveExerciseId,
    setLocation,
  ]);

  // Setup DB when exercise changes
  useEffect(() => {
    if (exercise && db) {
      resetDB(exercise.setupSql);
      setLastActive(exercise.id);
      setIsSuccess(false);
      setResult(null);
      editorRef.current?.setValue("-- Write your SQL query here\n");
      setShowHint(false);
    }
  }, [exercise, db, resetDB, setLastActive]);

  const handleEditorMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
    },
    [],
  );

  const getCode = useCallback(() => {
    return editorRef.current?.getValue() || "";
  }, []);

  const resetCode = useCallback(() => {
    editorRef.current?.setValue("-- Write your SQL  here\n");
  }, []);

  const handleRun = async () => {
    setIsRunning(true);
    const res = await executeQuery(getCode());
    setResult(res);
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    if (!exercise) return;
    setIsRunning(true);

    // 1. Run user query
    const userRes = await executeQuery(getCode());
    if (userRes.error) {
      setResult(userRes);
      setIsRunning(false);
      return;
    }

    // 2. Run solution query (hidden)
    const solutionRes = await executeQuery(exercise.solutionSql);

    // 3. Compare
    const userJSON = JSON.stringify(userRes.rows);
    const solutionJSON = JSON.stringify(solutionRes.rows);

    const passed = userJSON === solutionJSON;

    setResult({
      ...userRes,
      error: passed ? undefined : "Incorrect result. Try again!",
    });

    if (passed) {
      setIsSuccess(true);
      markCompleted(exercise.id);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setIsRunning(false);
  };

  const handleNext = () => {
    if (!exercises || !exercise) return;
    const sorted = [...exercises].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex((e) => e.id === exercise.id);
    const next = sorted[currentIndex + 1];
    if (next) {
      setLocation(`/exercise/${next.id}`);
    }
  };

  console.log(loadingList, loadingDB, loadingProgress);

  if (loadingList || loadingDB) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground font-mono animate-pulse">
          Initializing SQL Engine...
        </p>
      </div>
    );
  }

  if (!exercises) return null;

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold font-display text-lg">
            SQL
          </div>
          <h1 className="font-display font-bold text-lg hidden md:block">
            Postgres Lab
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground mr-4 hidden sm:block">
            {progress.completedExerciseIds.length} / {exercises.length}{" "}
            Completed
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            All Exercises
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            className="hidden md:block bg-muted/10 border-r border-border"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border bg-card/50">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Curriculum
                </h2>
              </div>
              <ScrollAreaWrapper>
                <ExerciseList
                  exercises={exercises}
                  completedIds={progress.completedExerciseIds}
                  currentId={exerciseId}
                />
              </ScrollAreaWrapper>
            </div>
          </ResizablePanel>

          <ResizableHandle className="hidden md:flex" />

          {/* Main Content */}
          <ResizablePanel defaultSize={80}>
            {loadingExercise || !exercise ? (
              <div className="h-full w-full p-8 space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <ResizablePanelGroup direction="horizontal">
                {/* Exercise Description & Schema */}
                <ResizablePanel defaultSize={40} minSize={30}>
                  <ScrollAreaWrapper className="bg-card/30">
                    <div className="p-6 max-w-2xl mx-auto space-y-8">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <Badge
                            variant="outline"
                            className="bg-primary/5 border-primary/20 text-primary font-mono"
                          >
                            Exercise {exercise.order}
                          </Badge>
                          {progress.completedExerciseIds.includes(
                            exercise.id,
                          ) && (
                            <Badge
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Completed
                            </Badge>
                          )}
                        </div>
                        <h1 className="text-3xl font-display font-bold mb-4 text-foreground">
                          {exercise.title}
                        </h1>
                        <div className="prose prose-invert prose-sm max-w-none text-muted-foreground">
                          <p>{exercise.description}</p>
                        </div>
                      </div>

                      {exercise.hint && (
                        <div className="pt-4 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHint(!showHint)}
                            className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                          >
                            <Lightbulb className="w-4 h-4 mr-2" />
                            {showHint ? "Hide Hint" : "Show Hint"}
                          </Button>
                          <AnimatePresence>
                            {showHint && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm text-amber-200/80 italic">
                                  {exercise.hint}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      <div className="pt-8 border-t border-border">
                        <SchemaViewer />
                      </div>
                    </div>
                  </ScrollAreaWrapper>
                </ResizablePanel>

                <ResizableHandle />

                {/* Editor & Results */}
                <ResizablePanel defaultSize={60}>
                  <ResizablePanelGroup direction="vertical">
                    {/* Code Editor */}
                    <ResizablePanel defaultSize={60} minSize={30}>
                      <div className="h-full flex flex-col bg-[#1e1e1e]">
                        <div className="h-10 bg-muted/20 border-b border-border flex items-center justify-between px-4 shrink-0">
                          <span className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                            query.sql
                          </span>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={resetCode}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reset Code</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="flex-1 relative">
                          <Editor
                            height="100%"
                            defaultLanguage="sql"
                            theme="vs-dark"
                            defaultValue="-- Write your SQL query here\n"
                            onMount={handleEditorMount}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              fontFamily: "'JetBrains Mono', monospace",
                              padding: { top: 16 },
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                            }}
                          />
                        </div>
                        <div className="h-14 border-t border-border bg-card p-2 flex items-center justify-end gap-2 px-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRun}
                            disabled={isRunning}
                          >
                            <Play className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
                            Run
                          </Button>
                          <Button
                            onClick={handleSubmit}
                            disabled={isRunning}
                            className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                          >
                            {isRunning ? (
                              <span className="animate-spin mr-2">⏳</span>
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Submit
                          </Button>
                        </div>
                      </div>
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Results Panel */}
                    <ResizablePanel defaultSize={40} minSize={20}>
                      <div className="h-full flex flex-col bg-background relative">
                        <div className="h-9 border-b border-border bg-muted/30 flex items-center px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 justify-between">
                          <span>Results</span>
                          {result?.rows && (
                            <span className="font-mono">
                              {result.rows.length} rows
                            </span>
                          )}
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                          {/* Success Overlay */}
                          <AnimatePresence>
                            {isSuccess && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
                              >
                                <motion.div
                                  initial={{ scale: 0.8, y: 20 }}
                                  animate={{ scale: 1, y: 0 }}
                                  className="bg-card border border-border p-8 rounded-2xl shadow-2xl max-w-md w-full"
                                >
                                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                    <PartyPopper className="w-8 h-8" />
                                  </div>
                                  <h3 className="text-2xl font-bold text-foreground mb-2">
                                    Great Job!
                                  </h3>
                                  <p className="text-muted-foreground mb-6">
                                    You've solved this query correctly.
                                  </p>
                                  <div className="flex justify-center gap-3">
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsSuccess(false)}
                                    >
                                      Stay Here
                                    </Button>
                                    <Button
                                      onClick={handleNext}
                                      className="gap-2"
                                    >
                                      Next Exercise{" "}
                                      <ChevronRight className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {result ? (
                            <ResultTable
                              columns={result.columns}
                              rows={result.rows}
                              error={result.error}
                              affectedRows={result.affectedRows}
                            />
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                              <Database className="w-8 h-8 opacity-20" />
                              <span className="text-sm">
                                Run your query to see results here
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

// Helper to make ScrollArea work easily with flex layouts
function ScrollAreaWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`h-full w-full overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}
