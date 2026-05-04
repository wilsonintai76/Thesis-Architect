import * as React from 'react';
import { 
  FileText, Library, Share2, Compass, Settings, GraduationCap, Book
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityBarProps {
  activeSidebar: 'outline' | 'library' | 'glossary';
  isSidebarVisible: boolean;
  isAssistantOpen: boolean;
  isResearchOpen: boolean;
  onToggleSidebar: (panel: 'outline' | 'library' | 'glossary') => void;
  onToggleAssistant: () => void;
  onToggleResearch: () => void;
  onOpenSettings: () => void;
}

export function ActivityBar({
  activeSidebar,
  isSidebarVisible,
  isAssistantOpen,
  isResearchOpen,
  onToggleSidebar,
  onToggleAssistant,
  onToggleResearch,
  onOpenSettings
}: ActivityBarProps) {
  return (
    <div className="w-16 flex flex-col items-center py-6 bg-slate-950 text-slate-500 gap-6 border-r border-slate-800 shrink-0 z-50">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white mb-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-transform hover:scale-105 active:scale-95 cursor-pointer">
        <GraduationCap className="w-6 h-6" />
      </div>
      
      <div className="flex flex-col gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`w-11 h-11 rounded-xl transition-all ${
            activeSidebar === 'outline' && isSidebarVisible ? 'text-white bg-slate-800 shadow-xl border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
          }`}
          onClick={() => onToggleSidebar('outline')}
        >
          <FileText className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`w-11 h-11 rounded-xl transition-all ${
            activeSidebar === 'library' && isSidebarVisible ? 'text-white bg-slate-800 shadow-xl border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
          }`}
          onClick={() => onToggleSidebar('library')}
        >
          <Library className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`w-11 h-11 rounded-xl transition-all ${
            activeSidebar === 'glossary' && isSidebarVisible ? 'text-white bg-slate-800 shadow-xl border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
          }`}
          onClick={() => onToggleSidebar('glossary')}
        >
          <Book className="w-5 h-5" />
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`w-11 h-11 rounded-xl transition-all ${
            isAssistantOpen ? 'text-indigo-400 bg-slate-800 shadow-xl border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
          }`}
          onClick={onToggleAssistant}
        >
          <Share2 className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`w-11 h-11 rounded-xl transition-all ${
              isResearchOpen ? 'text-indigo-400 bg-slate-800 shadow-xl border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
          }`}
          onClick={onToggleResearch}
        >
          <Compass className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-11 h-11 rounded-xl transition-all text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
          onClick={onOpenSettings}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
