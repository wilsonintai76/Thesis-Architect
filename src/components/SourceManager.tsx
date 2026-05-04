import * as React from 'react';
import { Plus, Trash2, Edit2, BookOpen, Globe, Newspaper, Hash } from 'lucide-react';
import { Source, SourceType } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SourceManagerProps {
  sources: Source[];
  citationCounts?: Record<string, number>;
  onAddSource: (source: Source) => void;
  onRemoveSource: (id: string) => void;
  onInsertSource: (source: Source) => void;
}

export function SourceManager({ sources, citationCounts = {}, onAddSource, onRemoveSource, onInsertSource }: SourceManagerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [newSource, setNewSource] = React.useState<Partial<Source>>({
    type: 'article',
    title: '',
    authors: '',
    year: '',
  });

  const filteredSources = sources.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.year.includes(searchQuery)
  );

  const handleAdd = () => {
    if (!newSource.title || !newSource.authors || !newSource.year) return;
    
    const source: Source = {
      id: Math.random().toString(36).substring(7),
      type: newSource.type as SourceType,
      title: newSource.title as string,
      authors: newSource.authors as string,
      year: newSource.year as string,
      publisher: newSource.publisher,
      url: newSource.url,
      journal: newSource.journal,
      addedAt: Date.now(),
    };

    onAddSource(source);
    setNewSource({ type: 'article', title: '', authors: '', year: '' });
    setIsOpen(false);
  };

  const getIcon = (type: SourceType) => {
    switch (type) {
      case 'book': return <BookOpen className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      case 'journal': return <Newspaper className="w-4 h-4" />;
      default: return <Newspaper className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] border-r border-slate-200 w-64 shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col gap-3 mb-2">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Research Library</h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger render={
              <Button size="sm" className="w-full h-8 gap-2 bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-100">
                <Plus className="w-3.5 h-3.5" /> Add Source
              </Button>
            } />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading italic">New Research Entry</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Source Type</Label>
                  <Select 
                    value={newSource.type} 
                    onValueChange={(val) => setNewSource({ ...newSource, type: val as SourceType })}
                  >
                    <SelectTrigger className="h-9 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Journal Article</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="journal">Journal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Full Title</Label>
                  <Input 
                    placeholder="E.g. The Impact of AI on Modern Research" 
                    className="h-9 border-slate-200"
                    value={newSource.title}
                    onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Authors</Label>
                  <Input 
                    placeholder="E.g. Smith, J., & Doe, A." 
                    className="h-9 border-slate-200"
                    value={newSource.authors}
                    onChange={(e) => setNewSource({ ...newSource, authors: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Year</Label>
                    <Input 
                      placeholder="2024" 
                      className="h-9 border-slate-200"
                      value={newSource.year}
                      onChange={(e) => setNewSource({ ...newSource, year: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Journal/Pub</Label>
                    <Input 
                      placeholder="Nature" 
                      className="h-9 border-slate-200"
                      value={newSource.publisher || newSource.journal}
                      onChange={(e) => setNewSource({ ...newSource, publisher: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 h-9 px-6 font-bold text-xs uppercase tracking-wider">Save Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-3 py-4">
          <div className="mb-4">
            <Input 
              placeholder="Search sources..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs border-slate-200"
            />
          </div>
          <div className="flex gap-1.5 mb-4">
            <div className="bg-slate-200 text-[9px] font-bold px-2 py-0.5 rounded text-slate-600 uppercase tracking-tighter">APA 7th</div>
            <div className="text-[9px] font-bold px-2 py-0.5 text-slate-400 uppercase tracking-tighter">MLA</div>
            <div className="text-[9px] font-bold px-2 py-0.5 text-slate-400 uppercase tracking-tighter">Chicago</div>
          </div>
          {filteredSources.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-[11px] font-medium leading-relaxed italic">Your bibliography is currently empty.</p>
            </div>
          ) : (
            filteredSources.sort((a, b) => b.addedAt - a.addedAt).map((source) => (
              <Card key={source.id} className="shadow-sm border border-slate-200 bg-white rounded overflow-hidden group">
                <CardContent className="p-3 border-l-4 border-transparent group-hover:border-indigo-500 transition-all">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-[11px] font-bold text-slate-900 leading-tight">
                      {source.authors.split(',')[0]} ({source.year})
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-5 h-5 text-slate-300 hover:text-destructive shrink-0"
                      onClick={() => onRemoveSource(source.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <h3 className="text-[10px] text-slate-500 line-clamp-2 leading-snug font-serif italic mb-2">
                    {source.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onInsertSource(source)}
                        className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider hover:underline"
                      >
                        Insert
                      </button>
                      <button className="text-[9px] text-slate-400 font-bold uppercase tracking-wider hover:text-slate-600">Details</button>
                    </div>
                    {citationCounts[source.id] > 0 && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm border border-emerald-100">
                        <Hash className="w-2.5 h-2.5" />
                        <span>{citationCounts[source.id]}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="mt-auto p-4 border-t border-slate-200">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Manuscript Progress</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
            <div className="bg-indigo-500 h-full w-[65%] rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)]"></div>
          </div>
          <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
            <span>6,420 words</span>
            <span>65% done</span>
          </div>
        </div>
      </div>
    </div>
  );
}
