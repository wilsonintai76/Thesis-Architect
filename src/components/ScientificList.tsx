import * as React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { List, ChevronRight, Image, Table, Sigma, Hash } from 'lucide-react';

export const ScientificList = ({ editor, node }: any) => {
  const { type } = node.attrs;
  const [items, setItems] = React.useState<{ number: string, text: string, pos: number }[]>([]);

  const handleUpdate = React.useCallback(() => {
    const list: { number: string, text: string, pos: number }[] = [];

    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'caption' && node.attrs.type === type) {
        list.push({
          number: node.attrs.number,
          text: node.textContent || 'Untitled',
          pos: pos,
        });
      }
    });

    // Only update if the stringified content actually changed to avoid render loops
    setItems(prev => {
      const currentStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(list);
      if (currentStr === nextStr) return prev;
      return list;
    });
  }, [editor, type]);

  React.useEffect(() => {
    handleUpdate();
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, handleUpdate]);

  const scrollToPosition = (pos: number) => {
    editor.commands.focus(pos);
    const element = editor.view.nodeDOM(pos) as HTMLElement;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'figure': return <Image className="w-4 h-4" />;
      case 'table': return <Table className="w-4 h-4" />;
      case 'equation': return <Sigma className="w-4 h-4" />;
      default: return <List className="w-4 h-4" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'figure': return 'List of Figures';
      case 'table': return 'List of Tables';
      case 'equation': return 'List of Equations';
      case 'symbol': return 'List of Symbols';
      default: return 'Scientific List';
    }
  };

  return (
    <NodeViewWrapper className="my-8 p-6 bg-white border border-indigo-100 rounded-xl shadow-sm not-prose">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          {getIcon()}
        </div>
        <div>
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">{getTitle()}</h2>
          <p className="text-[10px] text-slate-500 font-medium mt-1 leading-none uppercase tracking-tighter">Dynamically synchronized indices</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">No {type === 'figure' ? 'figures' : type + 's'} found in manuscript.</p>
      ) : (
        <nav className="space-y-1">
          {items.map((item, index) => (
            <button
              key={`${type}-${item.number}-${index}`}
              type="button"
              onClick={() => scrollToPosition(item.pos)}
              className="flex items-center justify-between w-full group py-1.5 border-b border-dotted border-slate-100 last:border-0 hover:bg-indigo-50/30 px-2 rounded -mx-2 transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-[11px] font-black text-indigo-600 tabular-nums shrink-0">{item.number}</span>
                <span className="text-[12px] font-medium text-slate-700 truncate group-hover:text-slate-900">{item.text}</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </button>
          ))}
        </nav>
      )}
    </NodeViewWrapper>
  );
};
