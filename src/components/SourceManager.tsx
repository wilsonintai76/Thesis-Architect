import * as React from 'react';
import { Plus, Trash2, Edit2, BookOpen, Globe, Newspaper, Hash, FileUp, FileText, ClipboardList } from 'lucide-react';
import { Source, SourceType } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseRIS, parseBibTeX } from '../services/citationParser';
import { toast } from 'sonner';

interface SourceManagerProps {
  sources: Source[];
  citationCounts?: Record<string, number>;
  currentProfileId: string;
  onProfileChange: (id: string) => void;
  onAddSource: (source: Source) => void;
  onRemoveSource: (id: string) => void;
  onInsertSource: (source: Source) => void;
}

export function SourceManager({ 
  sources, 
  citationCounts = {}, 
  currentProfileId,
  onProfileChange,
  onAddSource, 
  onRemoveSource, 
  onInsertSource 
}: SourceManagerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importText, setImportText] = React.useState('');
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

  const STYLES = [
    { id: 'apa', label: 'APA 7' },
    { id: 'mla', label: 'MLA' },
    { id: 'chicago', label: 'Chicago' },
  ];

  const handleAdd = () => {
    if (!newSource.title || !newSource.authors || !newSource.year) {
      toast.error('Please fill in required fields');
      return;
    }
    
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
    toast.success('Source added to library');
  };

  const handleImport = (type: 'ris' | 'bib') => {
    if (!importText.trim()) return;

    try {
      const parsed = type === 'ris' ? parseRIS(importText) : parseBibTeX(importText);
      
      if (parsed.length === 0) {
        toast.error(`No valid ${type.toUpperCase()} entries found`);
        return;
      }

      parsed.forEach(p => {
        const source: Source = {
          id: Math.random().toString(36).substring(7),
          type: (p.type || 'article') as SourceType,
          title: p.title || 'Untitled',
          authors: p.authors || 'Unknown Author',
          year: p.year || 'n.d.',
          publisher: p.publisher,
          url: p.url,
          journal: p.journal,
          doi: p.doi,
          addedAt: Date.now(),
        };
        onAddSource(source);
      });

      toast.success(`Imported ${parsed.length} sources successfully`);
      setImportText('');
      setIsImportOpen(false);
    } catch (err) {
      toast.error('Failed to parse import data');
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const isBib = file.name.endsWith('.bib');
      const isRis = file.name.endsWith('.ris');
      
      if (isBib) {
        setImportText(content);
        // We could auto-detect but let's just populate the text area
      } else if (isRis) {
        setImportText(content);
      }
    };
    reader.readAsText(file);
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
    <div className="flex flex-col h-full bg-slate-50/50 border-r border-slate-200 w-72 shrink-0 shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)] transition-all duration-300 overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Research Library</h2>
          </div>
          <div className="flex gap-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger render={
                <Button size="sm" className="flex-1 h-9 gap-2 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all font-bold text-[10px] uppercase tracking-wider rounded-lg">
                  <Plus className="w-3.5 h-3.5" /> Add Source
                </Button>
              } />
              <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="font-heading italic text-slate-900 border-b border-slate-100 pb-2">New Research Entry</DialogTitle>
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

            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger render={
                <Button size="sm" variant="outline" className="h-8 gap-2 bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-100">
                  <FileUp className="w-3.5 h-3.5" /> Import
                </Button>
              } />
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="font-heading italic">Import from Zotero / EndNote</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Tabs defaultValue="paste" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 h-9 bg-slate-100">
                      <TabsTrigger value="paste" className="text-[10px] font-bold uppercase">Paste Content</TabsTrigger>
                      <TabsTrigger value="file" className="text-[10px] font-bold uppercase">Upload File</TabsTrigger>
                    </TabsList>
                    <TabsContent value="paste" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-slate-400">Paste RIS or BibTeX text</Label>
                        <textarea
                          placeholder="TY  - JOUR
AU  - Smith, John
TI  - Exploring AI..."
                          className="w-full h-48 p-3 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => handleImport('ris')} className="text-[10px] font-bold uppercase h-8">Import as RIS</Button>
                        <Button variant="default" onClick={() => handleImport('bib')} className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold uppercase h-8">Import as BibTeX</Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="file" className="mt-4">
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer relative">
                        <input
                          type="file"
                          accept=".ris,.bib"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                        />
                        <FileText className="w-8 h-8 mx-auto mb-4 text-slate-300" />
                        <p className="text-[11px] text-slate-500 mb-1">Click or drag a .ris or .bib file here</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Supported: RIS, BibTeX</p>
                        {importText && (
                          <div className="mt-4 p-2 bg-emerald-50 border border-emerald-100 rounded text-emerald-700 text-[10px] font-bold">
                            File loaded successfully. Go to "Paste Content" to verify or import.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-6">
          <div className="mb-2">
            <Input 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 text-[13px] bg-white border-slate-200 shadow-sm rounded-lg"
            />
          </div>
          <div className="flex gap-2 mb-6">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => onProfileChange(style.id)}
                className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest transition-all ${
                  currentProfileId === style.id 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
          {filteredSources.length === 0 ? (
            <div className="text-center py-16 text-slate-300">
              <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed italic px-4">Your conceptual library is currently silent.</p>
            </div>
          ) : (
            filteredSources.sort((a, b) => b.addedAt - a.addedAt).map((source) => (
              <Card key={source.id} className="shadow-sm hover:shadow-md border border-slate-200 bg-white rounded-xl overflow-hidden group transition-all duration-200 hover:-translate-y-0.5">
                <CardContent className="p-4 border-l-4 border-transparent group-hover:border-indigo-600 transition-all">
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <p className="text-[12px] font-black text-slate-900 leading-tight tracking-tight">
                      {source.authors.split(',')[0]} ({source.year})
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-6 h-6 text-slate-200 hover:text-rose-500 hover:bg-rose-50 shrink-0 transition-colors"
                      onClick={() => onRemoveSource(source.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <h3 className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-serif italic mb-3">
                    {source.title}
                  </h3>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onInsertSource(source)}
                        className="text-[10px] text-indigo-600 font-black uppercase tracking-wider hover:text-indigo-800 transition-colors"
                      >
                        Cite
                      </button>
                      <button className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hover:text-slate-700 transition-colors">Explore</button>
                    </div>
                    {citationCounts[source.id] > 0 && (
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shadow-sm border border-emerald-100/50">
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
