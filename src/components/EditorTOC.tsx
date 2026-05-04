import * as React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { List, ChevronRight } from 'lucide-react';

export const EditorTOC = ({ editor }: any) => {
  const [headings, setHeadings] = React.useState<{ level: number, text: string, id: string }[]>([]);

  const handleUpdate = React.useCallback(() => {
    const list: { level: number, text: string, id: string }[] = [];

    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'heading') {
        list.push({
          level: node.attrs.level,
          text: node.textContent,
          id: node.attrs.id,
        });
      }
    });

    setHeadings(prev => {
      const currentStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(list);
      if (currentStr === nextStr) return prev;
      return list;
    });
  }, [editor]);

  React.useEffect(() => {
    handleUpdate();
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, handleUpdate]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <NodeViewWrapper className="my-8 p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-sm not-prose">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
          <List className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Table of Contents</h2>
          <p className="text-[10px] text-slate-500 font-medium mt-1 leading-none uppercase tracking-tighter">Automatic logical structure</p>
        </div>
      </div>

      {headings.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">No headings found. Add some to populate the table of contents.</p>
      ) : (
        <nav aria-label="Table of contents" className="space-y-1">
          <ul className="space-y-1">
            {headings.map((heading, index) => (
              <li 
                key={`${heading.id}-${index}`}
                style={{ paddingLeft: `${(heading.level - 1) * 1.5}rem` }}
                className="group"
              >
                <button
                  type="button"
                  onClick={() => scrollToHeading(heading.id)}
                  className="flex items-center gap-2 w-full text-left py-1 hover:text-indigo-600 transition-colors"
                >
                  <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                  <span className={`text-[12px] ${heading.level === 1 ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                    {heading.text || 'Untitled Section'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </NodeViewWrapper>
  );
};
