import { X } from "lucide-react";

export function Modal({ children, onClose, title, maxWidth = "max-w-lg" }: { children: React.ReactNode; onClose: () => void; title: string; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className={`bg-surface border border-border rounded-2xl w-full ${maxWidth} shadow-xl overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 h-11 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
    />
  );
}
