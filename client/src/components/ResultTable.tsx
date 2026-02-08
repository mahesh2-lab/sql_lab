import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

type ResultTableProps = {
  columns: string[];
  rows: any[][];
  error?: string;
  className?: string;
  affectedRows?: number;
};

export function ResultTable({
  columns,
  rows,
  error,
  className,
  affectedRows,
}: ResultTableProps) {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(key);
    setTimeout(() => setCopiedCell(null), 1200);
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="m-3 p-3.5 rounded-lg border flex items-start gap-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)",
          borderColor: "rgba(239,68,68,0.15)",
        }}
      >
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400/80" />
        <div className="whitespace-pre-wrap font-mono text-[13px] text-red-300/80 leading-relaxed">
          {error}
        </div>
      </motion.div>
    );
  }

  if (columns.length === 0 && !error) {
    if (affectedRows !== undefined) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-muted-foreground p-4 font-mono text-[13px]"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Query executed successfully.</span>
          <span className="text-emerald-400/70">
            {affectedRows} rows affected.
          </span>
        </motion.div>
      );
    }
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground/60 font-mono text-xs">
        Run a query to see results
      </div>
    );
  }

  return (
    <ScrollArea className={`h-full ${className || ""}`}>
      <div className="min-w-max">
        <table className="w-full text-[13px] text-left border-collapse">
          <thead
            className="sticky top-0 z-10"
            style={{ background: "#0F0F11" }}
          >
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider text-primary border-b border-border/60 whitespace-nowrap font-mono"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono text-[12px]">
            {rows.map((row, i) => (
              <tr
                key={i}
                className="zebra-row border-b border-border/30 hover:bg-primary/8 transition-colors duration-150"
              >
                {row.map((cell, j) => {
                  const cellKey = `${i}-${j}`;
                  return (
                    <td
                      key={j}
                      className="px-4 py-2 whitespace-nowrap max-w-[300px] truncate text-foreground/90 group relative cursor-default"
                      onClick={() =>
                        cell !== null && copyToClipboard(String(cell), cellKey)
                      }
                      title={cell !== null ? String(cell) : "NULL"}
                    >
                      {cell === null ? (
                        <span className="text-muted-foreground/70 italic text-[11px]">
                          NULL
                        </span>
                      ) : (
                        String(cell)
                      )}
                      {copiedCell === cellKey && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          copied
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
