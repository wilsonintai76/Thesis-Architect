import * as React from 'react';
import { Editor as TiptapEditor } from '@tiptap/react';
import { 
  Bold, Italic, List, Link as LinkIcon, 
  Underline as UnderlineIcon, Highlighter, BookMarked, Sigma, 
  Calculator, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Image as ImageIcon, Undo, Redo, MessageSquareQuote, History, Wand2,
  LayoutList, Table, Hash, Plus
} from 'lucide-react';
import katex from 'katex';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Source } from '@/src/types';

const COMMON_EQUATIONS = [
  { name: 'Area of Circle', latex: 'A = \\pi r^2', desc: 'Calculates circle area' },
  { name: 'Binomial Theorem', latex: '(x+a)^n = \\sum_{k=0}^n \\binom{n}{k} x^k a^{n-k}', desc: 'Expansion of powers' },
  { name: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2', desc: 'Right triangle sides' },
  { name: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', desc: 'Solves quadratic eq' },
  { name: 'Euler\'s Identity', latex: 'e^{i\\pi} + 1 = 0', desc: 'Fundamental relation' },
  { name: 'Taylor Series', latex: 'f(x) = f(a) + f\'(a)(x-a) + \\frac{f\'\'(a)}{2!}(x-a)^2 + \\dots', desc: 'Function approximation' },
  { name: 'Relativity', latex: 'E = mc^2', desc: 'Mass-energy equivalence' },
  { name: 'Fourier Series', latex: 'f(x) = a_0 + \\sum_{n=1}^\\infty (a_n \\cos \\frac{n\\pi x}{L} + b_n \\sin \\frac{n\\pi x}{L})', desc: 'Periodic functions' },
];

const SYMBOL_CATEGORIES = [
  {
    name: 'Greek',
    symbols: [
      { s: 'α', l: '\\alpha' }, { s: 'β', l: '\\beta' }, { s: 'γ', l: '\\gamma' }, 
      { s: 'δ', l: '\\delta' }, { s: 'ε', l: '\\epsilon' }, { s: 'θ', l: '\\theta' },
      { s: 'λ', l: '\\lambda' }, { s: 'μ', l: '\\mu' }, { s: 'π', l: '\\pi' }, 
      { s: 'σ', l: '\\sigma' }, { s: 'ω', l: '\\omega' }, { s: 'Δ', l: '\\Delta' },
      { s: 'Σ', l: '\\Sigma' }, { s: 'Λ', l: '\\Lambda' }, { s: 'Ω', l: '\\Omega' },
      { s: 'φ', l: '\\phi' }, { s: 'ψ', l: '\\psi' }, { s: 'ζ', l: '\\zeta' },
      { s: 'η', l: '\\eta' }, { s: 'κ', l: '\\kappa' }, { s: 'ρ', l: '\\rho' },
      { s: 'τ', l: '\\tau' }, { s: 'χ', l: '\\chi' }, { s: 'ν', l: '\\nu' }
    ]
  },
  {
    name: 'Operators',
    symbols: [
      { s: 'Σ', l: '\\sum_{i=0}^{n}' }, { s: '∫', l: '\\int' }, { s: '∬', l: '\\iint' },
      { s: '∂', l: '\\partial' }, { s: '∇', l: '\\nabla' }, { s: '√', l: '\\sqrt{}' },
      { s: '∞', l: '\\infty' }, { s: '±', l: '\\pm' }, { s: '×', l: '\\times' },
      { s: '÷', l: '\\div' }, { s: '∏', l: '\\prod' }, { s: '∯', l: '\\oiint' },
      { s: '⊕', l: '\\oplus' }, { s: '⊗', l: '\\otimes' }, { s: '⊙', l: '\\odot' },
      { s: '∧', l: '\\wedge' }, { s: '∨', l: '\\vee' }, { s: '¬', l: '\\neg' }
    ]
  },
  {
    name: 'Logic',
    symbols: [
      { s: '≈', l: '\\approx' }, { s: '≠', l: '\\neq' }, { s: '≤', l: '\\leq' },
      { s: '≥', l: '\\geq' }, { s: '→', l: '\\rightarrow' }, { s: '⇒', l: '\\Rightarrow' },
      { s: '≡', l: '\\equiv' }, { s: '∈', l: '\\in' }, { s: '⊂', l: '\\subset' },
      { s: '∀', l: '\\forall' }, { s: '∃', l: '\\exists' }, { s: '∝', l: '\\propto' },
      { s: '⊥', l: '\\perp' }, { s: '∠', l: '\\angle' }, { s: '∴', l: '\\therefore' },
      { s: '∵', l: '\\because' }, { s: '≅', l: '\\cong' }, { s: '∼', l: '\\sim' }
    ]
  }
];

interface EditorToolbarProps {
  editor: TiptapEditor;
  sources: Source[];
  status: string;
  onAISuggest: () => void;
  onOpenVersions: () => void;
}

export function EditorToolbar({ editor, sources, status, onAISuggest, onOpenVersions }: EditorToolbarProps) {
  const [footnoteContent, setFootnoteContent] = React.useState('');
  const [isFootnotePopoverOpen, setIsFootnotePopoverOpen] = React.useState(false);
  const [latexInput, setLatexInput] = React.useState('');
  const [latexPreview, setLatexPreview] = React.useState('');
  const [isMathPopoverOpen, setIsMathPopoverOpen] = React.useState(false);

  // Update preview whenever input changes
  React.useEffect(() => {
    if (latexInput) {
      try {
        const html = katex.renderToString(latexInput, {
          throwOnError: false,
          displayMode: true,
        });
        setLatexPreview(html);
      } catch (e) {
        setLatexPreview('<span class="text-rose-500 italic text-[10px]">Invalid LaTeX syntax</span>');
      }
    } else {
      setLatexPreview('');
    }
  }, [latexInput]);

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertInternalLink = (id: string) => {
    editor.chain().focus().extendMarkRange('link').setLink({ href: `#${id}` }).run();
  };

  const getHeadings = () => {
    const headings: { id: string; text: string; level: number }[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'heading' && node.attrs.id) {
        headings.push({
          id: node.attrs.id,
          text: node.textContent || 'Untitled Section',
          level: node.attrs.level,
        });
      }
    });
    return headings;
  };

  const insertCitation = (source: Source) => {
    const authorLast = source.authors.split(',')[0].trim();
    const label = `${authorLast}, ${source.year}`;
    editor.chain().focus().setCitation({ sourceId: source.id, label }).run();
  };

  const insertFootnote = () => {
    if (!footnoteContent.trim()) return;
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
    <div className="sticky top-0 z-10 flex items-center justify-between p-1.5 md:p-2 border-b border-slate-200 bg-white shadow-sm gap-2 min-h-[52px]">
      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap flex-1 overflow-visible">
        {/* History Group */}
        <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/60 shadow-sm gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="w-8 h-8 md:w-9 md:h-9 text-slate-500 hover:text-indigo-600 disabled:opacity-20 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="w-8 h-8 md:w-9 md:h-9 text-slate-500 hover:text-indigo-600 disabled:opacity-20 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
        </div>

        {/* Typography & Formatting */}
        <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/60 shadow-sm gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('bold') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('italic') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('underline') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>

          <Separator orientation="vertical" className="h-4 mx-0.5" />

          <Popover>
            <PopoverTrigger render={(props) => (
              <Button
                {...props}
                size="icon"
                variant="ghost"
                className={`w-8 h-8 md:w-9 md:h-9 rounded-lg transition-all ${
                  editor.isActive('superscript') || editor.isActive('subscript') || editor.isActive('highlight') 
                  ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Advanced Formatting"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )} />
            <PopoverContent className="w-48 p-1 shadow-2xl border-slate-200 rounded-xl" align="start">
              <div className="p-2 border-b border-slate-100 bg-slate-50/80 mb-1 rounded-t-lg">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Extended Formatting</p>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`justify-start h-8 text-[11px] font-bold w-full ${editor.isActive('superscript') ? 'text-indigo-600 bg-indigo-50/50' : ''}`}
                  onClick={() => editor.chain().focus().toggleSuperscript().run()}
                >
                  <SuperscriptIcon className="w-3.5 h-3.5 mr-2" /> Superscript
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`justify-start h-8 text-[11px] font-bold w-full ${editor.isActive('subscript') ? 'text-indigo-600 bg-indigo-50/50' : ''}`}
                  onClick={() => editor.chain().focus().toggleSubscript().run()}
                >
                  <SubscriptIcon className="w-3.5 h-3.5 mr-2" /> Subscript
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`justify-start h-8 text-[11px] font-bold w-full ${editor.isActive('highlight') ? 'text-indigo-600 bg-indigo-50/50' : ''}`}
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                >
                  <Highlighter className="w-3.5 h-3.5 mr-2" /> Highlight
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Separator orientation="vertical" className="h-6 hidden lg:block bg-slate-200" />

        {/* Layout & Structure */}
        <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/60 shadow-sm gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            title="Heading 1"
          >
            <span className="font-black text-[10px] md:text-xs tracking-tighter">H1</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            title="Heading 2"
          >
            <span className="font-black text-[10px] md:text-xs tracking-tighter">H2</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('bulletList') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            title="Bullet List"
          >
            <List className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 hidden lg:block bg-slate-200" />

        {/* References & Links */}
        <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/60 shadow-sm gap-0.5">
          <Popover>
            <PopoverTrigger render={(props) => (
              <Button
                {...props}
                size="icon"
                variant="ghost"
                className={`w-8 h-8 md:w-9 md:h-9 rounded-lg transition-all ${editor.isActive('link') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                title="Hyperlinks & Anchors"
              >
                <LinkIcon className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )} />
            <PopoverContent className="w-72 p-0 shadow-2xl border-slate-200 rounded-xl overflow-hidden" align="start">
              <div className="p-3 border-b border-slate-100 bg-slate-50/80">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Internal & External Links</p>
              </div>
              <div className="p-2 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start h-8 text-[11px] font-bold border-indigo-100 hover:bg-indigo-50"
                  onClick={setLink}
                >
                  <LinkIcon className="w-3.5 h-3.5 mr-2 text-indigo-500" /> External URL...
                </Button>
                
                <Separator />
                
                <p className="px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-2">Section Navigation</p>
                <ScrollArea className="h-40">
                  <div className="space-y-0.5 p-1">
                    {getHeadings().length === 0 ? (
                       <p className="text-[10px] text-slate-400 italic p-2 text-center">No headings found</p>
                    ) : (
                      getHeadings().map((h) => (
                        <Button
                          key={h.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-8 text-[11px] font-medium truncate"
                          onClick={() => insertInternalLink(h.id)}
                        >
                          <span className={`w-1 h-1 rounded-full mr-2 ${h.level === 1 ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                          {h.text}
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={addImage}
            className="w-8 h-8 md:w-9 md:h-9 text-slate-500 hover:text-slate-900 rounded-lg transition-all"
            title="Insert Figure/Image"
          >
            <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <Popover>
            <PopoverTrigger render={(props) => (
              <Button
                {...props}
                variant="ghost"
                size="icon"
                className="w-8 h-8 md:w-9 md:h-9 text-slate-500 hover:text-slate-900 rounded-lg transition-all data-[state=open]:bg-white data-[state=open]:text-indigo-600 data-[state=open]:shadow-sm"
                title="Academic Citations"
              >
                <BookMarked className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )} />
            <PopoverContent className="w-64 p-1 shadow-2xl border-slate-200 rounded-xl" align="start">
              <div className="p-2 border-b border-slate-100 bg-slate-50/80 mb-1 rounded-t-lg">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Source Integration</p>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                <Popover>
                  <PopoverTrigger render={(props) => (
                    <Button {...props} variant="ghost" size="sm" className="justify-start h-9 text-[11px] font-bold w-full">
                      <Plus className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Insert Citation
                    </Button>
                  )} />
                  <PopoverContent className="w-72 p-0 shadow-2xl border-slate-200 ml-1" align="start">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/80">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Library Source</p>
                    </div>
                    <ScrollArea className="h-48">
                      <div className="p-1">
                        {sources.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 italic">No research entries found.</div>
                        ) : (
                          sources.map((s) => (
                            <button key={s.id} className="w-full text-left p-3 rounded-md hover:bg-indigo-50/50 transition-colors group border-b border-slate-50 last:border-0" onClick={() => insertCitation(s)}>
                              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-700">{s.authors.split(',')[0]} ({s.year})</p>
                              <p className="text-[10px] text-slate-500 line-clamp-1 italic">{s.title}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                
                <Popover open={isFootnotePopoverOpen} onOpenChange={setIsFootnotePopoverOpen}>
                  <PopoverTrigger render={(props) => (
                    <Button {...props} variant="ghost" size="sm" className="justify-start h-9 text-[11px] font-bold">
                      <MessageSquareQuote className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Add Footnote
                    </Button>
                  )} />
                  <PopoverContent className="w-72 p-3 shadow-2xl border-slate-200 rounded-xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Supplement Note</p>
                    <textarea
                      placeholder="Enter supplemental information..."
                      className="w-full h-24 p-3 text-xs border border-slate-200 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-100 outline-none resize-none bg-slate-50"
                      value={footnoteContent}
                      onChange={(e) => setFootnoteContent(e.target.value)}
                    />
                    <Button 
                      className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-wider rounded-lg shadow-sm"
                      onClick={insertFootnote}
                      disabled={!footnoteContent.trim()}
                    >
                      Insert Footnote
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Separator orientation="vertical" className="h-6 hidden lg:block bg-slate-200" />

        {/* Scientific Tools */}
        <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/60 shadow-sm gap-0.5">
          <Popover open={isMathPopoverOpen} onOpenChange={setIsMathPopoverOpen}>
            <PopoverTrigger render={(props) => (
              <Button
                {...props}
                size="icon"
                variant="ghost"
                className="w-8 h-8 md:w-9 md:h-9 text-slate-500 hover:text-slate-900 rounded-lg transition-all data-[state=open]:bg-white data-[state=open]:text-indigo-600 data-[state=open]:shadow-sm"
                title="Mathematics & Symbols"
              >
                <Sigma className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )} />
            <PopoverContent className="w-[480px] max-w-[95vw] p-0 shadow-2xl border-slate-200 overflow-hidden rounded-2xl" align="start">
              <div className="p-4 border-b border-slate-100 bg-slate-50/80">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Scientific typesetting</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Insert formulas, symbols and notations</p>
              </div>
              
              <Tabs defaultValue="math" className="w-full">
                <TabsList className="flex w-full h-10 bg-slate-50/50 p-1 border-b border-slate-100 rounded-none">
                  <TabsTrigger value="math" className="flex-1 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 h-8">LaTeX Equations</TabsTrigger>
                  <TabsTrigger value="symbols" className="flex-1 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 h-8">Symbol Browser</TabsTrigger>
                </TabsList>

                <TabsContent value="math" className="m-0">
                  <div className="grid grid-cols-2 h-[380px]">
                    <div className="border-r border-slate-100 p-1 flex flex-col">
                      <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                          <p className="px-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Equation Gallery</p>
                          {COMMON_EQUATIONS.map((eq) => (
                            <Button 
                              key={eq.name} 
                              variant="ghost" 
                              className="w-full h-auto py-2.5 px-3 flex flex-col items-start gap-1 justify-center hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 group transition-all text-left" 
                              onClick={() => { setLatexInput(eq.latex); }}
                            >
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600">{eq.name}</span>
                              <code className="text-indigo-500 font-mono text-[9px] opacity-60 truncate w-full">{eq.latex}</code>
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="p-4 flex flex-col bg-slate-50/30">
                      <div className="flex-1 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expression</label>
                          <textarea
                            placeholder="e.g. \int_{a}^{b} x^2 dx"
                            value={latexInput}
                            onChange={(e) => setLatexInput(e.target.value)}
                            className="w-full min-h-[120px] text-[13px] p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none resize-none font-mono bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Render Preview</label>
                          <div className="w-full min-h-[100px] p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-auto shadow-inner" dangerouslySetInnerHTML={{ __html: latexPreview || '<span class="text-slate-300 italic text-[11px]">Preview...</span>' }} />
                        </div>
                      </div>
                      <Button 
                        className="w-full h-10 mt-4 bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100" 
                        disabled={!latexInput.trim()} 
                        onClick={() => { editor.chain().focus().setMathematics({ latex: latexInput }).run(); setLatexInput(''); setIsMathPopoverOpen(false); }}
                      >
                        Insert Object
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="symbols" className="m-0">
                  <div className="p-4 h-[380px] flex flex-col">
                    <Tabs defaultValue="Greek" className="flex-1 flex flex-col min-h-0">
                      <TabsList className="w-full h-8 bg-slate-100/50 p-1 mb-4">
                        {SYMBOL_CATEGORIES.map(cat => (
                          <TabsTrigger key={cat.name} value={cat.name} className="flex-1 text-[9px] font-black uppercase tracking-tight h-6">{cat.name}</TabsTrigger>
                        ))}
                      </TabsList>
                      {SYMBOL_CATEGORIES.map(cat => (
                        <TabsContent key={cat.name} value={cat.name} className="flex-1 m-0 min-h-0 overflow-hidden">
                          <ScrollArea className="h-full pr-4">
                            <div className="grid grid-cols-8 gap-1.5 pb-4">
                              {cat.symbols.map((item) => (
                                <Button
                                  key={item.s}
                                  variant="outline"
                                  className="h-10 w-full p-0 text-lg hover:bg-indigo-50 hover:text-indigo-600 border-slate-100 hover:border-indigo-200 transition-all font-serif shadow-none"
                                  title={item.l}
                                  onClick={() => {
                                    if (item.l.startsWith('\\')) {
                                      editor.chain().focus().setMathematics({ latex: item.l }).run();
                                    } else {
                                      editor.chain().focus().insertContent(item.s).run();
                                    }
                                  }}
                                >
                                  {item.s}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      ))}
                    </Tabs>
                    <div className="pt-3 border-t border-slate-100 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Tip: Tap symbol to insert at caret</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger render={(props) => (
              <Button
                {...props}
                size="icon"
                variant="ghost"
                className="w-8 h-8 md:w-9 md:h-9 text-slate-500 hover:text-slate-900 rounded-lg transition-all data-[state=open]:bg-white data-[state=open]:text-indigo-600 data-[state=open]:shadow-sm"
                title="Scientific Indices (LOF/LOT/LOE)"
              >
                <LayoutList className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )} />
            <PopoverContent className="w-64 p-1 shadow-2xl border-slate-200 rounded-xl" align="start">
              <div className="p-2 border-b border-slate-100 bg-slate-50/80 mb-1 rounded-t-lg">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Frontmatter Elements</p>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-9 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().insertTableOfContents().run()}
                >
                  <List className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Table of Contents
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-9 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().insertScientificList({ type: 'figure' }).run()}
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-2 text-indigo-500" /> List of Figures
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-9 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().insertScientificList({ type: 'table' }).run()}
                >
                  <Table className="w-3.5 h-3.5 mr-2 text-indigo-500" /> List of Tables
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-9 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().insertScientificList({ type: 'equation' }).run()}
                >
                  <Sigma className="w-3.5 h-3.5 mr-2 text-indigo-500" /> List of Equations
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-9 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().insertScientificList({ type: 'symbol' }).run()}
                >
                  <Hash className="w-3.5 h-3.5 mr-2 text-indigo-500" /> List of Symbols
                </Button>

                <div className="p-2 border-y border-slate-100 bg-slate-50/50 my-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Automated Captions</p>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-9 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().setCaption({ type: 'figure' }).run()}
                >
                  <Plus className="w-3 h-3 mr-2 text-indigo-400" /> Figure Caption
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-9 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().setCaption({ type: 'table' }).run()}
                >
                  <Plus className="w-3 h-3 mr-2 text-indigo-400" /> Table Caption
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-9 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().setCaption({ type: 'equation' }).run()}
                >
                  <Plus className="w-3 h-3 mr-2 text-indigo-400" /> Equation Identifier
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-2 mr-2">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Sync Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">{status}</span>
            </div>
          </div>
          <Separator orientation="vertical" className="h-8 bg-slate-200 mx-1" />
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600 h-9 gap-2 transition-colors px-2 rounded-lg" onClick={onOpenVersions}>
            <History className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline">History</span>
          </Button>
          <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9 shadow-lg shadow-indigo-200/50 px-4 md:px-6 rounded-xl active:scale-95 transition-all border-none font-bold" onClick={onAISuggest}>
            <Wand2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-[11px] font-black uppercase tracking-wider">AI Studio</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
