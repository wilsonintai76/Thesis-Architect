import * as React from 'react';
import { Sparkles, X, Send, Network, Lightbulb, FileText, MessageSquare } from 'lucide-react';
import { AIAssistantMessage } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GoogleGenAI } from '@google/genai';
import { AIMessageList } from './assistant/AIMessageList';
import { AIQuickActions } from './assistant/AIQuickActions';

interface AIAssistantProps {
  paperContent: string;
  selectedText?: string;
  sources: string;
  onClose: () => void;
}

export function AIAssistant({ paperContent, selectedText, sources, onClose }: AIAssistantProps) {
  const [messages, setMessages] = React.useState<AIAssistantMessage[]>([
    { role: 'assistant', content: "Expert analysis ready. I've reviewed your current manuscript draft and the connected evidence in your library. How can I assist with your academic writing today?" }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleSend = async (customPrompt?: string) => {
    const userMessage = customPrompt || input.trim();
    if (!userMessage || isLoading) return;

    if (!customPrompt) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const prompt = `
        You are a highly sophisticated academic research assistant and senior doctoral supervisor.
        
        CONTEXT:
        We are working on a high-level academic manuscript.
        
        CURRENT MANUSCRIPT DRAFT:
        ---
        ${paperContent || '[Manuscript is currently empty]'}
        ---

        ${selectedText ? `\nCURRENTLY HIGHLIGHTED/SELECTED TEXT:\n"${selectedText}"\n(Prioritize analysis of this snippet if specifically relevant to the query)` : ''}
        
        CONNECTED BIBLIOGRAPHY/SOURCES:
        ---
        ${sources || '[No sources currently in the library]'}
        ---
        
        RESEARCHER REQUEST:
        "${userMessage}"
        
        Instructions:
        1. Professional Scholarly Voice: Use precise, dense academic language. Avoid generic "Sure thing!" responses.
        2. Deep Synthesis: Don't just summarize. Connect concepts between the manuscript and the bibliography.
        3. Citation Advice: If suggesting new content, specify which of the "CONNECTED SOURCES" would support the claim.
        4. Gap Identification: If the user asks for analysis, look for missing counter-arguments, logical jumps, or under-sourced sections.
        5. Future Directions: Suggest specific, actionable research vectors based on findings.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const responseText = result.text || 'No response generated.';
      
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Scholarly service interruption. Please verify your connection or API configuration." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (tool: string) => {
    let newPrompt = '';
    if (tool === 'Analyze gaps') newPrompt = 'Analyze the current draft for critical knowledge gaps, theoretical underpinnings that are weak, or logical gaps in the argument.';
    if (tool === 'Research directions') newPrompt = 'Based on the current thesis, what are 3 distinct, high-impact research directions I should explore next?';
    if (tool === 'Draft section') newPrompt = 'Draft a bridge section or an introductory paragraph for a new sub-section using the keywords in the text and the sources available in my library.';
    if (tool === 'Academic review') newPrompt = 'Provide a rigorous peer-review style critique of the current manuscript. Focus on structural integrity and clarity.';
    if (tool === 'Identify inconsistencies') newPrompt = 'Scan my draft for any internal inconsistencies in terminology, logic, or citations.';
    if (tool === 'Source check') newPrompt = 'Cross-reference my manuscript against my library. Which sources am I under-utilizing, and where could they be inserted?';
    
    handleSend(newPrompt);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 w-96 border-l border-slate-200 shadow-2xl relative z-20">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 leading-none mb-1">AI Assistant Panel</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ready for Synthesis</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-900 hover:bg-slate-100" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4 pb-2 bg-white">
          <TabsList className="grid w-full grid-cols-3 h-9 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="chat" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Chat
            </TabsTrigger>
            <TabsTrigger value="analyze" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Network className="w-3 h-3" /> Analysis
            </TabsTrigger>
            <TabsTrigger value="draft" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3" /> Drafting
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 m-0 min-h-0 overflow-hidden flex flex-col">
          <AIMessageList messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
        </TabsContent>

        <TabsContent value="analyze" className="flex-1 m-0 p-4 min-h-0 overflow-y-auto">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Network className="w-3 h-3 text-indigo-600" /> Structural Analysis
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {['Analyze gaps', 'Academic review', 'Identify inconsistencies'].map(tool => (
                  <Button 
                    key={tool} 
                    variant="outline" 
                    className="justify-start h-10 text-[11px] font-bold border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all rounded-lg"
                    onClick={() => handleQuickAction(tool)}
                  >
                    {tool}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2 text-indigo-600">
                <Lightbulb className="w-3 h-3" /> Strategic Insight
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {['Research directions', 'Source check'].map(tool => (
                  <Button 
                    key={tool} 
                    variant="outline" 
                    className="justify-start h-10 text-[11px] font-bold border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all rounded-lg"
                    onClick={() => handleQuickAction(tool)}
                  >
                    {tool}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="draft" className="flex-1 m-0 p-4 min-h-0 overflow-y-auto">
          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 mb-4">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Automated Drafting</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Synthesize sections based on library sources. Selected text provides context for expansion.
            </p>
          </div>
          <Button 
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 rounded-xl flex items-center gap-3"
            onClick={() => handleQuickAction('Draft section')}
          >
            <FileText className="w-4 h-4" /> Generate Synthesis Draft
          </Button>
          
          <div className="mt-8">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Tips for Drafting</p>
             <ul className="space-y-3">
               {[
                 "Highlight a paragraph to expand its technical depth",
                 "Type keywords in the chat to guide the draft focus",
                 "Connect specific sources via the Library for citation context"
               ].map((tip, i) => (
                 <li key={i} className="flex gap-3 items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 mt-1" />
                   <span className="text-[10px] text-slate-500 font-medium">{tip}</span>
                 </li>
               ))}
             </ul>
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative group">
          <Input 
            placeholder="Ask about methodology, gaps, or drafting..." 
            className="pr-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500 rounded-lg text-xs h-11 transition-all group-hover:border-slate-300"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-1.5 top-1.5 h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-white rounded-lg transition-colors"
            onClick={() => handleSend()}
            disabled={isLoading}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <AIQuickActions onAction={handleQuickAction} />
      </div>
    </div>
  );
}

