import * as React from 'react';
import { 
  Compass, Sparkles, Plus, 
  Lightbulb, BookOpen, Target, X, 
  RefreshCw, ChevronRight, Link as LinkIcon,
  HelpCircle, CheckCircle2
} from 'lucide-react';
import { ResearchArtifact, Source } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ResearchTemplateSection } from './research/ResearchTemplateSection';
import { ResearchArtifactCard } from './research/ResearchArtifactCard';

interface ResearchStudioProps {
  paperContent: string;
  sources: Source[];
  artifacts: ResearchArtifact[];
  onUpdateArtifacts: (artifacts: ResearchArtifact[]) => void;
  onInsertText: (text: string) => void;
  onClose: () => void;
}

interface WebSource {
  id: string;
  url: string;
  title: string;
  analysis: string;
  timestamp: string;
}

export function ResearchStudio({ paperContent, sources, artifacts, onUpdateArtifacts, onInsertText, onClose }: ResearchStudioProps) {
  const [prompt, setPrompt] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [keywords, setKeywords] = React.useState('');
  const [webSources, setWebSources] = React.useState<WebSource[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState<'custom' | 'templates' | 'web' | 'questions'>('templates');
  const [refiningId, setRefiningId] = React.useState<string | null>(null);
  const [autoLinkingId, setAutoLinkingId] = React.useState<string | null>(null);
  const [customRefiningPrompt, setCustomRefiningPrompt] = React.useState('');

  const runResearch = async (customPrompt?: string, mode: 'internal' | 'web' = 'internal') => {
    const query = customPrompt || prompt;
    if (!query || isLoading) return;

    setIsLoading(true);
    if (!customPrompt) setPrompt('');

    try {
      if (mode === 'web') {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
        
        const webPrompt = `You are a professional research assistant. 
        Perform a deep search on the following topic: "${query}".
        Focus specifically on: ${keywords || 'academic relevance and current data'}.
        
        Provide a structured report with:
        1. Executive Summary
        2. Key Findings (supported by search data)
        3. Relevant Statistics/Data Points
        4. Proposed Academic Citations
        
        Maintain a highly scholarly and objective tone.`;

        const result = await ai.models.generateContent({ 
          model: "gemini-3-flash-preview",
          contents: webPrompt,
          config: {
            tools: [
              {
                googleSearch: {}
              }
            ]
          }
        });
        
        const responseText = result.text || 'Web research engine returned no data.';
        
        const newResult: ResearchArtifact = {
          id: Math.random().toString(36).substring(2, 9),
          query: query.substring(0, 30) + (query.length > 30 ? '...' : ''),
          content: responseText,
          type: 'synthesis',
          timestamp: Date.now()
        };
        onUpdateArtifacts([newResult, ...artifacts]);
        toast.success('Web research completed');
      } else {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
        
        const systemPrompt = `
          You are a World-Class Academic Editor and Research Consultant specializing in high-impact publishing (Nature, Science, JSTOR).
          
          CONTEXT:
          Manuscript Snippet: ${paperContent.slice(0, 3000)}
          Focus Keywords: ${keywords || 'Context-driven'}
          Available References: ${JSON.stringify(sources.map(s => ({ id: s.id, title: s.title, authors: s.authors, year: s.year })))}
          
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

        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: systemPrompt,
        });

        const responseText = result.text || 'Synthesis engine offline.';
        
        const isTitleQuery = query.toLowerCase().includes('title');
        const isQuestionQuery = query.toLowerCase().includes('question');
        
        const newResult: ResearchArtifact = {
          id: Math.random().toString(36).substring(2, 9),
          query: isTitleQuery ? 'Academic Title Laboratory' : (isQuestionQuery ? 'Research Question Blueprint' : (query.length > 30 ? query.substring(0, 30) + '...' : query)),
          content: responseText,
          type: isTitleQuery ? 'title' : (isQuestionQuery ? 'questions' : 'synthesis'),
          timestamp: Date.now()
        };

        onUpdateArtifacts([newResult, ...artifacts]);
        toast.success('Research synthesis complete');
      }
    } catch (error: any) {
      console.error('Research error:', error);
      toast.error(`Research service error: ${error.message || 'Unknown error'}`);
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
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch content');

      // Now use Gemini on the frontend to analyze the raw content
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const extractPrompt = `Analyze the following webpage content from ${url}.
      
      1. Summarize the main scholarly/informative contribution (3-5 sentences).
      2. Extract 3 key data points or arguments.
      3. Provide a full academic citation in APA format.
      4. Suggest 3 relevant keywords.
      
      CONTENT:
      ${data.content}`;

      const result = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: extractPrompt
      });
      const analysis = result.text || 'Analysis failed.';

      const newSource: WebSource = {
        id: Math.random().toString(36).substring(2, 9),
        url: data.url,
        title: data.title,
        analysis: analysis,
        timestamp: data.timestamp
      };
      
      setWebSources(prev => [newSource, ...prev]);
      setUrl('');
      toast.success('Source extracted and analyzed', { id: toastId });
    } catch (error: any) {
      console.error('Extraction error:', error);
      toast.error(`Extraction failed: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleSourceLink = (artifactId: string, sourceId: string) => {
    onUpdateArtifacts(artifacts.map(res => {
      if (res.id !== artifactId) return res;
      const currentLinks = res.linkedSourceIds || [];
      const newLinks = currentLinks.includes(sourceId)
        ? currentLinks.filter(id => id !== sourceId)
        : [...currentLinks, sourceId];
      return { ...res, linkedSourceIds: newLinks };
    }));
  };

  const autoLinkArtifact = async (artifactId: string) => {
    if (autoLinkingId || sources.length === 0) return;
    
    const artifact = artifacts.find(a => a.id === artifactId);
    if (!artifact) return;

    setAutoLinkingId(artifactId);
    const toastId = toast.loading('AI analyzing source metadata for links...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const linkagePrompt = `
        You are a Research Data Integrity Expert. Identify which of the following sources are most relevant to this research artifact.
        
        ARTIFACT CONTENT:
        ${artifact.content}
        
        LIBRARY SOURCES:
        ${JSON.stringify(sources.map(s => ({ id: s.id, title: s.title, authors: s.authors, year: s.year })))}
        
        TASK:
        Provide a JSON list of source IDs that are directly relevant or likely influenced this content. Return ONLY the JSON array of strings.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: linkagePrompt,
      });

      const responseText = result.text || '[]';
      // Basic JSON extraction
      const match = responseText.match(/\[.*\]/s);
      if (match) {
        const suggestedIds: string[] = JSON.parse(match[0]);
        // Filter to valid IDs only
        const validIds = suggestedIds.filter(id => sources.some(s => s.id === id));
        
        if (validIds.length > 0) {
          onUpdateArtifacts(artifacts.map(a => 
            a.id === artifactId ? { ...a, linkedSourceIds: Array.from(new Set([...(a.linkedSourceIds || []), ...validIds])) } : a
          ));
          toast.success(`Automatically linked ${validIds.length} relevant sources`, { id: toastId });
        } else {
          toast.info('No strong thematic links found in library', { id: toastId });
        }
      }
    } catch (error: any) {
      console.error('Auto-linking error:', error);
      toast.error(`Auto-linking failed: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setAutoLinkingId(null);
    }
  };

  const refineResult = async (id: string, instruction: 'rephrase' | 'expand' | 'custom') => {
    const resultToRefine = artifacts.find(r => r.id === id);
    if (!resultToRefine || refiningId) return;

    const finalInstruction = instruction === 'custom' ? customRefiningPrompt : instruction;
    if (instruction === 'custom' && !customRefiningPrompt.trim()) {
      toast.error('Please provide refinement instructions');
      return;
    }

    setRefiningId(id);
    const toastId = toast.loading(`${instruction === 'custom' ? 'Refining' : instruction === 'rephrase' ? 'Rephrasing' : 'Expanding'} artifact...`);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
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

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: refinementPrompt,
      });

      const refinedText = result.text || resultToRefine.content;

      onUpdateArtifacts(artifacts.map(r => 
        r.id === id ? { ...r, content: refinedText, timestamp: Date.now() } : r
      ));
      
      setCustomRefiningPrompt('');
      toast.success(`Artifact refined successfully`, { id: toastId });
    } catch (error: any) {
      console.error('Refinement error:', error);
      toast.error(`Refinement failed: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setRefiningId(null);
    }
  };

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
              <TabsTrigger value="questions" className="flex-1 text-[10px] uppercase font-bold tracking-wider">Questions</TabsTrigger>
              <TabsTrigger value="web" className="flex-1 text-[10px] uppercase font-bold tracking-wider">Web Search</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1 text-[10px] uppercase font-bold tracking-wider">Extraction</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1 p-4 bg-slate-50/50">
          <AnimatePresence mode="popLayout">
            {activeMode === 'templates' ? (
              <ResearchTemplateSection onSelect={(prompt) => runResearch(prompt)} />
            ) : activeMode === 'questions' ? (
              <motion.div 
                key="questions"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <HelpCircle className="w-24 h-24" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Core Research Questions</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Inquiry Architecture</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium mb-6">
                      Generate sophisticated, multidimensional research questions based on your current manuscript content and library context.
                    </p>

                    <div className="space-y-3">
                      <Button 
                        variant="default"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 gap-2 text-[11px] uppercase font-black tracking-widest shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => runResearch("Generate 3 core research questions and 3 sub-questions that would drive a high-impact paper based on my current manuscript and keywords. Ensure they are structured across descriptive, analytical, and critical dimensions.")}
                        disabled={isLoading}
                      >
                        {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Generate Core Questions
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          className="h-9 border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30"
                          onClick={() => runResearch("Formulate 3 exploratory research questions that focus on potential future directions or unknown variables in my current research space.")}
                          disabled={isLoading}
                        >
                          Exploratory
                        </Button>
                        <Button 
                          variant="outline"
                          className="h-9 border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30"
                          onClick={() => runResearch("Generate 3 strictly methodology-focused research questions that challenge or refine the proposed research design in my manuscript.")}
                          disabled={isLoading}
                        >
                          Methodological
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Lightbulb className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Expert Tip</h4>
                    <p className="text-[10px] text-indigo-700/80 leading-relaxed font-medium italic pr-2">
                       "Strong research questions often bridge the gap between your unique data and broader theoretical frameworks found in your library sources."
                    </p>
                  </div>
                </div>
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
            
            {artifacts.length === 0 && !isLoading && (
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

            {artifacts.map((res) => (
              <ResearchArtifactCard 
                key={res.id}
                artifact={res}
                sources={sources}
                autoLinkingId={autoLinkingId}
                refiningId={refiningId}
                customRefiningPrompt={customRefiningPrompt}
                onAutoLink={autoLinkArtifact}
                onRefine={refineResult}
                onCopy={handleCopy}
                onInsert={onInsertText}
                onToggleLink={toggleSourceLink}
                onUpdateRefiningPrompt={(val) => {
                  if (refiningId !== res.id) setRefiningId(res.id);
                  setCustomRefiningPrompt(val);
                }}
              />
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
