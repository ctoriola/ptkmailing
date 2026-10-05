"use client";

type Props = {
  subject: string;
  body: string;
  onChange: (next: { subject: string; body: string }) => void;
  fields: string[];
  compact?: boolean;
};

export default function TemplateEditor({ subject, body, onChange, fields, compact }: Props) {
  return (
    <div className="space-y-2">
      <input
        className="input"
        placeholder="Subject, e.g. Your documents from Primetek, {{name}}"
        value={subject}
        onChange={(e) => onChange({ subject: e.target.value, body })}
      />
      <textarea
        className="input font-mono"
        rows={compact ? 5 : 9}
        placeholder={"Dear {{name}},\n\nPlease find attached…"}
        value={body}
        onChange={(e) => onChange({ subject, body: e.target.value })}
      />
      <p className="text-xs text-slate-500">
        Placeholders: {["email", ...fields].map((f) => <code key={f} className="mr-2 rounded bg-slate-100 px-1">{`{{${f}}}`}</code>)}
      </p>
    </div>
  );
}
