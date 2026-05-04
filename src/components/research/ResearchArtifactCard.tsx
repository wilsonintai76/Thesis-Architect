import * as React from 'react';
import { 
  Link as LinkIcon, Wand2, RefreshCw, Copy, Plus, X, Quote, CheckCircle2 
} from 'lucide-react';
import { ResearchArtifact, Source } from '@/src/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResearchArtifactCardProps {
  artifact: ResearchArtifact;
  sources: Source[];
  autoLinkingId: string | null;
  refiningId: string | null;
  customRefiningPrompt: string;
  onAutoLink: (id: string) => void;
  onRefine: (id: string, instruction: 'rephrase' | 'expand' | 'custom') => void;
  onCopy: (text: string) => void;
  onInsert: (text: string) => void;
  onToggleLink: (artifactId: string, sourceId: string) => void;
  onUpdateRefiningPrompt: (value: string) => void;
}

export function ResearchArtifactCard({
  artifact,
  sources,
  autoLinkingId,
  refiningId,
  customRefiningPrompt,
  onAutoLink,
  onRefine,
  onCopy,
  onInsert,
  onToggleLink,
  onUpdateRefiningPrompt
}: ResearchArtifactCardProps) {
  const isRefining = refiningId === artifact.id;
  const isAutoLinking = autoLinkingId === artifact.id;

  return (
    <Card className="bg-white border-slate-200 shadow-sm overflow-hidden group/card transition-all duration-300">
      <div className="bg-slate-50/80 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">{artifact.type}</span>
          <span className="text-[10px] text-slate-500 font-medium truncate italic">{artifact.query}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
             onClick={() => onAutoLink(artifact.id)}
             disabled={!!autoLinkingId}
             className={`p-1.5 rounded-md transition-all ${isAutoLinking ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
             title="Auto-link relevant sources via AI"
          >
            <LinkIcon className={`w-3.5 h-3.5 ${isAutoLinking ? 'animate-pulse' : ''}`} />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger render={(props) => (
              <button 
                {...props}
                className={`p-1 flex items-center gap-1.5 px-2 rounded-md transition-all ${isRefining ? 'text-indigo-600 bg-indigo-50 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                disabled={!!refiningId}
              >
                {isRefining ? <RefreshCw className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-bold uppercase tracking-wider">Refine</span>
              </button>
            )} />
            <DropdownMenuContent align="end" className="w-48 p-1">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onRefine(artifact.id, 'rephrase')} className="text-[11px] font-bold uppercase tracking-wider p-2 cursor-pointer">
                  Rephrase (Academic)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRefine(artifact.id, 'expand')} className="text-[11px] font-bold uppercase tracking-wider p-2 cursor-pointer">
                  Expand (Depth)
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            onClick={() => onCopy(artifact.content)}
            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
            title="Copy content"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onInsert(artifact.content)}
            className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
            title="Insert into document"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <CardContent className="p-4">
         <div className={`${artifact.type === 'title' ? 'bg-indigo-50/30 p-4 rounded-lg border border-indigo-100/50' : ''} text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-serif`}>
           {artifact.content}
         </div>

         {/* Linked Sources Section */}
         <div className="mt-4 pt-3 border-t border-slate-100">
           <div className="flex items-center justify-between mb-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
               <LinkIcon className="w-2.5 h-2.5" /> Evidence Connections
             </label>
             
             <DropdownMenu>
               <DropdownMenuTrigger render={(props) => (
                 <Button {...props} variant="ghost" size="sm" className="h-5 px-2 text-[9px] font-bold uppercase tracking-wider text-indigo-600 hover:bg-indigo-50 gap-1">
                   <Plus className="w-2.5 h-2.5" /> Link Source
                 </Button>
               )} />
               <DropdownMenuContent align="end" className="w-64 p-1 max-h-60 overflow-y-auto">
                 <DropdownMenuGroup>
                   <DropdownMenuLabel className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1 font-mono">
                     Select Source from Library
                   </DropdownMenuLabel>
                   {sources.length === 0 ? (
                     <div className="p-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Library Empty</div>
                   ) : (
                     sources.map(s => {
                       const isLinked = artifact.linkedSourceIds?.includes(s.id);
                       return (
                         <DropdownMenuItem 
                           key={s.id} 
                           onClick={() => onToggleLink(artifact.id, s.id)}
                           className="flex flex-col items-start gap-0.5 p-2 rounded-lg cursor-pointer hover:bg-indigo-50"
                         >
                           <div className="flex items-center justify-between w-full">
                             <span className={`text-[11px] font-bold truncate pr-4 ${isLinked ? 'text-indigo-600' : 'text-slate-700'}`}>
                               {s.title}
                             </span>
                             {isLinked && <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" />}
                           </div>
                           <span className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">{s.authors} • {s.year}</span>
                         </DropdownMenuItem>
                       );
                     })
                   )}
                 </DropdownMenuGroup>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>

           <div className="flex flex-wrap gap-2">
             {artifact.linkedSourceIds?.map(srcId => {
               const source = sources.find(s => s.id === srcId);
               if (!source) return null;
               return (
                 <div key={srcId} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 group/link">
                   <div className="w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                     <Quote className="w-2 h-2 text-indigo-400" />
                   </div>
                   <span className="text-[10px] font-bold text-slate-600 max-w-[120px] truncate">{source.title}</span>
                   <button 
                     onClick={() => onToggleLink(artifact.id, srcId)}
                     className="text-slate-300 hover:text-rose-500 transition-colors ml-1"
                   >
                     <X className="w-2.5 h-2.5" />
                   </button>
                 </div>
               );
             })}
             {(!artifact.linkedSourceIds || artifact.linkedSourceIds.length === 0) && (
               <span className="text-[10px] text-slate-300 font-medium italic">No research artifacts linked to source data yet.</span>
             )}
           </div>
         </div>
         
         <div className="mt-4 flex flex-col gap-2">
           <div className="relative">
              <Input 
                placeholder="Custom refinement instructions (e.g., 'summarize', 'more data')..."
                className="h-8 text-[11px] pr-10 bg-slate-50/50 focus:bg-white transition-all border-slate-100"
                value={isRefining ? customRefiningPrompt : ''}
                onChange={(e) => onUpdateRefiningPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRefine(artifact.id, 'custom');
                }}
              />
              <button 
                onClick={() => onRefine(artifact.id, 'custom')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-700 disabled:opacity-30"
              >
                <Wand2 className="w-3.5 h-3.5" />
              </button>
           </div>
         </div>
      </CardContent>
    </Card>
  );
}
