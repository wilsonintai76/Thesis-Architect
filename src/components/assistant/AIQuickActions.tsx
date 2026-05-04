import * as React from 'react';

interface AIQuickActionsProps {
  onAction: (tool: string) => void;
}

const TOOLS = ['Rephrase', 'Expand', 'Counterarguments', 'Review tone', 'Fix citations', 'Grammar fix'];

export function AIQuickActions({ onAction }: AIQuickActionsProps) {
  return (
    <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
      {TOOLS.map((tool) => (
        <button 
          key={tool}
          onClick={() => onAction(tool)}
          className="flex-none px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 text-[9px] font-bold text-slate-500 hover:text-indigo-600 transition-all border border-slate-200/60 uppercase tracking-wider"
        >
          {tool}
        </button>
      ))}
    </div>
  );
}
