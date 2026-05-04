import * as React from 'react';
import { Type, AlignLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OutlineProps {
  content: any;
  onNavigate: (headingId: string) => void;
}

export function Outline({ content, onNavigate }: OutlineProps) {
  const extractHeadings = (node: any): any[] => {
    if (!node || !node.content) return [];
    
    return node.content
      .filter((n: any) => n.type === 'heading')
      .map((n: any) => ({
        level: n.attrs.level,
        text: n.content?.[0]?.text || 'Untitled Section',
        id: n.attrs.id || Math.random().toString(36).substring(7)
      }));
  };

  const headings = extractHeadings(content);

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] border-r border-slate-200 w-64 shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manuscript Outline</h2>
        <p className="text-[9px] text-slate-500 italic">Navigate sections</p>
      </div>
      
      <ScrollArea className="flex-1 px-2">
        <div className="py-4 space-y-0.5">
          {headings.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              <Type className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-[11px] font-medium leading-relaxed italic">No headings found in your draft yet.</p>
            </div>
          ) : (
            headings.map((heading, i) => (
              <button
                key={i}
                onClick={() => onNavigate(heading.id)}
                className={`w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-200/50 transition-colors group ${
                  heading.level === 1 ? 'mt-3 mb-1' : ''
                }`}
              >
                <div className={`flex-none flex items-center justify-center ${
                  heading.level === 1 ? 'text-indigo-600' : 'text-slate-400 pl-4'
                }`}>
                  <ChevronRight className={`w-3 h-3 transition-transform group-hover:translate-x-0.5 ${
                    heading.level === 1 ? 'opacity-100' : 'opacity-50'
                  }`} />
                </div>
                <span className={`truncate ${
                  heading.level === 1 
                    ? 'text-[11px] font-bold uppercase tracking-tight text-slate-900' 
                    : 'text-[11px] font-medium text-slate-600'
                }`}>
                  {heading.text}
                </span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="mt-auto p-4 border-t border-slate-200">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Editor Preferences</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
              <span>Serif Focus</span>
              <span className="text-indigo-600">Active</span>
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
              <span>Smart Punctuation</span>
              <span className="text-indigo-600">On</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
