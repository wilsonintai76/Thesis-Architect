import * as React from 'react';
import { useEditor, EditorContent, BubbleMenu, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';

// Custom extension for Yjs History
const YjsHistory = Extension.create({
  name: 'yjsHistory',

  addOptions() {
    return {
      ydoc: null as Y.Doc | null,
    }
  },

  addStorage() {
    return {
      undoManager: null as Y.UndoManager | null,
    }
  },

  onCreate() {
    if (this.options.ydoc) {
      this.storage.undoManager = new Y.UndoManager(this.options.ydoc.getXmlFragment('prosemirror'))
    }
  },

  addCommands() {
    return {
      undo: () => ({ editor }) => {
        const canUndo = this.storage.undoManager?.canUndo()
        if (canUndo) {
          this.storage.undoManager?.undo()
        }
        return !!canUndo
      },
      redo: () => ({ editor }) => {
        const canRedo = this.storage.undoManager?.canRedo()
        if (canRedo) {
          this.storage.undoManager?.redo()
        }
        return !!canRedo
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': () => this.editor.commands.undo(),
      'Mod-y': () => this.editor.commands.redo(),
      'Mod-Shift-z': () => this.editor.commands.redo(),
    }
  },
})
import { WebsocketProvider } from 'y-websocket';
import randomColor from 'randomcolor';
import { 
  Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, 
  Underline as UnderlineIcon, Highlighter, Type, AlignLeft, 
  AlignCenter, AlignRight, BookMarked, Hash, Wand2, Users, MessageSquareQuote, History,
  Image as ImageIcon, Undo, Redo, Table as TableIcon, Columns, PlusSquare, Trash2,
  Sigma, Calculator, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Maximize2
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Citation } from '@/src/lib/extensions/Citation';
import { Footnote } from '@/src/lib/extensions/Footnote';
import { Source, DocumentVersion } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

import { EditorToolbar } from './EditorToolbar';
import { CustomHeading } from '@/src/lib/extensions/CustomHeading';
import { TableOfContents } from '@/src/lib/extensions/TableOfContents';
import { Mathematics } from '@/src/lib/extensions/Mathematics';
import { Caption } from '@/src/lib/extensions/Caption';
import { ScientificLists } from '@/src/lib/extensions/ScientificLists';

interface EditorProps {
  content: string;
  sources: Source[];
  selectedProfileId: string;
  versionToRestore?: DocumentVersion | null;
  sourceToInsert?: Source | null;
  textToInsert?: string | null;
  onInsertSourceComplete?: () => void;
  onInsertTextComplete?: () => void;
  onRestoreComplete?: () => void;
  onSelectionChange?: (text: string) => void;
  onChange: (content: any) => void;
  onAISuggest: () => void;
  onSaveVersion?: () => void;
  onOpenVersions?: () => void;
}

const colors = [
  '#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D', '#C3E2C2',
];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];
const getRandomName = () => `Researcher ${Math.floor(Math.random() * 100)}`;

export function Editor({ content, sources, selectedProfileId, versionToRestore, sourceToInsert, textToInsert, onInsertSourceComplete, onInsertTextComplete, onRestoreComplete, onSelectionChange, onChange, onAISuggest, onSaveVersion, onOpenVersions }: EditorProps) {
  const [status, setStatus] = React.useState('connecting');
  const [users, setUsers] = React.useState<any[]>([]);

  // Set up Yjs document and provider
  const [{ provider, ydoc }] = React.useState(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'wss://demos.yjs.dev',
      'lexigraph-academic-collab-room-v2',
      ydoc
    );
    return { provider, ydoc };
  });

  React.useEffect(() => {
    const handleStatus = (event: { status: string }) => {
      setStatus(event.status);
    };
    provider.on('status', handleStatus);
    
    return () => {
      provider.off('status', handleStatus);
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        history: false, // Must be disabled for collaboration
      }),
      CustomHeading.configure({
        HTMLAttributes: {
          class: 'scroll-mt-20',
        },
      }),
      Underline,
      Superscript,
      Subscript,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Begin your research paper...',
      }),
      Highlight,
      Image.configure({
        allowBase64: true,
      }),
      Citation,
      Footnote,
      CharacterCount,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: getRandomName(),
          color: getRandomColor(),
        },
      }),
      Mathematics,
      TableOfContents,
      ScientificLists,
      Caption.configure({
        HTMLAttributes: {
          class: 'academic-caption',
        },
      }),
      YjsHistory.configure({
        ydoc: ydoc,
      }),
    ],
    // Don't pass initial content when using collaboration!
    // The Y.Doc will sync the content automatically.
    // Instead of onChange for standard saving, usually we let Yjs handle the sync.
    // But we can call onChange to keep the parent updated just in case.
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    onSelectionUpdate: ({ editor }) => {
      setTimeout(() => {
        setUsers(editor.storage.collaborationCursor?.users || []);
        if (onSelectionChange) {
          const { from, to } = editor.state.selection;
          if (from !== to) {
            const text = editor.state.doc.textBetween(from, to, ' ');
            onSelectionChange(text);
          } else {
            onSelectionChange('');
          }
        }
      }, 0);
    },
    onTransaction: ({ editor }) => {
      setTimeout(() => {
        setUsers(editor.storage.collaborationCursor?.users || []);
      }, 0);
    },
    editorProps: {
      attributes: {
        class: `prose prose-zinc max-w-none focus:outline-none min-h-[500px] leading-relaxed collabo-editor style-${selectedProfileId}`,
      },
    },
  });

  // Dynamically update editor classes when profile changes
  React.useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `prose prose-zinc max-w-none focus:outline-none min-h-[500px] leading-relaxed collabo-editor style-${selectedProfileId}`,
          },
        },
      });

      // Update all caption nodes to the new style
      const { tr } = editor.state;
      let modified = false;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'caption') {
          const newStyle = selectedProfileId === 'apa' ? 'apa' : 'ieee';
          if (node.attrs.style !== newStyle) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              style: newStyle,
            });
            modified = true;
          }
        }
      });
      if (modified) {
        editor.view.dispatch(tr);
      }
    }
  }, [selectedProfileId, editor]);

  React.useEffect(() => {
    if (versionToRestore && editor) {
      editor.commands.setContent(versionToRestore.content);
      onRestoreComplete?.();
    }
  }, [versionToRestore, editor, onRestoreComplete]);

  React.useEffect(() => {
    if (sourceToInsert && editor) {
      const authorLast = sourceToInsert.authors.split(',')[0].trim();
      const label = `${authorLast}, ${sourceToInsert.year}`;
      editor.chain().focus().setCitation({ sourceId: sourceToInsert.id, label }).run();
      onInsertSourceComplete?.();
    }
  }, [sourceToInsert, editor, onInsertSourceComplete]);

  React.useEffect(() => {
    if (textToInsert && editor) {
      editor.chain().focus().insertContent(textToInsert).run();
      onInsertTextComplete?.();
    }
  }, [textToInsert, editor, onInsertTextComplete]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-slate-100 relative overflow-hidden">
      <EditorToolbar 
        editor={editor} 
        sources={sources} 
        status={status} 
        onAISuggest={onAISuggest} 
        onOpenVersions={onOpenVersions || (() => {})} 
      />

      <ScrollArea className="flex-1">
        <div className="max-w-[820px] mx-auto my-12 bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-200 p-16 sm:p-24 min-h-[1050px] relative transition-all duration-500">
          {editor && (
            <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
              <div className="flex items-center gap-0.5 p-1 bg-slate-900 border border-slate-800 rounded shadow-2xl">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-white hover:bg-slate-800"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  <Bold className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-white hover:bg-slate-800"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  <Italic className="w-3.5 h-3.5" />
                </Button>
                <Separator orientation="vertical" className="h-4 mx-0.5 bg-slate-700" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-indigo-400 hover:bg-slate-800"
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </Button>
              </div>
            </BubbleMenu>
          )}
          <EditorContent editor={editor} />
        </div>
      </ScrollArea>
      
      <div className="h-8 border-t border-slate-200 flex items-center justify-between px-6 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
        <div className="flex items-center gap-4">
          <span>Manuscript Draft</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>{editor?.storage.characterCount?.words?.() || 0} words</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>{editor?.storage.characterCount?.characters?.() || 0} chars</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="text-indigo-500">{Math.max(1, Math.ceil((editor?.storage.characterCount?.words?.() || 0) / 250))} min read</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Cloud Synced
          </span>
          <span>Style: {selectedProfileId.toUpperCase()} / {selectedProfileId === 'ieee' ? 'Sans/Serif Mix' : 'Full Serif'}</span>
        </div>
      </div>
    </div>
  );
}
