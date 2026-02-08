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
  const [successCountdown, setSuccessCountdown] = useState(false);
  const autoNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Guard: redirect to first unlocked exercise if user tries to access a locked one via URL
  useEffect(() => {
    if (!exercises?.length || loadingList || loadingProgress || !exerciseId)
      return;
    const sorted = [...exercises].sort((a, b) => a.order - b.order);
    const targetIndex = sorted.findIndex((e) => e.id === exerciseId);
    if (targetIndex <= 0) return; // first exercise is always accessible, or exercise not found
    const prevExercise = sorted[targetIndex - 1];
    const isLocked = !progress.completedExerciseIds.includes(prevExercise.id);
    if (isLocked) {
      // Find the highest unlocked exercise to redirect to
      let lastUnlocked = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        if (progress.completedExerciseIds.includes(sorted[i - 1].id)) {
          lastUnlocked = sorted[i];
        } else {
          break;
        }
      }
      setLocation(`/exercise/${lastUnlocked.id}`);
    }
  }, [
    exercises,
    exerciseId,
    loadingList,
    loadingProgress,
    progress.completedExerciseIds,
    setLocation,
  ]);

  // Clean up auto-nav timer on unmount
  useEffect(() => {
    return () => {
      if (autoNavTimerRef.current) clearTimeout(autoNavTimerRef.current);
    };
  }, []);

  // Setup DB when exercise changes
  useEffect(() => {
    if (exercise && db) {
      // Clear any pending auto-nav timer from previous exercise
      if (autoNavTimerRef.current) {
        clearTimeout(autoNavTimerRef.current);
        autoNavTimerRef.current = null;
      }
      resetDB(exercise.setupSql);
      setLastActive(exercise.id);
      setIsSuccess(false);
      setSuccessCountdown(false);
      setResult(null);
      editorRef.current?.setValue("-- Write your SQL query here\n");
      setShowHint(false);
    }
  }, [exercise, db, resetDB, setLastActive]);

  const handleEditorMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor, monaco: any) => {
      editorRef.current = editorInstance;

      // Define custom theme matching the website
      monaco.editor.defineTheme("sql-lab", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "a78bfa", fontStyle: "bold" }, // purple - primary
          { token: "string", foreground: "4ade80" }, // green - accent
          { token: "number", foreground: "f59e0b" }, // amber - warning
          { token: "comment", foreground: "6b7280", fontStyle: "italic" }, // muted gray
          { token: "operator", foreground: "94a3b8" }, // light gray
          { token: "identifier", foreground: "e2e8f0" }, // foreground
          { token: "type", foreground: "7dd3fc" }, // sky blue
          { token: "delimiter", foreground: "94a3b8" },
          { token: "predefined", foreground: "c084fc" }, // lighter purple
        ],
        colors: {
          "editor.background": "#030711",
          "editor.foreground": "#e2e8f0",
          "editor.lineHighlightBackground": "#0f172a",
          "editor.selectionBackground": "#6d28d940",
          "editor.inactiveSelectionBackground": "#6d28d920",
          "editorCursor.foreground": "#a78bfa",
          "editorLineNumber.foreground": "#334155",
          "editorLineNumber.activeForeground": "#94a3b8",
          "editorIndentGuide.background": "#1e293b",
          "editorIndentGuide.activeBackground": "#334155",
          "editor.selectionHighlightBackground": "#6d28d920",
          "editorBracketMatch.background": "#6d28d930",
          "editorBracketMatch.border": "#6d28d960",
          "editorGutter.background": "#030711",
          "editorWidget.background": "#0f172a",
          "editorWidget.border": "#1e293b",
          "editorSuggestWidget.background": "#0f172a",
          "editorSuggestWidget.border": "#1e293b",
          "editorSuggestWidget.selectedBackground": "#1e293b",
          "input.background": "#0f172a",
          "input.border": "#1e293b",
          "scrollbarSlider.background": "#1e293b80",
          "scrollbarSlider.hoverBackground": "#33415580",
          "scrollbarSlider.activeBackground": "#475569",
        },
      });
      monaco.editor.setTheme("sql-lab");
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
      setSuccessCountdown(true);
      markCompleted(exercise.id);

      // Fire confetti immediately
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Auto-navigate after 1.4s
      autoNavTimerRef.current = setTimeout(() => {
        setSuccessCountdown(false);
        setIsSuccess(false);
        const sorted = [...exercises!].sort((a, b) => a.order - b.order);
        const currentIndex = sorted.findIndex((e) => e.id === exercise.id);
        const next = sorted[currentIndex + 1];
        if (next) {
          setLocation(`/exercise/${next.id}`);
        }
      }, 1400);
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
                      <div className="h-full flex flex-col bg-background">
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
                            theme="sql-lab"
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
                          {/* Success Banner with Progress Bar */}
                          <AnimatePresence>
                            {isSuccess && (
                              <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-0 left-0 right-0 z-20"
                              >
                                <div className="bg-green-500/15 border-b border-green-500/30 px-4 py-3 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                                      <PartyPopper className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <span className="text-sm font-semibold text-green-400">
                                        Correct!
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        Moving to next exercise...
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground h-7"
                                    onClick={() => {
                                      if (autoNavTimerRef.current)
                                        clearTimeout(autoNavTimerRef.current);
                                      setSuccessCountdown(false);
                                      setIsSuccess(false);
                                    }}
                                  >
                                    Stay Here
                                  </Button>
                                </div>
                                {/* Progress bar */}
                                {successCountdown && (
                                  <div className="h-1 bg-green-500/10 w-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-green-500"
                                      initial={{ width: "0%" }}
                                      animate={{ width: "100%" }}
                                      transition={{
                                        duration: 1.4,
                                        ease: "linear",
                                      }}
                                    />
                                  </div>
                                )}
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
