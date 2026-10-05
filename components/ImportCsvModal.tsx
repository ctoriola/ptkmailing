"use client";

import { FileUp, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { parseCsv } from "@/lib/template";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

export default function ImportCsvModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (rows: Record<string, string>[]) => void }) {
  const [text, setText] = useState("");
  const rows = useMemo(() => parseCsv(text), [text]);
  const valid = rows.filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email ?? ""));
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  function close() {
    setText("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Import recipients"
      description="Paste from a spreadsheet or upload a CSV file. Include a header row to name your fields."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            variant="primary"
            icon={Upload}
            disabled={!valid.length}
            onClick={() => {
              onImport(rows);
              close();
            }}
          >
            Import {valid.length || ""} recipient{valid.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 p-5">
        <textarea
          className="input min-h-40 font-mono text-[13px] leading-relaxed"
          value={text}
          autoFocus
          onChange={(e) => setText(e.target.value.replace(/\t/g, ","))}
          placeholder={"email,name,company\nada@example.com,Ada Obi,Acme Ltd\nbola@example.com,Bola Ade,Globex"}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted hover:text-fg">
            <FileUp className="size-4" /> Upload .csv file
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setText((await f.text()).replace(/\t/g, ","));
              }}
            />
          </label>
          {rows.length > 0 && (
            <p className="text-[13px] text-muted">
              <span className="font-medium text-fg">{valid.length}</span> valid of {rows.length} rows
              {columns.length > 0 && <> · fields: {columns.filter((c) => c !== "email").join(", ") || "none"}</>}
            </p>
          )}
        </div>
        {rows.length > 0 && (
          <div className="max-h-48 overflow-auto rounded-lg border border-line">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-panel-2 text-xs text-muted">
                <tr>{columns.map((c) => <th key={c} className="px-3 py-2 font-medium capitalize">{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    {columns.map((c) => <td key={c} className="truncate px-3 py-1.5 text-fg/90">{r[c]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
