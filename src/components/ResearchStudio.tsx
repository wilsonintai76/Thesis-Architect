import * as React from 'react';
import { 
  Compass, Sparkles, Send, Copy, Plus, 
  Lightbulb, BookOpen, Quote, Target, X, 
  RefreshCw, CheckCircle2, ChevronRight, Wand2, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ResearchStudioProps {
  paperContent: string;
  sources: any[];
  onInsertText: (text: string) => void;
  onClose: () => void;
}

interface ResearchResult {
  id: string;
  query: string;
  content: string;
  type: 'title' | 'outline' | 'questions' | 'synthesis';
  timestamp: number;
}

interface WebSource {
  id: string;
  url: string;
  title: string;
  analysis: string;
  timestamp: string;
}

export function ResearchStudio({ paperContent, sources, onInsertText, onClose }: ResearchStudioProps) {
  const [prompt, setPrompt] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [keywords, setKeywords] = React.useState('');
  const [results, setResults] = React.useState<ResearchResult[]>([]);
  const [webSources, setWebSources] = React.useState<WebSource[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState<'custom' | 'templates' | 'web'>('templates');
  const [refiningId, setRefiningId] = React.useState<string | null>(null);
  const [customRefiningPrompt, setCustomRefiningPrompt] = React.useState('');

  const runResearch = async (customPrompt?: string, mode: 'internal' | 'web' = 'internal') => {
    const query = customPrompt || prompt;
    if (!query || isLoading) return;

    setIsLoading(true);
    if (!customPrompt) setPrompt('');

    try {
      if (mode === 'web') {
        const response = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: query, focus: keywords })
        });
        const data = await response.json();
        
        const newResult: ResearchResult = {
          id: Math.random().toString(36).substring(2, 9),
          query: query.substring(0, 30) + (query.length > 30 ? '...' : ''),
          content: data.content,
          type: 'synthesis',
          timestamp: Date.now()
        };
        setResults(prev => [newResult, ...prev]);
        toast.success('Web research completed');
      } else {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
        
        const systemPrompt = `
          You are a World-Class Academic Editor and Research Consultant specializing in high-impact publishing (Nature, Science, JSTOR).
          
          CONTEXT:
          Manuscript Snippet: ${paperContent.slice(0, 3000)}
          Focus Keywords: ${keywords || 'Context-driven'}
          Available References: ${JSON.stringify(sources.map(s => ({ title: s.title, year: s.year })))}
          
          CORE TASK:
          ${query}
          
          CONSTRAINTS FOR TITLES:
          If generating titles, you MUST provide 5 distinct options:
          1. The "Standard Bearer": Clear, descriptive, and professional.
          2. The "Provocateur": A question-based title that challenges the status quo.
          3. The "Methodologist": Highlights the unique technical approach or framework.
          4. The "Narrative": A colon-separated title focusing on the key tension (e.g., Theme: A Study of...).
          5. The "Modernist": Short, punchy, and memorable (maximum 7 words).
          
          FORMATTING:
          Use clean Markdown with bold headings. For titles, use a numbered list.
        `;

        const result = await genAI.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: systemPrompt,
        });

        const responseText = result.text || 'Synthesis engine offline.';
        
        const isTitleQuery = query.toLowerCase().includes('title');
        
        const newResult: ResearchResult = {
          id: Math.random().toString(36).substring(2, 9),
          query: isTitleQuery ? 'Academic Title Laboratory' : (query.length > 30 ? query.substring(0, 30) + '...' : query),
          content: responseText,
          type: isTitleQuery ? 'title' : 'synthesis',
          timestamp: Date.now()
        };

        setResults(prev => [newResult, ...prev]);
        toast.success('Research synthesis complete');
      }
    } catch (error) {
      toast.error('Research service error');
    } finally {
      setIsLoading(false);
    }
  };

  const extractSource = async () => {
    if (!url || isExtracting) return;
    
    setIsExtracting(true);
    const toastId = toast.loading('Extracting source data...');

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      
      const newSource: WebSource = {
        id: Math.random().toString(36).substring(2, 9),
        ...data
      };
      
      setWebSources(prev => [newSource, ...prev]);
      setUrl('');
      toast.success('Source extracted successfully', { id: toastId });
    } catch (error) {
      toast.error('Extraction failed', { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  const refineResult = async (id: string, instruction: 'rephrase' | 'expand' | 'custom') => {
    const resultToRefine = results.find(r => r.id === id);
    if (!resultToRefine || refiningId) return;

    const finalInstruction = instruction === 'custom' ? customRefiningPrompt : instruction;
    if (instruction === 'custom' && !customRefiningPrompt.trim()) {
      toast.error('Please provide refinement instructions');
      return;
    }

    setRefiningId(id);
    const toastId = toast.loading(`${instruction === 'custom' ? 'Refining' : instruction === 'rephrase' ? 'Rephrasing' : 'Expanding'} artifact...`);

    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      let specificInstruction = '';
      if (instruction === 'rephrase') {
        specificInstruction = 'Provide a more academic, professional, and clear version of this content while maintaining all core information.';
      } else if (instruction === 'expand') {
        specificInstruction = 'Elaborate on the points mentioned, providing more depth, theoretical grounding, and specific examples where appropriate.';
      } else {
        specificInstruction = `Refine this content based on the following specific request: ${customRefiningPrompt}`;
      }

      const refinementPrompt = `
        You are an advanced Research Design Expert. Review the original artifact and apply the refinement instructions.
        
        ORIGINAL CONTENT:
        ${resultToRefine.content}
        
        REFINEMENT TASK:
        ${specificInstruction}
        
        FORMATTING:
        Maintain the same structured academic markdown format.
      `;

      const result = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: refinementPrompt,
      });

      const refinedText = result.text || resultToRefine.content;

      setResults(prev => prev.map(r => 
        r.id === id ? { ...r, content: refinedText, timestamp: Date.now() } : r
      ));
      
      setCustomRefiningPrompt('');
      toast.success(`Artifact refined successfully`, { id: toastId });
    } catch (error) {
      toast.error('Refinement failed', { id: toastId });
    } finally {
      setRefiningId(null);
    }
  };

  const templates = [
    {
      title: 'Academic Title Lab',
      description: 'Generate 5 sophisticated research titles based on my manuscript.',
      prompt: 'Generate 5 high-impact academic titles. Provide 1 descriptive, 1 question-based, 1 methodology-focused, 1 colon-separated, and 1 punchy modernist title.',
      icon: <Target className="w-4 h-4" />
    },
    {
      title: 'Gap Identification',
      description: 'Identify 3 potential research gaps or unanswered questions.',
      prompt: 'Identify 3 potential research gaps or unanswered questions in the current manuscript, drawing connections to the available sources and keywords provided.',
      icon: <Compass className="w-4 h-4" />
    },
    {
      title: 'Hypothesis Generator',
      description: 'Develop testable hypotheses or core research questions.',
      prompt: 'Synthesize my current work into 3 precise, testable research hypotheses based on the identified data gaps.',
      icon: <Lightbulb className="w-4 h-4" />
    },
    {
      title: 'Literature Synthesis',
      description: 'Find themes across all my connected sources.',
      prompt: 'Synthesize the main themes and tensions across my current library of sources as they relate to my manuscript.',
      icon: <BookOpen className="w-4 h-4" />
    }
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 w-[450px] border-l border-slate-200 shadow-2xl relative z-20 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 leading-none mb-1">Research Studio</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Prompt Interface v1.0</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-900 hover:bg-slate-100" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 bg-white border-b border-slate-100 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Target className="w-3 h-3" /> Focus Keywords
              </label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1.5"
                onClick={() => runResearch('Generate 5 highly targeted, professional research paper titles that incorporate these keywords and the current manuscript context. Ensure they vary in style (e.g., standard, colon-separated, question-style).')}
                disabled={isLoading}
              >
                <Sparkles className="w-3 h-3" /> Suggest Titles
              </Button>
            </div>
            <Input 
              placeholder="E.g., quantum computing, ethics, longitudinal study..." 
              className="h-8 text-[11px] bg-slate-50 border-slate-200"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <Tabs value={activeMode} onValueChange={(v: any) => setActiveMode(v)} className="w-full">
            <TabsList className="w-full h-8 bg-slate-50 border border-slate-200">
              <TabsTrigger value="templates" className="flex-1 text-[10px] uppercase font-bold tracking-wider">Templates</TabsTrigger>
              <TabsTrigger value="web" className="flex-1 text-[10px] uppercase font-bold tracking-wider">Web Search</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1 text-[10px] uppercase font-bold tracking-wider">Extraction</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1 p-4 bg-slate-50/50">
          <AnimatePresence mode="popLayout">
            {activeMode === 'templates' ? (
              <motion.div 
                key="templates"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {templates.map((t, idx) => (
                  <Card 
                    key={idx} 
                    className="group border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden rounded-xl"
                    onClick={() => runResearch(t.prompt)}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 flex items-center justify-center mb-4 shadow-sm group-hover:shadow-indigo-200">
                        {t.icon}
                      </div>
                      <h3 className="text-[12px] font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{t.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-3">{t.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            ) : activeMode === 'web' ? (
              <motion.div 
                key="web"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-mono flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Live Web Research
                  </label>
                  <textarea 
                    className="w-full min-h-[100px] bg-slate-50 border border-slate-100 p-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md transition-all resize-none"
                    placeholder="Enter research query (e.g., 'Recent breakthroughs in carbon capture 2025')..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button 
                      size="sm" 
                      className="bg-indigo-600 hover:bg-indigo-700 h-8 gap-2 text-[11px] uppercase font-bold tracking-wider"
                      onClick={() => runResearch(undefined, 'web')}
                      disabled={isLoading || !prompt.trim()}
                    >
                      {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Search Live Web
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="custom"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-mono flex items-center gap-2">
                    <LinkIcon className="w-3 h-3" /> Auto-Source Extractor
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      className="h-8 text-[11px] bg-slate-50 flex-1"
                      placeholder="Paste scholarly URL here..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && extractSource()}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 bg-indigo-600 hover:bg-indigo-700"
                      onClick={extractSource}
                      disabled={isExtracting || !url.trim()}
                    >
                      {isExtracting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    </Button>
                  </div>
                  <p className="mt-2 text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Enter a URL to summarize and cite automatically</p>
                </div>

                {webSources.map((source) => (
                  <Card key={source.id} className="bg-white/50 border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <h4 className="text-[10px] font-bold text-slate-700 truncate">{source.title}</h4>
                      </div>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-600 hover:underline shrink-0">Source</a>
                    </div>
                    <CardContent className="p-3">
                       <div className="text-[11px] text-slate-600 leading-relaxed font-serif whitespace-pre-wrap italic opacity-80">
                         {source.analysis}
                       </div>
                       <div className="mt-3 flex justify-end gap-2">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-6 text-[9px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50"
                           onClick={() => onInsertText(source.analysis)}
                         >
                           Add to Paper
                         </Button>
                       </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Detailed Prompting</label>
                  <textarea 
                    className="w-full min-h-[120px] bg-slate-50 border border-slate-100 p-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md transition-all resize-none"
                    placeholder="E.g., Compare Zhang and Millers view on LLMs with the methodology section of my current paper..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button 
                      size="sm" 
                      className="bg-indigo-600 hover:bg-indigo-700 h-8 gap-2 text-[11px] uppercase font-bold tracking-wider"
                      onClick={() => runResearch()}
                      disabled={isLoading || !prompt.trim()}
                    >
                      {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Execute Research
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ChevronRight className="w-3 h-3" />
              Generated Artifacts
            </h3>
            
            {results.length === 0 && !isLoading && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-xl">
                <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-[11px] uppercase font-bold tracking-widest">No artifacts generated yet</p>
              </div>
            )}

            {isLoading && activeMode === 'templates' && (
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <p className="text-[11px] text-indigo-700 font-bold uppercase tracking-wider">Researching Library and Draft...</p>
              </div>
            )}

            {results.map((res) => (
              <Card key={res.id} className="bg-white border-slate-200 shadow-sm overflow-hidden group/card transition-all duration-300">
                <div className="bg-slate-50/80 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">{res.type}</span>
                    <span className="text-[10px] text-slate-500 font-medium truncate italic">{res.query}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <button 
                          className={`p-1 flex items-center gap-1.5 px-2 rounded-md transition-all ${refiningId === res.id ? 'text-indigo-600 bg-indigo-50 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                          disabled={!!refiningId}
                        >
                          {refiningId === res.id ? <RefreshCw className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                          <span className="text-[10px] font-bold uppercase tracking-wider">Refine</span>
                        </button>
                      } />
                      <DropdownMenuContent align="end" className="w-48 p-1">
                        <DropdownMenuItem onClick={() => refineResult(res.id, 'rephrase')} className="text-[11px] font-bold uppercase tracking-wider p-2 cursor-pointer">
                          Rephrase (Academic)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => refineResult(res.id, 'expand')} className="text-[11px] font-bold uppercase tracking-wider p-2 cursor-pointer">
                          Expand (Depth)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button 
                      onClick={() => handleCopy(res.content)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Copy content"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onInsertText(res.content)}
                      className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Insert into document"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <CardContent className="p-4">
                   <div className={`${res.type === 'title' ? 'bg-indigo-50/30 p-4 rounded-lg border border-indigo-100/50' : ''} text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-serif`}>
                     {res.content}
                   </div>
                   
                   <div className="mt-4 flex flex-col gap-2">
                     <div className="relative">
                        <Input 
                          placeholder="Custom refinement instructions (e.g., 'summarize', 'more data')..."
                          className="h-8 text-[11px] pr-10 bg-slate-50/50 focus:bg-white transition-all border-slate-100"
                          value={refiningId === res.id ? customRefiningPrompt : ''}
                          onChange={(e) => {
                            if (refiningId !== res.id) setRefiningId(res.id);
                            setCustomRefiningPrompt(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') refineResult(res.id, 'custom');
                          }}
                        />
                        <button 
                          onClick={() => refineResult(res.id, 'custom')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-700 disabled:opacity-30"
                          disabled={!customRefiningPrompt.trim() || (refiningId !== null && refiningId !== res.id)}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                     </div>
                     <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[9px] text-slate-300 font-mono uppercase tracking-widest">{new Date(res.timestamp).toLocaleTimeString()}</span>
                        <div className="flex gap-2">
                          <button onClick={() => refineResult(res.id, 'rephrase')} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Rephrase</button>
                          <button onClick={() => refineResult(res.id, 'expand')} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Expand</button>
                        </div>
                     </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 bg-indigo-600 text-white shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 opacity-70" />
          <p className="text-[10px] font-medium leading-normal opacity-90">
            Note: Research results are synthesized from your library. Always verify claims before finalizing.
          </p>
        </div>
      </div>
    </div>
  );
}
