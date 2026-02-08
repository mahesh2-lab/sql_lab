import { Database, Table, Key, Hash } from "lucide-react";

type SchemaColumn = {
  name: string;
  type: string;
};

type SchemaTable = {
  name: string;
  columns: SchemaColumn[];
};

// Hardcoded for demo - in a real app, this could be parsed from setupSql or fetched via API
// Matches the schema defined in exercises.ts
const MOCK_SCHEMA: SchemaTable[] = [
  {
    name: "users",
    columns: [
      { name: "id", type: "integer" },
      { name: "name", type: "text" },
      { name: "age", type: "integer" },
      { name: "city", type: "text" },
      { name: "email", type: "text" },
    ],
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "integer" },
      { name: "user_id", type: "integer" },
      { name: "amount", type: "integer" },
      { name: "item", type: "text" },
      { name: "order_date", type: "date" },
    ],
  },
];

function getTypeIcon(type: string) {
  if (type === "integer") return <Hash className="w-3 h-3 text-amber-400" />;
  return (
    <span className="text-[9px] text-primary/80 font-mono uppercase">
      {type.slice(0, 3)}
    </span>
  );
}

export function SchemaViewer() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-display font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
        <Database className="w-3 h-3" /> Database Schema
      </div>

      {MOCK_SCHEMA.map((table) => (
        <div
          key={table.name}
          className="rounded-lg overflow-hidden border border-border/30"
          style={{
            background:
              "linear-gradient(180deg, rgba(24,24,27,0.5) 0%, rgba(9,9,11,0.5) 100%)",
          }}
        >
          {/* Table header */}
          <div
            className="px-3 py-2 border-b border-border/25 flex items-center gap-2"
            style={{ background: "rgba(16,185,129,0.05)" }}
          >
            <Table className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-[13px] font-semibold text-foreground">
              {table.name}
            </span>
            <span className="text-[10px] text-muted-foreground/70 ml-auto font-mono">
              {table.columns.length} cols
            </span>
          </div>

          {/* Columns */}
          <div className="p-1">
            {table.columns.map((col, idx) => (
              <div
                key={col.name}
                className="flex items-center justify-between text-[12px] font-mono px-2.5 py-1.5 rounded-md hover:bg-primary/10 transition-colors duration-150 group"
              >
                <div className="flex items-center gap-2">
                  {col.name === "id" ? (
                    <Key className="w-3 h-3 text-amber-400" />
                  ) : (
                    <span className="w-3 h-3 flex items-center justify-center">
                      {getTypeIcon(col.type)}
                    </span>
                  )}
                  <span className="text-foreground/90 group-hover:text-foreground transition-colors">
                    {col.name}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">
                  {col.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
