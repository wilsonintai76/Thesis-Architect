import * as React from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import randomColor from 'randomcolor';
import { 
  Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, 
  Underline as UnderlineIcon, Highlighter, Type, AlignLeft, 
  AlignCenter, AlignRight, BookMarked, Hash, Wand2, Users, MessageSquareQuote, History,
  Image as ImageIcon
} from 'lucide-react';
import { Citation } from '@/src/lib/extensions/Citation';
import { Footnote } from '@/src/lib/extensions/Footnote';
import { Source, DocumentVersion } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

import { CustomHeading } from '@/src/lib/extensions/CustomHeading';

interface EditorProps {
  content: string;
  sources: Source[];
  versionToRestore?: DocumentVersion | null;
  sourceToInsert?: Source | null;
  textToInsert?: string | null;
  onInsertSourceComplete?: () => void;
  onInsertTextComplete?: () => void;
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

export function Editor({ content, sources, versionToRestore, sourceToInsert, textToInsert, onInsertSourceComplete, onInsertTextComplete, onSelectionChange, onChange, onAISuggest, onSaveVersion, onOpenVersions }: EditorProps) {
  const [status, setStatus] = React.useState('connecting');
  const [users, setUsers] = React.useState<any[]>([]);
  const [footnoteContent, setFootnoteContent] = React.useState('');
  const [isFootnotePopoverOpen, setIsFootnotePopoverOpen] = React.useState(false);

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
        class: 'prose prose-zinc max-w-none focus:outline-none min-h-[500px] font-serif leading-relaxed collabo-editor',
      },
    },
  });

  React.useEffect(() => {
    if (versionToRestore && editor) {
      editor.commands.setContent(versionToRestore.content);
    }
  }, [versionToRestore, editor]);

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

  const insertCitation = (source: Source) => {
    const authorLast = source.authors.split(',')[0].trim();
    const label = `${authorLast}, ${source.year}`;
    editor.chain().focus().setCitation({ sourceId: source.id, label }).run();
  };

  const insertFootnote = () => {
    if (!footnoteContent.trim() || !editor) return;
    const id = Math.random().toString(36).substr(2, 9);
    editor.chain().focus().setFootnote({ id, content: footnoteContent, number: 0 }).run();
    setFootnoteContent('');
    setIsFootnotePopoverOpen(false);
  };

  const addImage = () => {
    const url = window.prompt('Enter Image URL:');
    const title = window.prompt('Enter Figure Caption:');
    if (url) {
      editor.chain().focus().setImage({ src: url, title: title || undefined }).run();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-200 relative overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center justify-between p-2 border-b border-slate-300 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-8 h-8 ${editor.isActive('bold') ? 'bg-slate-100 text-indigo-600' : 'text-slate-600'}`}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-8 h-8 ${editor.isActive('italic') ? 'bg-slate-100 text-indigo-600' : 'text-slate-600'}`}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`w-8 h-8 ${editor.isActive('underline') ? 'bg-slate-100 text-indigo-600' : 'text-slate-600'}`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`w-8 h-8 ${editor.isActive('highlight') ? 'bg-slate-100 text-indigo-600' : 'text-slate-600'}`}
          >
            <Highlighter className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-4 mx-1 bg-slate-200" />
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`w-8 h-8 ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-100 text-indigo-600' : 'text-slate-600'}`}
          >
            <span className="font-bold text-[10px]">H1</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`w-8 h-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-100 text-indigo-600' : 'text-slate-600'}`}
          >
            <span className="font-bold text-[10px]">H2</span>
          </Button>
          
          <Separator orientation="vertical" className="h-4 mx-1 bg-slate-200" />
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-8 h-8 ${editor.isActive('bulletList') ? 'bg-slate-100 text-indigo-600' : 'text-slate-600'}`}
          >
            <List className="w-4 h-4" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={addImage}
            className="w-8 h-8 text-slate-600 hover:text-indigo-600"
            title="Insert Figure"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-1 bg-slate-200" />

          <Popover>
            <PopoverTrigger render={
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 px-3"
              >
                <BookMarked className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Cite</span>
              </Button>
            } />
            <PopoverContent className="w-64 p-0 shadow-2xl border-slate-200" align="start">
              <div className="p-3 border-b border-slate-100 bg-slate-50/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect Evidence</p>
              </div>
              <ScrollArea className="h-48">
                <div className="p-1">
                  {sources.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      No research entries available.
                    </div>
                  ) : (
                    sources.map((s) => (
                      <button
                        key={s.id}
                        className="w-full text-left p-3 rounded-md hover:bg-indigo-50/50 transition-colors group"
                        onClick={() => insertCitation(s)}
                      >
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{s.authors.split(',')[0]} ({s.year})</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1 italic">{s.title}</p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Popover open={isFootnotePopoverOpen} onOpenChange={setIsFootnotePopoverOpen}>
            <PopoverTrigger render={
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 px-3"
              >
                <MessageSquareQuote className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Footnote</span>
              </Button>
            } />
            <PopoverContent className="w-72 p-0 shadow-2xl border-slate-200" align="start">
              <div className="p-3 border-b border-slate-100 bg-slate-50/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Footnote</p>
              </div>
              <div className="p-3">
                <Input
                  autoFocus
                  placeholder="Enter footnote text..."
                  value={footnoteContent}
                  onChange={(e) => setFootnoteContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      insertFootnote();
                    }
                  }}
                  className="text-xs h-8 text-slate-800"
                />
                <Button 
                  size="sm" 
                  className="w-full mt-2 h-8 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold"
                  onClick={insertFootnote}
                >
                  Insert Footnote
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Users */}
          <div className="flex -space-x-2 mr-4">
            {users.slice(0, 5).map((user, index) => (
              <div 
                key={user.clientId} 
                className="w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-800"
                style={{ backgroundColor: user.color || '#e2e8f0' }}
                title={user.name}
              >
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-600">
                +{users.length - 5}
              </div>
            )}
          </div>
          
          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full mr-2 ${status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400'}`} title={status}></div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-indigo-600 h-8 gap-2"
            onClick={onOpenVersions}
          >
            <History className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">History</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-slate-600 h-8 gap-2"
          >
            <Hash className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Word Count</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-8 shadow-sm px-4"
            onClick={onAISuggest}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Analysis</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-[580px] mx-auto my-12 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-300 p-20 min-h-[850px] relative">
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
          <span>Style: Academic / Serif</span>
        </div>
      </div>
    </div>
  );
}
