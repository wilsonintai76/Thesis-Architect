import * as React from 'react';
import { 
  FileText, BookOpen, Settings, Search, Download, 
  ExternalLink, Share2, Library, GraduationCap, Maximize, Minimize,
  Compass, ChevronDown, Check, LogOut, User as UserIcon
} from 'lucide-react';
import { Source, Paper, DocumentVersion } from './types';
import { SourceManager } from './components/SourceManager';
import { Outline } from './components/Outline';
import { Editor } from './components/Editor';
import { AIAssistant } from './components/AIAssistant';
import { VersionHistory } from './components/VersionHistory';
import { ResearchStudio } from './components/ResearchStudio';
import { SettingsDialog } from './components/SettingsDialog';
import { exportToDocx, exportToMarkdown, exportToPlainText } from './services/exportService';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { STYLE_PROFILES } from './constants/styleProfiles';
import { useAuth } from './lib/AuthContext';
import { LandingPage } from './components/LandingPage';
import { logout } from './lib/firebase';
import { usePersistence } from './hooks/usePersistence';

export default function App() {
  const { user, loading } = useAuth();
  const { documents, activeDocId, setActiveDocId, saveDocument, createDocument } = usePersistence(user);
  
  const [selectedProfileId, setSelectedProfileId] = React.useState('apa');
  const [sources, setSources] = React.useState<Source[]>([]);
  const [content, setContent] = React.useState<any>(null);
  const [isAssistantOpen, setIsAssistantOpen] = React.useState(false);
  const [isResearchOpen, setIsResearchOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('editor');
  const [activeSidebar, setActiveSidebar] = React.useState<'outline' | 'library'>('library');
  const [isSidebarVisible, setIsSidebarVisible] = React.useState(true);
  const [isFocusMode, setIsFocusMode] = React.useState(false);
  const [versions, setVersions] = React.useState<DocumentVersion[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [userName, setUserName] = React.useState(user?.displayName || 'Research User');
  const [versionToRestore, setVersionToRestore] = React.useState<DocumentVersion | null>(null);
  const [sourceToInsert, setSourceToInsert] = React.useState<Source | null>(null);
  const [selectedText, setSelectedText] = React.useState('');
  const [textToInsert, setTextToInsert] = React.useState<string | null>(null);

  // Load active document data
  React.useEffect(() => {
    if (activeDocId && documents.length > 0) {
      const activeDoc = documents.find(d => d.id === activeDocId);
      if (activeDoc) {
        setContent(activeDoc.content);
        setSources(activeDoc.sources || []);
        setVersions(activeDoc.versions || []);
      }
    } else if (user && documents.length === 0 && !activeDocId) {
       // Create initial doc if none exist
       createDocument('Untitled Research', {
         type: 'doc',
         content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'New Research Project' }] }]
       });
    }
  }, [activeDocId, documents, user]);

  // Auto-save logic
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const handleContentChange = (newContent: any) => {
    setContent(newContent);
    if (activeDocId) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(activeDocId, { content: newContent, sources, versions });
      }, 2000); // 2 second debounce
    }
  };

  React.useEffect(() => {
    if (user) {
      setUserName(user.displayName || 'Research User');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.4)] animate-pulse">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] animate-bounce">Synthesizing Workspace</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage />
        <Toaster position="bottom-right" theme="dark" richColors />
      </>
    );
  }

  const saveVersion = () => {
    if (!content) return;
    const newVersion: DocumentVersion = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      content: content,
      author: userName,
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
    const newSources = [...sources, source];
    setSources(newSources);
    if (activeDocId) {
      saveDocument(activeDocId, { content, sources: newSources, versions });
    }
    toast.success('Source added to library');
  };

  const handleRemoveSource = (id: string) => {
    const newSources = sources.filter(s => s.id !== id);
    setSources(newSources);
    if (activeDocId) {
      saveDocument(activeDocId, { content, sources: newSources, versions });
    }
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
      <div className="flex h-screen bg-slate-950 font-sans text-slate-900 overflow-hidden relative">
        {/* Activity Bar - Compact and optimized */}
        {!isFocusMode && (
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
                onClick={() => toggleSidebar('outline')}
              >
                <FileText className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`w-11 h-11 rounded-xl transition-all ${
                  activeSidebar === 'library' && isSidebarVisible ? 'text-white bg-slate-800 shadow-xl border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
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
                className={`w-11 h-11 rounded-xl transition-all ${
                  isAssistantOpen ? 'text-indigo-400 bg-slate-800 shadow-xl border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
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
                className={`w-11 h-11 rounded-xl transition-all ${
                    isResearchOpen ? 'text-indigo-400 bg-slate-800 shadow-xl border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                }`}
                onClick={() => {
                    setIsResearchOpen(!isResearchOpen);
                    setIsAssistantOpen(false);
                    setIsHistoryOpen(false);
                }}
              >
                <Compass className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`w-11 h-11 rounded-xl transition-all ${
                  isSettingsOpen ? 'text-indigo-400 bg-slate-800 shadow-xl border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                }`}
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Sidebar Panel - Responsive Width */}
        {!isFocusMode && isSidebarVisible && (
          <div className="h-full animate-in slide-in-from-left duration-300 shadow-2xl z-40 bg-white">
            {activeSidebar === 'library' ? (
              <SourceManager 
                sources={sources} 
                citationCounts={citationCounts}
                onAddSource={handleAddSource} 
                onRemoveSource={handleRemoveSource} 
                onInsertSource={(source) => {
                  setSourceToInsert(source);
                  setActiveTab('editor');
                  toast.success(`Active Reference: ${source.authors.split(',')[0]} (${source.year})`);
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

        <main className="flex-1 flex flex-col bg-slate-100 min-w-0 h-full relative overflow-hidden">
          <header className={`h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md shrink-0 z-30 transition-all ${isFocusMode ? 'border-b-0 absolute top-0 w-full hover:opacity-100 opacity-20 bg-white shadow-lg' : ''}`}>
            <div className="flex items-center gap-6">
              {!isFocusMode && (
                <div className="flex flex-col">
                  <h1 className="text-xs font-black text-slate-900 leading-none tracking-[0.2em] mb-1 uppercase">Thesis Architect</h1>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black opacity-60">Synthesis Environment v4.2</p>
                </div>
              )}
              <div className="h-4 w-px bg-slate-200" />
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-slate-100/50 p-1 h-9 rounded-lg border border-slate-200/50">
                  <TabsTrigger value="editor" className="text-[10px] px-6 h-7 uppercase tracking-[0.15em] font-black data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all">Manuscript</TabsTrigger>
                  <TabsTrigger value="bibliography" className="text-[10px] px-6 h-7 uppercase tracking-[0.15em] font-black data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-md transition-all">Bibliography</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`h-9 px-4 gap-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${isFocusMode ? 'text-indigo-600 bg-indigo-50 shadow-inner' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {isFocusMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                {isFocusMode ? 'Exit Concentration' : 'Focus Mode'}
              </Button>

              {!isFocusMode && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-800 border-slate-200 bg-white font-black text-[10px] rounded-lg uppercase tracking-widest shadow-sm hover:shadow-md transition-all px-4">
                        {STYLE_PROFILES[selectedProfileId]?.name} <ChevronDown className="w-3 h-3 text-slate-400" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-72 bg-white p-1 shadow-2xl rounded-xl border-slate-200">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-3">Selection Logic</DropdownMenuLabel>
                        {Object.values(STYLE_PROFILES).map((profile) => (
                          <DropdownMenuItem 
                            key={profile.id} 
                            onClick={() => setSelectedProfileId(profile.id)}
                            className="flex flex-col items-start gap-1 p-3 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-black text-[11px] uppercase tracking-wider text-slate-800">{profile.name}</span>
                              {selectedProfileId === profile.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </div>
                            <span className="text-[10px] text-slate-500 leading-relaxed font-medium">{profile.description}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || ''} className="w-7 h-7 rounded-md" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                        )}
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-2xl border-slate-200">
                      <DropdownMenuLabel className="px-4 py-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                        <p className="text-[11px] font-bold text-slate-800 truncate">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="p-3 font-bold text-xs uppercase tracking-wider cursor-pointer text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                        onClick={() => {
                          logout();
                          toast.info('Disconnected from research session');
                        }}
                      >
                        <LogOut className="w-3.5 h-3.5" /> Disconnect Session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button size="sm" className="h-9 gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-6 rounded-lg shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
                    <Download className="w-4 h-4" /> Finalize
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-2xl border-slate-200">
                  <DropdownMenuItem className="p-3 font-bold text-xs uppercase tracking-wider cursor-pointer" onClick={() => toast.success('Exporting Archivist PDF...')}>
                    Archivist PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-3 font-bold text-xs uppercase tracking-wider cursor-pointer" onClick={() => {
                    toast.promise(exportToDocx(content, sources, 'Manuscript', selectedProfileId), {
                      loading: 'Synthesizing Word Document...',
                      success: 'Manuscript persisted to disk',
                      error: 'Synthesis failure'
                    });
                  }}>
                    Word Document (.docx)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 flex relative overflow-hidden">
            <div className="flex-1 h-full overflow-hidden bg-slate-100/40">
              {activeTab === 'editor' ? (
                <Editor 
                  content={content} 
                  sources={sources} 
                  selectedProfileId={selectedProfileId}
                  versionToRestore={versionToRestore}
                  sourceToInsert={sourceToInsert}
                  textToInsert={textToInsert}
                  onInsertSourceComplete={() => setSourceToInsert(null)}
                  onInsertTextComplete={() => setTextToInsert(null)}
                  onSelectionChange={setSelectedText}
                  onChange={handleContentChange} 
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
                  <div className="max-w-4xl mx-auto py-20 px-12 pb-32">
                    <h2 className="text-4xl font-serif mb-16 border-b border-slate-200 pb-6 italic text-slate-900 tracking-tight">Bibliography</h2>
                    {sources.length === 0 ? (
                      <div className="text-center py-20 text-slate-400 italic font-serif">
                        No references added yet. Add sources in the library to generate your conceptual network.
                      </div>
                    ) : (
                      <div className="space-y-8 font-serif leading-relaxed text-slate-800">
                        {sources
                          .sort((a, b) => a.authors.localeCompare(b.authors))
                          .map((source) => (
                          <div key={source.id} className="pl-12 -indent-12 text-[15px] leading-loose">
                            <span className="font-bold text-slate-950">{source.authors}</span> ({source.year}). 
                            <span className="italic text-slate-900 font-medium"> {source.title}</span>. 
                            {source.publisher ? ` ${source.publisher}.` : ''} 
                            {source.journal ? ` ${source.journal}.` : ''}
                            {source.url && <span className="text-indigo-600 break-all ml-3 font-mono text-[12px] opacity-60">[{source.url}]</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Desktop Sidebars - High Density Layout */}
            <div className="flex h-full shrink-0">
                {isAssistantOpen && (
                  <div className="animate-in slide-in-from-right duration-300 shadow-2xl z-20 border-l border-slate-200">
                    <AIAssistant 
                        paperContent={JSON.stringify(content)} 
                        selectedText={selectedText}
                        sources={JSON.stringify(sources)}
                        onClose={() => setIsAssistantOpen(false)}
                    />
                  </div>
                )}

                {isResearchOpen && (
                  <div className="animate-in slide-in-from-right duration-300 shadow-2xl z-20 border-l border-slate-200">
                    <ResearchStudio 
                        paperContent={JSON.stringify(content)}
                        sources={sources}
                        onInsertText={(text) => {
                        setTextToInsert(text);
                        setActiveTab('editor');
                        toast.success('Fragment ready for integration');
                        }}
                        onClose={() => setIsResearchOpen(false)}
                    />
                  </div>
                )}
            </div>
            
            {isHistoryOpen && (
              <div className="animate-in slide-in-from-right duration-300 shadow-2xl z-20 fixed right-0 top-0 h-full border-l border-slate-200">
                <VersionHistory 
                    versions={versions}
                    onRestore={restoreVersion}
                    onSaveVersion={saveVersion}
                    onClose={() => setIsHistoryOpen(false)}
                />
              </div>
            )}

            <SettingsDialog 
              isOpen={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
              currentProfileId={selectedProfileId}
              onProfileChange={setSelectedProfileId}
              userName={userName}
              onUserNameChange={setUserName}
            />
          </div>
        </main>
        <Toaster position="bottom-right" theme="light" expand={true} richColors />
      </div>
    </TooltipProvider>
  );
}
