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
  Terminal,
  FileCode2,
  PanelLeftClose,
  PanelLeft,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const autoNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRunRef = useRef<() => void>(() => {});
  const handleSubmitRef = useRef<() => void>(() => {});

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

      // Custom modern dark theme — emerald/cyan
      monaco.editor.defineTheme("sql-lab-purple", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "34D399", fontStyle: "bold" },
          { token: "string", foreground: "4ADE80" },
          { token: "number", foreground: "FBBF24" },
          { token: "comment", foreground: "6B7280", fontStyle: "italic" },
          { token: "operator", foreground: "67E8F9" },
          { token: "identifier", foreground: "FAFAFA" },
          { token: "type", foreground: "22D3EE" },
          { token: "delimiter", foreground: "71717A" },
          { token: "predefined", foreground: "67E8F9" },
          { token: "function", foreground: "06B6D4" },
        ],
        colors: {
          "editor.background": "#09090B",
          "editor.foreground": "#FAFAFA",
          "editor.lineHighlightBackground": "#18181B",
          "editor.selectionBackground": "#10B98140",
          "editor.inactiveSelectionBackground": "#10B98120",
          "editorCursor.foreground": "#10B981",
          "editorLineNumber.foreground": "#3F3F46",
          "editorLineNumber.activeForeground": "#10B981",
          "editorIndentGuide.background": "#18181B",
          "editorIndentGuide.activeBackground": "#27272A",
          "editor.selectionHighlightBackground": "#10B98120",
          "editorBracketMatch.background": "#10B98130",
          "editorBracketMatch.border": "#10B98160",
          "editorGutter.background": "#09090B",
          "editorWidget.background": "#0F0F11",
          "editorWidget.border": "#27272A",
          "editorSuggestWidget.background": "#0F0F11",
          "editorSuggestWidget.border": "#27272A",
          "editorSuggestWidget.selectedBackground": "#18181B",
          "input.background": "#0F0F11",
          "input.border": "#27272A",
          "scrollbarSlider.background": "#27272A60",
          "scrollbarSlider.hoverBackground": "#3F3F4680",
          "scrollbarSlider.activeBackground": "#10B98140",
        },
      });
      monaco.editor.setTheme("sql-lab-purple");

      // Ctrl+Enter → Run query
      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          document.dispatchEvent(new CustomEvent("sql-lab:run"));
        },
      );

      // Ctrl+Shift+Enter → Submit answer
      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        () => {
          document.dispatchEvent(new CustomEvent("sql-lab:submit"));
        },
      );
    },
    [],
  );

  const getCode = useCallback(() => {
    return editorRef.current?.getValue() || "";
  }, []);

  const resetCode = useCallback(() => {
    editorRef.current?.setValue("-- Write your SQL query here\n");
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
      setIsRunning(false);
      setIsSuccess(true);
      setSuccessCountdown(true);
      await markCompleted(exercise.id);

      // Fire confetti immediately
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10B981", "#06B6D4", "#34D399", "#22D3EE"],
      });

      // Auto-navigate after 1.4s
      const sortedExercises = [...exercises!].sort((a, b) => a.order - b.order);
      const currentIndex = sortedExercises.findIndex(
        (e) => e.id === exercise.id,
      );
      const next = sortedExercises[currentIndex + 1];

      autoNavTimerRef.current = setTimeout(() => {
        setSuccessCountdown(false);
        setIsSuccess(false);
        if (next) {
          setLocation(`/exercise/${next.id}`);
        }
      }, 1400);

      return;
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

  // Keep refs in sync with latest handler closures
  handleRunRef.current = handleRun;
  handleSubmitRef.current = handleSubmit;

  // Listen for keyboard shortcut events dispatched from Monaco
  useEffect(() => {
    const onRun = () => handleRunRef.current();
    const onSubmit = () => handleSubmitRef.current();
    document.addEventListener("sql-lab:run", onRun);
    document.addEventListener("sql-lab:submit", onSubmit);
    return () => {
      document.removeEventListener("sql-lab:run", onRun);
      document.removeEventListener("sql-lab:submit", onSubmit);
    };
  }, []);

  console.log(loadingList, loadingDB, loadingProgress);

  if (loadingList || loadingDB) {
    return (
      <div
        className="h-screen w-full flex flex-col items-center justify-center gap-4"
        style={{
          background: "linear-gradient(180deg, #09090B 0%, #0F0F11 100%)",
        }}
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-primary border-r-primary/50" />
          <div className="absolute inset-0 rounded-full animate-pulse-glow" />
        </div>
        <p className="text-muted-foreground font-mono text-sm animate-pulse">
          Initializing SQL Engine...
        </p>
      </div>
    );
  }

  if (!exercises) return null;

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #09090B 0%, #0F0F11 50%, #09090B 100%)",
      }}
    >
      {/* ── VS Code–style Header ── */}
      <header className="h-12 border-b border-border/60 flex items-center justify-between px-3 shrink-0 glass">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex w-8 h-8 rounded-md items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-sm">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight text-foreground hidden sm:block">
              SQL Lab
            </span>
          </div>
        </div>

        {/* Center: Tab-like active file indicator */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-md bg-background/80 border border-border/40 border-b-transparent -mb-[1px] relative z-10">
            <FileCode2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono text-foreground/90">
              query.sql
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground font-mono hidden sm:flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {progress.completedExerciseIds.length}/{exercises.length} done
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40"
          >
            Home
          </Button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* ── Left Sidebar: Explorer ── */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel
                defaultSize={18}
                minSize={14}
                maxSize={28}
                className="hidden md:block"
              >
                <div
                  className="h-full flex flex-col"
                  style={{
                    background:
                      "linear-gradient(180deg, #0F0F11 0%, #09090B 100%)",
                  }}
                >
                  {/* Sidebar Header */}
                  <div className="px-4 py-3 border-b border-border/40">
                    <h2 className="font-display font-semibold text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                      Explorer
                    </h2>
                  </div>

                  {/* Exercise List */}
                  <ScrollAreaWrapper>
                    <ExerciseList
                      exercises={exercises}
                      completedIds={progress.completedExerciseIds}
                      currentId={exerciseId}
                    />
                  </ScrollAreaWrapper>

                  {/* Sidebar Footer: Progress Bar */}
                  <div className="px-4 py-3 border-t border-border/40">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span className="font-mono">
                        {Math.round(
                          (progress.completedExerciseIds.length /
                            exercises.length) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(progress.completedExerciseIds.length / exercises.length) * 100}%`,
                          background:
                            "linear-gradient(90deg, #10B981, #06B6D4)",
                          boxShadow: "0 0 8px #10B98140",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle className="hidden md:flex w-[1px] bg-border/40 hover:bg-primary/40 transition-colors duration-200" />
            </>
          )}

          {/* ── Main Content Panel ── */}
          <ResizablePanel defaultSize={sidebarCollapsed ? 100 : 82}>
            {loadingExercise || !exercise ? (
              <div
                className="h-full w-full p-8 space-y-4"
                style={{ background: "#09090B" }}
              >
                <Skeleton className="h-8 w-3/4 bg-muted/30" />
                <Skeleton className="h-4 w-1/2 bg-muted/20" />
                <Skeleton className="h-64 w-full bg-muted/20" />
              </div>
            ) : (
              <ResizablePanelGroup direction="horizontal">
                {/* ── Exercise Description & Schema ── */}
                <ResizablePanel defaultSize={38} minSize={25}>
                  <ScrollAreaWrapper
                    className=""
                    style={{
                      background:
                        "linear-gradient(180deg, #0F0F11 0%, #09090B 100%)",
                    }}
                  >
                    <div className="p-6 max-w-2xl mx-auto space-y-6">
                      {/* Exercise Header */}
                      <div className="animate-fade-in-up">
                        <div className="flex items-center gap-2.5 mb-3">
                          <Badge className="bg-primary/10 text-primary border border-primary/20 font-mono text-[11px] px-2 py-0.5 rounded-md">
                            #{exercise.order}
                          </Badge>
                          {progress.completedExerciseIds.includes(
                            exercise.id,
                          ) && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] px-2 py-0.5 rounded-md">
                              <Check className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>

                        <h1 className="text-2xl font-display font-bold text-foreground leading-tight mb-3">
                          {exercise.title}
                        </h1>

                        <div className="text-sm text-muted-foreground leading-relaxed">
                          <p>{exercise.description}</p>
                        </div>
                      </div>

                      {/* Hint Section */}
                      {exercise.hint && (
                        <div className="border-t border-border/30 pt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHint(!showHint)}
                            className="text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 h-8 text-xs gap-1.5 rounded-md transition-all duration-200"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            {showHint ? "Hide Hint" : "Show Hint"}
                          </Button>
                          <AnimatePresence>
                            {showHint && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg text-sm text-amber-200/70 italic font-mono leading-relaxed">
                                  {exercise.hint}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Schema Viewer */}
                      <div className="border-t border-border/30 pt-6">
                        <SchemaViewer />
                      </div>

                      {/* Navigation */}
                      <div className="border-t border-border/30 pt-4 flex items-center gap-2">
                        {exercise.order > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const sorted = [...exercises].sort(
                                (a, b) => a.order - b.order,
                              );
                              const idx = sorted.findIndex(
                                (e) => e.id === exercise.id,
                              );
                              if (idx > 0)
                                setLocation(`/exercise/${sorted[idx - 1].id}`);
                            }}
                            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Previous
                          </Button>
                        )}
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleNext}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                        >
                          Next
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </ScrollAreaWrapper>
                </ResizablePanel>

                <ResizableHandle className="w-[1px] bg-border/40 hover:bg-primary/40 transition-colors duration-200" />

                {/* ── Editor & Results ── */}
                <ResizablePanel defaultSize={62}>
                  <ResizablePanelGroup direction="vertical">
                    {/* ── Code Editor Panel ── */}
                    <ResizablePanel defaultSize={60} minSize={30}>
                      <div
                        className="h-full flex flex-col"
                        style={{ background: "#09090B" }}
                      >
                        {/* Editor Tab Bar */}
                        <div
                          className="h-9 border-b border-border/40 flex items-center justify-between px-3 shrink-0"
                          style={{ background: "#0F0F11" }}
                        >
                          <div className="flex items-center gap-2">
                            <FileCode2 className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[11px] font-mono text-muted-foreground">
                              query.sql
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                  onClick={resetCode}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                Reset Code
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Monaco Editor */}
                        <div className="flex-1 relative">
                          <Editor
                            height="100%"
                            defaultLanguage="sql"
                            theme="sql-lab-purple"
                            defaultValue="-- Write your SQL query here\n"
                            onMount={handleEditorMount}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              fontFamily:
                                "'JetBrains Mono', 'Fira Code', monospace",
                              fontLigatures: true,
                              padding: { top: 16 },
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                              cursorBlinking: "smooth",
                              cursorSmoothCaretAnimation: "on",
                              smoothScrolling: true,
                              renderLineHighlight: "all",
                              lineHeight: 22,
                              letterSpacing: 0.3,
                            }}
                          />
                        </div>

                        {/* Action Bar */}
                        <div
                          className="h-12 border-t border-border/40 p-2 flex items-center justify-between px-3"
                          style={{ background: "#0F0F11" }}
                        >
                          <div className="text-[11px] text-muted-foreground/80 font-mono hidden sm:block">
                            Ctrl+Enter = Run &nbsp;•&nbsp; Ctrl+Shift+Enter =
                            Submit
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRun}
                              disabled={isRunning}
                              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 gap-1.5 rounded-md transition-all duration-200"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Run
                            </Button>
                            <Button
                              onClick={handleSubmit}
                              disabled={isRunning}
                              className="h-8 px-4 text-xs font-medium rounded-md btn-glow text-white gap-1.5 transition-all duration-200"
                            >
                              {isRunning ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Submit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </ResizablePanel>

                    <ResizableHandle className="h-[1px] bg-border/40 hover:bg-primary/40 transition-colors duration-200" />

                    {/* ── Results Panel ── */}
                    <ResizablePanel defaultSize={40} minSize={15}>
                      <div
                        className="h-full flex flex-col relative"
                        style={{ background: "#09090B" }}
                      >
                        {/* Results Header */}
                        <div
                          className="h-8 border-b border-border/60 flex items-center px-3 text-[11px] font-mono text-muted-foreground uppercase tracking-wider shrink-0 justify-between"
                          style={{ background: "#0F0F11" }}
                        >
                          <div className="flex items-center gap-2">
                            <Terminal className="w-3 h-3 text-primary/80" />
                            <span>Output</span>
                          </div>
                          {result?.rows && (
                            <span className="text-primary font-mono normal-case">
                              {result.rows.length} row
                              {result.rows.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                          {/* Success Banner */}
                          <AnimatePresence>
                            {isSuccess && (
                              <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-0 left-0 right-0 z-20"
                              >
                                <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between backdrop-blur-sm">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-emerald-500/15 rounded-full flex items-center justify-center text-emerald-400">
                                      <PartyPopper className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <span className="text-sm font-semibold text-emerald-400">
                                        Correct!
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        Moving to next...
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[11px] text-muted-foreground h-6 hover:text-foreground"
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
                                {successCountdown && (
                                  <div className="h-0.5 bg-emerald-500/10 w-full overflow-hidden">
                                    <motion.div
                                      className="h-full"
                                      style={{
                                        background:
                                          "linear-gradient(90deg, #10B981, #06B6D4)",
                                      }}
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
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 gap-2">
                              <Database className="w-6 h-6" />
                              <span className="text-xs font-mono">
                                Run your query to see results
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
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`h-full w-full overflow-y-auto ${className || ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
