import * as React from 'react';
import { Target, Compass, Lightbulb, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';

interface Template {
  title: string;
  description: string;
  prompt: string;
  icon: React.ReactNode;
}

interface ResearchTemplateSectionProps {
  onSelect: (prompt: string) => void;
}

export const templates: Template[] = [
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

export function ResearchTemplateSection({ onSelect }: ResearchTemplateSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {templates.map((t, idx) => (
        <Card 
          key={idx} 
          className="group border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden rounded-xl"
          onClick={() => onSelect(t.prompt)}
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
  );
}
