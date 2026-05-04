import * as React from 'react';
import { 
  Compass, Sparkles, Send, Copy, Plus, 
  Lightbulb, BookOpen, Quote, Target, X, 
  RefreshCw, CheckCircle2, ChevronRight, Wand2
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

export function ResearchStudio({ paperContent, sources, onInsertText, onClose }: ResearchStudioProps) {
  const [prompt, setPrompt] = React.useState('');
  const [results, setResults] = React.useState<ResearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState<'custom' | 'templates'>('templates');
  const [refiningId, setRefiningId] = React.useState<string | null>(null);

  const runResearch = async (customPrompt?: string) => {
    const query = customPrompt || prompt;
    if (!query || isLoading) return;

    setIsLoading(true);
    setPrompt('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const systemPrompt = `
        You are an advanced Research Design Expert. Your goal is to help a scholar refine their research project.
        
        CONTEXT:
        Manuscript Snippet: ${paperContent.slice(0, 2000)}
        Sources Available: ${JSON.stringify(sources.map(s => ({ title: s.title, year: s.year })))}
        
        TASK:
        ${query}
        
        FORMATTING:
        Provide your output in clear, structured academic markdown. If generating titles, provide 3-5 options. If generating questions, ensure they are researchable and specific.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: systemPrompt,
      });

      const responseText = result.text || 'Service unavailable.';
      
      const newResult: ResearchResult = {
        id: Math.random().toString(36).substring(2, 9),
        query: query.length > 30 ? query.substring(0, 30) + '...' : query,
        content: responseText,
        type: query.toLowerCase().includes('title') ? 'title' : 'synthesis',
        timestamp: Date.now()
      };

      setResults(prev => [newResult, ...prev]);
      toast.success('Research synthesis complete');
    } catch (error) {
      toast.error('Research service error');
    } finally {
      setIsLoading(false);
    }
  };

  const refineResult = async (id: string, instruction: 'rephrase' | 'expand') => {
    const resultToRefine = results.find(r => r.id === id);
    if (!resultToRefine || refiningId) return;

    setRefiningId(id);
    const toastId = toast.loading(`${instruction === 'rephrase' ? 'Rephrasing' : 'Expanding'} artifact...`);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const refinementPrompt = `
        You are an advanced Research Design Expert. Please ${instruction} the following content.
        
        ORIGINAL CONTENT:
        ${resultToRefine.content}
        
        ${instruction === 'rephrase' 
          ? 'Provide a more academic, professional, and clear version of this content while maintaining all core information.' 
          : 'Elaborate on the points mentioned, providing more depth, theoretical grounding, and specific examples where appropriate.'}
        
        FORMATTING:
        Maintain the same structured academic markdown format.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: refinementPrompt,
      });

      const refinedText = result.text || resultToRefine.content;

      setResults(prev => prev.map(r => 
        r.id === id ? { ...r, content: refinedText, timestamp: Date.now() } : r
      ));
      
      toast.success(`Artifact ${instruction}d successfully`, { id: toastId });
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
      prompt: 'Generate 5 sophisticated, punchy, and academic research titles that accurately reflect the current manuscript for a high-impact journal.',
      icon: <Target className="w-4 h-4" />
    },
    {
      title: 'Gap Analysis',
      description: 'Identify potential research gaps based on my current focus.',
      prompt: 'Based on my manuscript and connected sources, identify 3 significant research gaps or "unanswered questions" that could be explored further in this paper.',
      icon: <Compass className="w-4 h-4" />
    },
    {
      title: 'Hypothesis Crafter',
      description: 'Develop testable hypotheses or core research questions.',
      prompt: 'Synthesize my current work into 2-3 precise, testable research hypotheses or central research questions.',
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
        <div className="p-4 bg-white border-b border-slate-100">
          <Tabs value={activeMode} onValueChange={(v: any) => setActiveMode(v)} className="w-full">
            <TabsList className="w-full h-8 bg-slate-50 border border-slate-200">
              <TabsTrigger value="templates" className="flex-1 text-[10px] uppercase font-bold tracking-wider">Templates</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1 text-[10px] uppercase font-bold tracking-wider">Custom Prompt</TabsTrigger>
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
                className="grid grid-cols-2 gap-3"
              >
                {templates.map((t, idx) => (
                  <Card 
                    key={idx} 
                    className="group border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                    onClick={() => runResearch(t.prompt)}
                  >
                    <CardContent className="p-3">
                      <div className="w-7 h-7 rounded bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center mb-2">
                        {t.icon}
                      </div>
                      <h3 className="text-[11px] font-bold text-slate-800 mb-1 group-hover:text-indigo-600 truncate">{t.title}</h3>
                      <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{t.description}</p>
                    </CardContent>
                  </Card>
                ))}
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
              <Card key={res.id} className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/80 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">{res.type}</span>
                    <span className="text-[10px] text-slate-500 font-medium truncate italic">{res.query}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <button 
                          className={`p-1 transition-colors ${refiningId === res.id ? 'text-indigo-600 animate-spin' : 'text-slate-400 hover:text-indigo-600'}`}
                          disabled={!!refiningId}
                        >
                          {refiningId === res.id ? <RefreshCw className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                        </button>
                      } />
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => refineResult(res.id, 'rephrase')} className="text-[11px] font-bold uppercase tracking-wider">
                          Rephrase
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => refineResult(res.id, 'expand')} className="text-[11px] font-bold uppercase tracking-wider">
                          Expand
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
                   <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-serif">
                     {res.content}
                   </div>
                   <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                      <span className="text-[9px] text-slate-300 font-mono uppercase tracking-widest">{new Date(res.timestamp).toLocaleTimeString()}</span>
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
