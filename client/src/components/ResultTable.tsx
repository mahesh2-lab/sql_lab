import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

type ResultTableProps = {
  columns: string[];
  rows: any[][];
  error?: string;
  className?: string;
  affectedRows?: number;
};

export function ResultTable({ columns, rows, error, className, affectedRows }: ResultTableProps) {
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive font-mono text-sm flex items-start gap-3"
      >
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="whitespace-pre-wrap">{error}</div>
      </motion.div>
    );
  }

  if (columns.length === 0 && !error) {
    if (affectedRows !== undefined) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground p-4 font-mono text-sm">
           <CheckCircle2 className="w-4 h-4 text-green-500" /> Query executed successfully. {affectedRows} rows affected.
        </div>
      );
    }
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm">
        Run a query to see results
      </div>
    );
  }

  return (
    <ScrollArea className={`h-full border rounded-md bg-background ${className}`}>
      <div className="min-w-max">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 font-mono">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 font-medium border-b border-r last:border-r-0 border-border whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {rows.map((row, i) => (
              <tr 
                key={i} 
                className="bg-card hover:bg-muted/30 transition-colors border-b last:border-b-0 border-border/50"
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 border-r last:border-r-0 border-border/50 whitespace-nowrap max-w-[300px] truncate">
                    {cell === null ? <span className="text-muted-foreground italic">NULL</span> : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
