import * as React from 'react';
import { 
  FileText, BookOpen, Settings, Search, Download, 
  ExternalLink, Share2, Library, GraduationCap, Maximize, Minimize,
  Compass, ChevronDown, Check
} from 'lucide-react';
import { Source, Paper, DocumentVersion } from './types';
import { SourceManager } from './components/SourceManager';
import { Outline } from './components/Outline';
import { Editor } from './components/Editor';
import { AIAssistant } from './components/AIAssistant';
import { VersionHistory } from './components/VersionHistory';
import { ResearchStudio } from './components/ResearchStudio';
import { exportToDocx, exportToMarkdown, exportToPlainText } from './services/exportService';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { STYLE_PROFILES } from './constants/styleProfiles';

export default function App() {
  const [selectedProfileId, setSelectedProfileId] = React.useState('apa');
  const [sources, setSources] = React.useState<Source[]>([
    {
      id: 'src1',
      type: 'journal',
      title: 'Large Language Models in Academic Writing',
      authors: 'Zhang, Y., & Miller, R.',
      year: '2023',
      journal: 'Human-Computer Interaction',
      addedAt: Date.now() - 1000000
    }
  ]);
  const [content, setContent] = React.useState<any>({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'The Future of AI-Assisted Research' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'In recent years, the landscape of academic publishing has undergone a significant transformation. ' },
          { 
            type: 'citation', 
            attrs: { sourceId: 'src1', label: 'Zhang, 2023' } 
          },
          { type: 'text', text: ' This paper explores how modern tools can support researchers while maintaining high ethical standards.' }
        ]
      }
    ]
  });
  const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);
  const [isResearchOpen, setIsResearchOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('editor');
  const [activeSidebar, setActiveSidebar] = React.useState<'outline' | 'library'>('library');
  const [isSidebarVisible, setIsSidebarVisible] = React.useState(true);
  const [isFocusMode, setIsFocusMode] = React.useState(false);
  const [versions, setVersions] = React.useState<DocumentVersion[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [versionToRestore, setVersionToRestore] = React.useState<DocumentVersion | null>(null);
  const [sourceToInsert, setSourceToInsert] = React.useState<Source | null>(null);
  const [selectedText, setSelectedText] = React.useState('');
  const [textToInsert, setTextToInsert] = React.useState<string | null>(null);

  const saveVersion = () => {
    if (!content) return;
    const newVersion: DocumentVersion = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      content: content,
      author: 'Current User', // Just mock it since we don't have auth currently
    };
    setVersions(prev => [newVersion, ...prev]);
    toast.success('Version saved');
  };

  const restoreVersion = (version: DocumentVersion) => {
    setVersionToRestore(version);
    toast.info(`Restored version from ${new Date(version.timestamp).toLocaleTimeString()}`);
  };

  const citationCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (!content) return counts;

    const traverse = (node: any) => {
      if (node.type === 'citation' && node.attrs?.sourceId) {
        const id = node.attrs.sourceId;
        counts[id] = (counts[id] || 0) + 1;
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    };

    traverse(content);
    return counts;
  }, [content]);

  const handleAddSource = (source: Source) => {
    setSources(prev => [...prev, source]);
    toast.success('Source added to library');
  };

  const handleRemoveSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    toast.info('Source removed');
  };

  const toggleSidebar = (panel: 'outline' | 'library') => {
    if (activeSidebar === panel && isSidebarVisible) {
      setIsSidebarVisible(false);
    } else {
      setActiveSidebar(panel);
      setIsSidebarVisible(true);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-slate-900 font-sans text-slate-900 overflow-hidden">
        {/* Activity Bar (VS Code Style) */}
        {!isFocusMode && (
          <div className="w-14 flex flex-col items-center py-4 bg-slate-950 text-slate-500 gap-6 border-r border-slate-800 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white mb-2 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <GraduationCap className="w-5 h-5" />
            </div>
            
            <div className="flex flex-col gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`w-10 h-10 rounded-lg transition-all ${
                  activeSidebar === 'outline' && isSidebarVisible ? 'text-white bg-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
                onClick={() => toggleSidebar('outline')}
              >
                <FileText className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`w-10 h-10 rounded-lg transition-all ${
                  activeSidebar === 'library' && isSidebarVisible ? 'text-white bg-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
                onClick={() => toggleSidebar('library')}
              >
                <Library className="w-5 h-5" />
              </Button>
            </div>

            <div className="mt-auto flex flex-col gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`w-10 h-10 rounded-lg transition-all ${
                  isAssistantOpen ? 'text-indigo-400 bg-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
                onClick={() => {
                  setIsAssistantOpen(!isAssistantOpen);
                  setIsResearchOpen(false);
                  setIsHistoryOpen(false);
                }}
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`w-10 h-10 rounded-lg transition-all ${
                    isResearchOpen ? 'text-indigo-400 bg-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
                onClick={() => {
                    setIsResearchOpen(!isResearchOpen);
                    setIsAssistantOpen(false);
                    setIsHistoryOpen(false);
                }}
                title="Research Studio"
              >
                <Compass className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 text-slate-500 hover:text-slate-300">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Sidebar Panel */}
        {!isFocusMode && isSidebarVisible && (
          <div className="h-full">
            {activeSidebar === 'library' ? (
              <SourceManager 
                sources={sources} 
                citationCounts={citationCounts}
                onAddSource={handleAddSource} 
                onRemoveSource={handleRemoveSource} 
                onInsertSource={(source) => {
                  setSourceToInsert(source);
                  setActiveTab('editor'); // Switch back to editor tab if not already
                  toast.success(`Inserting citation: ${source.authors.split(',')[0]} (${source.year})`);
                }}
              />
            ) : (
              <Outline 
                content={content} 
                onNavigate={(id) => {
                  const element = document.getElementById(id);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }} 
              />
            )}
          </div>
        )}

        <main className="flex-1 flex flex-col bg-slate-50 min-w-0 h-full relative">
          <header className={`h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 z-10 transition-all ${isFocusMode ? 'border-b-0 absolute top-0 w-full hover:opacity-100 opacity-20 bg-white/50 backdrop-blur-sm' : ''}`}>
            <div className="flex items-center gap-6">
              {!isFocusMode && (
                <>
                  <div className="flex flex-col">
                    <h1 className="text-sm font-bold text-slate-900 leading-tight tracking-tight uppercase">Thesis Architect</h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Manuscript Editor v4.2</p>
                  </div>
                  <div className="h-4 w-px bg-slate-200 ml-2" />
                </>
              )}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-slate-100/80 p-0.5 h-8 gap-1">
                  <TabsTrigger value="editor" className="text-[10px] px-4 h-7 uppercase tracking-wider font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Draft</TabsTrigger>
                  <TabsTrigger value="bibliography" className="text-[10px] px-4 h-7 uppercase tracking-wider font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">References</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-3">
              {!isFocusMode && (
                <div className="flex -space-x-2 mr-2">
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-blue-400 shadow-sm" />
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`h-8 gap-2 border-slate-200 ${isFocusMode ? 'text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100' : 'text-slate-600'}`}
              >
                {isFocusMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
              </Button>

              {!isFocusMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="outline" size="sm" className="h-8 gap-2 text-slate-900 border-slate-200 bg-white font-bold text-[10px] uppercase tracking-wider">
                      Style: {STYLE_PROFILES[selectedProfileId]?.name || 'Standard'} <ChevronDown className="w-3 h-3" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">Examiner Presets</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.values(STYLE_PROFILES).map((profile) => (
                        <DropdownMenuItem 
                          key={profile.id} 
                          onClick={() => setSelectedProfileId(profile.id)}
                          className="flex flex-col items-start gap-0.5 py-2"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs">{profile.name}</span>
                            {selectedProfileId === profile.id && <Check className="w-3 h-3 text-indigo-600" />}
                          </div>
                          <span className="text-[9px] text-slate-500 line-clamp-1">{profile.description}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button size="sm" className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200">
                    <Download className="w-4 h-4" /> Export
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => toast.success('Exporting PDF...')}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    toast.promise(exportToDocx(content, sources, 'Manuscript', selectedProfileId), {
                      loading: 'Generating Word document...',
                      success: 'Word document downloaded',
                      error: 'Failed to generate Word document'
                    });
                  }}>
                    Export as Word (.docx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    toast.promise(exportToMarkdown(content, sources), {
                      loading: 'Generating Markdown file...',
                      success: 'Markdown exported successfully',
                      error: 'Failed to export Markdown'
                    });
                  }}>
                    Export as Markdown (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    toast.promise(exportToPlainText(content, sources), {
                      loading: 'Generating Plain Text file...',
                      success: 'Plain Text exported successfully',
                      error: 'Failed to export Plain Text'
                    });
                  }}>
                    Export as Plain Text (.txt)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 flex relative overflow-hidden">
            <div className="flex-1 h-full overflow-hidden">
              {activeTab === 'editor' ? (
                <Editor 
                  content={content} 
                  sources={sources} 
                  versionToRestore={versionToRestore}
                  sourceToInsert={sourceToInsert}
                  textToInsert={textToInsert}
                  onInsertSourceComplete={() => setSourceToInsert(null)}
                  onInsertTextComplete={() => setTextToInsert(null)}
                  onSelectionChange={setSelectedText}
                  onChange={setContent} 
                  onAISuggest={() => {
                    setIsAssistantOpen(true);
                    setIsResearchOpen(false);
                  }}
                  onOpenVersions={() => {
                    setIsHistoryOpen(true);
                    setIsAssistantOpen(false);
                    setIsResearchOpen(false);
                  }}
                />
              ) : (
                <ScrollArea className="h-full bg-slate-100/20">
                  <div className="max-w-3xl mx-auto py-16 px-12 pb-32">
                    <h2 className="text-3xl font-serif mb-12 border-b border-slate-200 pb-4 italic text-slate-900">References</h2>
                    {sources.length === 0 ? (
                      <div className="text-center py-20 text-slate-400 italic font-serif">
                        No references added yet. Add sources in the sidebar to generate your bibliography.
                      </div>
                    ) : (
                      <div className="space-y-6 font-serif leading-relaxed">
                        {sources
                          .sort((a, b) => a.authors.localeCompare(b.authors))
                          .map((source) => (
                          <div key={source.id} className="pl-8 -indent-8 text-sm text-slate-800">
                            <span className="font-semibold text-slate-950">{source.authors}</span> ({source.year}). 
                            <span className="italic text-slate-900"> {source.title}</span>. 
                            {source.publisher ? ` ${source.publisher}.` : ''} 
                            {source.journal ? ` ${source.journal}.` : ''}
                            {source.url && <span className="text-indigo-600 break-all ml-2 font-mono text-[11px]">[{source.url}]</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {isAssistantOpen && (
              <AIAssistant 
                paperContent={JSON.stringify(content)} 
                selectedText={selectedText}
                sources={JSON.stringify(sources)}
                onClose={() => setIsAssistantOpen(false)}
              />
            )}

            {isResearchOpen && (
              <ResearchStudio 
                paperContent={JSON.stringify(content)}
                sources={sources}
                onInsertText={(text) => {
                  setTextToInsert(text);
                  setActiveTab('editor');
                  toast.success('Text prepared for insertion');
                }}
                onClose={() => setIsResearchOpen(false)}
              />
            )}
            
            {isHistoryOpen && (
              <VersionHistory 
                versions={versions}
                onRestore={restoreVersion}
                onSaveVersion={saveVersion}
                onClose={() => setIsHistoryOpen(false)}
              />
            )}
          </div>
        </main>
        <Toaster position="bottom-right" theme="light" expand={true} richColors />
      </div>
    </TooltipProvider>
  );
}
