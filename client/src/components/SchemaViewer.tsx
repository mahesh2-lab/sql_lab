import { Database, Table } from "lucide-react";

type SchemaColumn = {
  name: string;
  type: string;
};

type SchemaTable = {
  name: string;
  columns: SchemaColumn[];
};

// Hardcoded for demo - in a real app, this could be parsed from setupSql or fetched via API
// Based on the typical SQL bolt/zoo schemas often used for learning
const MOCK_SCHEMA: SchemaTable[] = [
  {
    name: "users",
    columns: [
      { name: "id", type: "integer" },
      { name: "username", type: "text" },
      { name: "email", type: "text" },
      { name: "created_at", type: "timestamp" },
    ]
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "integer" },
      { name: "user_id", type: "integer" },
      { name: "total", type: "numeric" },
      { name: "status", type: "text" },
    ]
  }
];

export function SchemaViewer() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
        <Database className="w-3 h-3" /> Database Schema
      </div>
      
      {MOCK_SCHEMA.map((table) => (
        <div key={table.name} className="border border-border rounded-md overflow-hidden bg-card/50">
          <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
            <Table className="w-4 h-4 text-primary" />
            <span className="font-mono text-sm font-semibold">{table.name}</span>
          </div>
          <div className="p-2 space-y-1">
            {table.columns.map((col) => (
              <div key={col.name} className="flex justify-between text-xs font-mono px-1 py-0.5 rounded hover:bg-muted/50">
                <span className="text-foreground">{col.name}</span>
                <span className="text-muted-foreground">{col.type}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
