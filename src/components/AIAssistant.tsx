import * as React from 'react';
import { Sparkles, X, Send } from 'lucide-react';
import { AIAssistantMessage } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        You are a highly sophisticated academic research assistant.
        
        CURRENT MANUSCRIPT:
        ${paperContent}

        ${selectedText ? `\nCURRENTLY SELECTED TEXT:\n${selectedText}\n(Please focus on this selected text if it's relevant to the query)` : ''}
        
        CONNECTED SOURCES:
        ${sources}
        
        RESEARCHER REQUEST:
        ${userMessage}
        
        Instructions:
        1. Provide precise, professional, and dense academic feedback.
        2. If relevant, suggest specific locations for citations based on the provided sources.
        3. Maintain a helpful but formal scholarly tone.
        4. If the user asks for rephrasing, expanding ideas, or counterarguments, focus on the selected text if provided, otherwise analyze the overall manuscript.
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
    if (tool === 'Rephrase') newPrompt = 'Please suggest rephrasings for the selected text (or the overall draft if nothing is selected) to improve clarity and flow.';
    if (tool === 'Expand') newPrompt = 'Please expand on the ideas in the selected text, or identify areas in the draft to expand, providing specific suggestions based on the research.';
    if (tool === 'Counterarguments') newPrompt = 'Based on the selected text or current claims in my draft, what are some plausible counterarguments?';
    if (tool === 'Review tone') newPrompt = 'Review the current draft for academic tone and suggest improvements.';
    if (tool === 'Fix citations') newPrompt = 'Check the manuscript for missing or incorrectly formatted citations based on the references in my library.';
    if (tool === 'Grammar fix') newPrompt = 'Identify and correct any grammatical errors, typos, or awkward phrasing in the selected text or overall document.';
    
    handleSend(newPrompt);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 w-80 border-l border-slate-200 shadow-2xl relative z-20">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 leading-none mb-1">AI Analyst</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Analysis Active</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-900 hover:bg-slate-100" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <AIMessageList messages={messages} isLoading={isLoading} scrollRef={scrollRef} />

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative group">
          <Input 
            placeholder="Review methodology..." 
            className="pr-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500 rounded-md text-xs h-10 transition-all group-hover:border-slate-300"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute right-1 top-1 h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-white rounded"
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
