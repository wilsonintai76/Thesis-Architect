import * as React from 'react';
import { RefreshCw, Bot, User } from 'lucide-react';
import { AIAssistantMessage } from '@/src/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';

interface AIMessageListProps {
  messages: AIAssistantMessage[];
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function AIMessageList({ messages, isLoading, scrollRef }: AIMessageListProps) {
  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-3.5 rounded-lg text-[13px] leading-relaxed shadow-sm border ${
                m.role === 'user' 
                ? 'bg-white text-slate-700 border-slate-200 max-w-[90%]' 
                : 'bg-indigo-600 text-white border-indigo-500 max-w-[90%]'
              }`}>
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex gap-3">
            <div className="p-3 shadow-sm rounded-lg bg-white border border-slate-200 max-w-[90%] flex items-center gap-3">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span className="text-[11px] text-slate-500 font-medium italic">Synthesizing data...</span>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
