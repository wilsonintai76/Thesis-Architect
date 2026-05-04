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

        <Separator orientation="vertical" className="h-6 hidden lg:block bg-slate-200" />

        {/* Basic Formatting */}
        <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/60 shadow-sm gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('bold') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Bold className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('italic') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Italic className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('underline') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <UnderlineIcon className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all hidden sm:flex ${editor.isActive('superscript') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            title="Superscript (Ctrl+.)"
          >
            <SuperscriptIcon className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all hidden sm:flex ${editor.isActive('subscript') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            title="Subscript (Ctrl+,)"
          >
            <SubscriptIcon className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('highlight') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Highlighter className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 hidden lg:block bg-slate-200" />

        {/* Structure & Lists */}
        <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/60 shadow-sm gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <span className="font-black text-[10px] md:text-xs">H1</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <span className="font-black text-[10px] md:text-xs">H2</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-8 h-8 md:w-9 md:h-9 transition-all ${editor.isActive('bulletList') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <List className="w-4 h-4 md:w-[18px] md:h-[18px]" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 hidden lg:block bg-slate-200" />

        {/* Academic Tools */}
        <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/60 shadow-sm gap-0.5">
          <Popover>
            <PopoverTrigger render={(props) => (
              <Button
                {...props}
                size="icon"
                variant="ghost"
                className={`w-8 h-8 md:w-9 md:h-9 rounded-lg transition-all ${editor.isActive('link') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                title="Insert Link"
              >
                <LinkIcon className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )} />
            <PopoverContent className="w-64 p-0 shadow-2xl border-slate-200" align="start">
              <div className="p-3 border-b border-slate-100 bg-slate-50/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Link</p>
              </div>
              <div className="p-2 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start h-8 text-[11px] font-medium"
                  onClick={setLink}
                >
                  <LinkIcon className="w-3 h-3 mr-2" /> External URL...
                </Button>
                
                <Separator />
                
                <p className="px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-2">Jump to Section</p>
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
                          className="w-full justify-start h-7 text-[10px] font-medium truncate"
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
          
          <Popover open={isMathPopoverOpen} onOpenChange={setIsMathPopoverOpen}>
            <PopoverTrigger render={(props) => (
              <Button
                {...props}
                size="icon"
                variant="ghost"
                className={`w-8 h-8 md:w-9 md:h-9 rounded-lg transition-all ${isMathPopoverOpen ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                title="Mathematics & Equations"
              >
                <Sigma className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )} />
            <PopoverContent className="w-[440px] max-w-[95vw] p-0 shadow-2xl border-slate-200 overflow-hidden rounded-xl" align="start">
              <div className="bg-slate-50/80 p-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Scientific Typesetting</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">LaTeX & Symbol Laboratory</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Sigma className="w-4 h-4" />
                </div>
              </div>
              
              <Tabs defaultValue="gallery" className="w-full">
                <div className="px-3 pt-3">
                  <TabsList className="grid w-full grid-cols-2 h-8 bg-slate-100/50 p-1 rounded-lg">
                    <TabsTrigger value="gallery" className="text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-indigo-600 rounded-md transition-all h-6">Gallery</TabsTrigger>
                    <TabsTrigger value="latex" className="text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-indigo-600 rounded-md transition-all h-6">LaTeX Editor</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="gallery" className="p-3 m-0">
                  <ScrollArea className="h-64 pr-2">
                    <div className="grid grid-cols-1 gap-1.5">
                      {COMMON_EQUATIONS.map((eq) => (
                        <Button key={eq.name} variant="ghost" className="w-full h-auto py-2.5 px-3 flex flex-col items-start gap-1 justify-center hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 group transition-all" onClick={() => { editor.chain().focus().setMathematics({ latex: eq.latex }).run(); setIsMathPopoverOpen(false); }}>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600">{eq.name}</span>
                            <span className="text-[8px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Insert</span>
                          </div>
                          <code className="text-indigo-500 font-mono text-[10px] opacity-60 truncate w-full text-left">{eq.latex}</code>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="latex" className="p-3 m-0 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Raw LaTeX Expression</label>
                    <textarea
                      placeholder="e.g. \int_{a}^{b} x^2 dx"
                      value={latexInput}
                      onChange={(e) => setLatexInput(e.target.value)}
                      className="w-full min-h-[100px] text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono bg-slate-50/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          editor.chain().focus().setMathematics({ latex: latexInput }).run();
                          setLatexInput('');
                          setIsMathPopoverOpen(false);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest px-1">Live Preview</label>
                    <div className="w-full min-h-[80px] p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: latexPreview || '<span class="text-slate-300 italic text-[11px]">Equation preview...</span>' }} />
                  </div>
                  <Button className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100" disabled={!latexInput.trim()} onClick={() => { editor.chain().focus().setMathematics({ latex: latexInput }).run(); setLatexInput(''); setIsMathPopoverOpen(false); }}>
                    Insert Mathematical Object
                  </Button>
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
                title="Symbol Browser"
              >
                <Calculator className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )} />
            <PopoverContent className="w-80 p-0 shadow-2xl border-slate-200 overflow-hidden rounded-xl" align="start">
              <div className="bg-slate-50/80 p-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Symbol Catalog</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Insert Scientific Characters</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Calculator className="w-4 h-4" />
                </div>
              </div>
              
              <Tabs defaultValue="Greek" className="w-full">
                <div className="px-3 pt-3">
                  <TabsList className="grid w-full grid-cols-3 h-8 bg-slate-100/50 p-1 rounded-lg">
                    {SYMBOL_CATEGORIES.map(cat => (
                      <TabsTrigger 
                        key={cat.name} 
                        value={cat.name} 
                        className="text-[9px] font-black uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-indigo-600 rounded-md transition-all h-6"
                      >
                        {cat.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {SYMBOL_CATEGORIES.map(cat => (
                  <TabsContent key={cat.name} value={cat.name} className="p-3 m-0">
                    <ScrollArea className="h-64">
                      <div className="grid grid-cols-6 gap-1">
                        {cat.symbols.map((item) => (
                          <Button
                            key={item.s}
                            variant="ghost"
                            size="sm"
                            className="h-10 w-full p-0 text-lg hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-200 hover:shadow-sm transition-all font-serif"
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
              <div className="p-2 bg-slate-50 border-t border-slate-100">
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center italic">Tip: Click to insert at cursor</p>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger render={(props) => (
              <Button
                {...props}
                variant="ghost"
                size="icon"
                className="w-8 h-8 md:w-9 md:h-9 text-slate-500 hover:text-slate-900 rounded-lg transition-all data-[state=open]:bg-white data-[state=open]:text-indigo-600 data-[state=open]:shadow-sm"
                title="Evidence & Citations"
              >
                <BookMarked className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )} />
            <PopoverContent className="w-64 p-1 shadow-2xl border-slate-200 rounded-xl" align="start">
              <div className="p-2 border-b border-slate-100 bg-slate-50/80 mb-1 rounded-t-lg">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Research Integration</p>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                <Popover>
                  <PopoverTrigger render={(props) => (
                    <Button {...props} variant="ghost" size="sm" className="justify-start h-8 text-[11px] font-bold w-full">
                      <LinkIcon className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Insert Citation
                    </Button>
                  )} />
                  <PopoverContent className="w-64 p-0 shadow-2xl border-slate-200 ml-1" align="start">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/80">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect Evidence</p>
                    </div>
                    <ScrollArea className="h-48">
                      <div className="p-1">
                        {sources.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 italic">No research entries found.</div>
                        ) : (
                          sources.map((s) => (
                            <button key={s.id} className="w-full text-left p-3 rounded-md hover:bg-indigo-50/50 transition-colors group" onClick={() => insertCitation(s)}>
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
                    <Button {...props} variant="ghost" size="sm" className="justify-start h-8 text-[11px] font-bold">
                      <MessageSquareQuote className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Add Footnote
                    </Button>
                  )} />
                  <PopoverContent className="w-72 p-3 shadow-2xl border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Footnote Content</p>
                    <textarea
                      placeholder="Enter supplemental information..."
                      className="w-full h-24 p-2 text-xs border border-slate-200 rounded-lg mb-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                      value={footnoteContent}
                      onChange={(e) => setFootnoteContent(e.target.value)}
                    />
                    <Button 
                      className="w-full h-8 bg-indigo-600 text-xs font-bold uppercase tracking-wider"
                      onClick={insertFootnote}
                      disabled={!footnoteContent.trim()}
                    >
                      Insert Note
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={addImage}
            className="w-8 h-8 md:w-9 md:h-9 text-slate-500 hover:text-slate-900 rounded-lg transition-all"
            title="Media & Components"
          >
            <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

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
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Thesis Frontmatter</p>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-8 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().insertTableOfContents().run()}
                >
                  <List className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Table of Contents
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-8 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().insertScientificList({ type: 'figure' }).run()}
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-2 text-indigo-500" /> List of Figures
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-8 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().insertScientificList({ type: 'table' }).run()}
                >
                  <Table className="w-3.5 h-3.5 mr-2 text-indigo-500" /> List of Tables
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-8 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().insertScientificList({ type: 'equation' }).run()}
                >
                  <Sigma className="w-3.5 h-3.5 mr-2 text-indigo-500" /> List of Equations
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-8 text-[11px] font-bold w-full"
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
                  className="justify-start h-8 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().setCaption({ type: 'figure' }).run()}
                >
                  <Plus className="w-3 h-3 mr-2 text-indigo-400" /> Fig. Caption
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-8 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().setCaption({ type: 'table' }).run()}
                >
                  <Plus className="w-3 h-3 mr-2 text-indigo-400" /> Table Caption
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start h-8 text-[11px] font-bold w-full"
                  onClick={() => editor.chain().focus().setCaption({ type: 'equation' }).run()}
                >
                  <Plus className="w-3 h-3 mr-2 text-indigo-400" /> Eq. Identifier
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
