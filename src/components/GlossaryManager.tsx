import * as React from 'react';
import { Book, Plus, Search, Trash2, Link as LinkIcon, Edit3, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { GlossaryEntry } from '@/src/types';
import { toast } from 'sonner';

interface GlossaryManagerProps {
  entries: GlossaryEntry[];
  onAddEntry: (entry: GlossaryEntry) => void;
  onRemoveEntry: (id: string) => void;
  onUpdateEntry: (entry: GlossaryEntry) => void;
  onNavigateToSection: (id: string) => void;
  headings: { id: string; text: string }[];
}

export function GlossaryManager({ 
  entries = [], 
  onAddEntry, 
  onRemoveEntry, 
  onUpdateEntry,
  onNavigateToSection,
  headings 
}: GlossaryManagerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  
  const [formData, setFormData] = React.useState<Partial<GlossaryEntry>>({
    term: '',
    definition: '',
    category: ''
  });

  const filteredEntries = entries.filter(e => 
    e.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.term || !formData.definition) {
      toast.error('Term and definition are required');
      return;
    }

    if (editingId) {
      onUpdateEntry({ ...formData, id: editingId } as GlossaryEntry);
      setEditingId(null);
    } else {
      onAddEntry({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      } as GlossaryEntry);
    }

    setFormData({ term: '', definition: '', category: '' });
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Book className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Lexicon & Glossary</h2>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsAdding(true)}
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Add Term</span>
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input 
            placeholder="Filter terminology..." 
            className="pl-9 h-9 bg-slate-50 border-slate-100 text-xs focus-visible:ring-indigo-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isAdding || editingId ? (
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                  {editingId ? 'Edit Definition' : 'New Term Entry'}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setIsAdding(false); setEditingId(null); }}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Input 
                placeholder="Term (e.g. Heuristic)" 
                className="h-9 text-xs bg-white"
                value={formData.term}
                onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
              />
              <textarea 
                placeholder="Definition or contextual meaning..."
                className="w-full min-h-[100px] p-3 text-xs rounded-md border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none resize-none bg-white"
                value={formData.definition}
                onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
              />
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <Input 
                    placeholder="Category" 
                    className="h-8 pl-8 text-[10px] bg-white uppercase font-bold"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <select 
                  className="flex-1 h-8 px-2 text-[10px] rounded-md border border-slate-200 bg-white font-bold outline-none"
                  value={formData.linkedSectionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedSectionId: e.target.value }))}
                >
                  <option value="">No Link</option>
                  {headings.map(h => <option key={h.id} value={h.id}>{h.text}</option>)}
                </select>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-9 text-[10px] font-black uppercase tracking-widest shadow-md shadow-indigo-100" onClick={handleSubmit}>
                {editingId ? 'Update Entry' : 'Add to Glossary'}
              </Button>
            </div>
          ) : null}

          {filteredEntries.length === 0 && !isAdding ? (
            <div className="py-20 text-center">
              <Book className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Scientific Lexicon is Empty</p>
              <Button 
                variant="link" 
                className="text-[10px] font-black uppercase text-indigo-500 mt-2"
                onClick={() => setIsAdding(true)}
              >
                Create First Entry
              </Button>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="group p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 transition-all hover:shadow-md hover:shadow-indigo-50/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{entry.term}</h3>
                    {entry.category && (
                      <Badge variant="secondary" className="bg-slate-200/50 text-slate-500 text-[8px] px-1.5 h-4 uppercase font-black tracking-tighter">
                        {entry.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" onClick={() => {
                      setEditingId(entry.id);
                      setFormData(entry);
                    }}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => onRemoveEntry(entry.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-3">{entry.definition}</p>
                {entry.linkedSectionId && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 bg-white border border-slate-100 text-indigo-600 hover:bg-indigo-50 rounded-lg gap-2"
                    onClick={() => onNavigateToSection(entry.linkedSectionId!)}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Navigate To Section</span>
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
