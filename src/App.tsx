import * as React from 'react';
import { 
  Library, GraduationCap, Maximize, Minimize,
} from 'lucide-react';
import { Source, Paper, DocumentVersion, ResearchArtifact } from './types';
import { SourceManager } from './components/SourceManager';
import { Outline } from './components/Outline';
import { Editor } from './components/Editor';
import { AIAssistant } from './components/AIAssistant';
import { VersionHistory } from './components/VersionHistory';
import { ResearchStudio } from './components/ResearchStudio';
import { SettingsDialog } from './components/SettingsDialog';
import { ActivityBar } from './components/ActivityBar';
import { AppHeader } from './components/AppHeader';
import { exportToDocx, exportToMarkdown, exportToPlainText } from './services/exportService';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  const [researchArtifacts, setResearchArtifacts] = React.useState<ResearchArtifact[]>([]);

  // Load active document data
  React.useEffect(() => {
    if (activeDocId && documents.length > 0) {
      const activeDoc = documents.find(d => d.id === activeDocId);
      if (activeDoc) {
        // Use JSON stringification for stable equality check to prevent loops
        setContent(prev => JSON.stringify(prev) === JSON.stringify(activeDoc.content) ? prev : activeDoc.content);
        setSources(prev => JSON.stringify(prev) === JSON.stringify(activeDoc.sources || []) ? prev : (activeDoc.sources || []));
        setVersions(prev => JSON.stringify(prev) === JSON.stringify(activeDoc.versions || []) ? prev : (activeDoc.versions || []));
        setResearchArtifacts(prev => JSON.stringify(prev) === JSON.stringify(activeDoc.researchArtifacts || []) ? prev : (activeDoc.researchArtifacts || []));
      }
    } else if (user && documents.length === 0 && !activeDocId) {
       // Create initial doc if none exist
       createDocument('Untitled Research', {
         type: 'doc',
         content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'New Research Project' }] }]
       });
    }
  }, [activeDocId, documents, user, createDocument]);

  // Auto-save logic handles both content and meta-data
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (user) {
      setUserName(user.displayName || 'Research User');
    }
  }, [user]);

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

  const handleInsertSourceComplete = React.useCallback(() => setSourceToInsert(null), []);
  const handleInsertTextComplete = React.useCallback(() => setTextToInsert(null), []);
  const handleRestoreComplete = React.useCallback(() => setVersionToRestore(null), []);
  
  const handleAISuggest = React.useCallback(() => {
    setIsAssistantOpen(true);
    setIsResearchOpen(false);
  }, []);

  const handleOpenVersions = React.useCallback(() => {
    setIsHistoryOpen(true);
    setIsAssistantOpen(false);
    setIsResearchOpen(false);
  }, []);

  const handleNavigate = React.useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleInsertSource = React.useCallback((source: Source) => {
    setSourceToInsert(source);
    setActiveTab('editor');
    toast.success(`Active Reference: ${source.authors.split(',')[0]} (${source.year})`);
  }, []);

  const handleToggleAssistant = React.useCallback(() => {
    setIsAssistantOpen(prev => !prev);
    setIsResearchOpen(false);
    setIsHistoryOpen(false);
  }, []);

  const handleToggleResearch = React.useCallback(() => {
    setIsResearchOpen(prev => !prev);
    setIsAssistantOpen(false);
    setIsHistoryOpen(false);
  }, []);

  const handleUpdateArtifacts = React.useCallback((newArtifacts: ResearchArtifact[]) => {
    setResearchArtifacts(newArtifacts);
    if (activeDocId) {
      saveDocument(activeDocId, { content, sources, versions, researchArtifacts: newArtifacts });
    }
  }, [activeDocId, content, sources, versions, saveDocument]);

  const handleInsertText = React.useCallback((text: string) => {
    setTextToInsert(text);
    setActiveTab('editor');
    toast.success('Fragment ready for integration');
  }, []);

  const handleLogout = React.useCallback(() => {
    logout();
    toast.info('Disconnected from research session');
  }, []);

  const handleContentChange = React.useCallback((newContent: any) => {
    setContent(newContent);
    if (activeDocId) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(activeDocId, { content: newContent, sources, versions, researchArtifacts });
      }, 2000); // 2 second debounce
    }
  }, [activeDocId, sources, versions, researchArtifacts, saveDocument]);

  const handleFinalize = React.useCallback((format: 'pdf' | 'docx') => {
    if (format === 'pdf') {
      toast.success('Exporting Archivist PDF...');
    } else {
      toast.promise(exportToDocx(content, sources, 'Manuscript', selectedProfileId), {
        loading: 'Synthesizing Word Document...',
        success: 'Manuscript persisted to disk',
        error: 'Synthesis failure'
      });
    }
  }, [content, sources, selectedProfileId]);

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
    const newVersions = [newVersion, ...versions];
    setVersions(newVersions);
    if (activeDocId) {
      saveDocument(activeDocId, { content, sources, versions: newVersions, researchArtifacts });
    }
    toast.success('Version saved');
  };

  const restoreVersion = (version: DocumentVersion) => {
    setVersionToRestore(version);
    toast.info(`Restored version from ${new Date(version.timestamp).toLocaleTimeString()}`);
  };

  const handleAddSource = (source: Source) => {
    const newSources = [...sources, source];
    setSources(newSources);
    if (activeDocId) {
      saveDocument(activeDocId, { content, sources: newSources, versions, researchArtifacts });
    }
    toast.success('Source added to library');
  };

  const handleRemoveSource = (id: string) => {
    const newSources = sources.filter(s => s.id !== id);
    setSources(newSources);
    if (activeDocId) {
      saveDocument(activeDocId, { content, sources: newSources, versions, researchArtifacts });
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
        {/* Activity Bar */}
        {!isFocusMode && (
          <ActivityBar 
            activeSidebar={activeSidebar}
            isSidebarVisible={isSidebarVisible}
            isAssistantOpen={isAssistantOpen}
            isResearchOpen={isResearchOpen}
            onToggleSidebar={toggleSidebar}
            onToggleAssistant={handleToggleAssistant}
            onToggleResearch={handleToggleResearch}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Sidebar Panel */}
        {!isFocusMode && isSidebarVisible && (
          <div className="h-full animate-in slide-in-from-left duration-300 shadow-2xl z-40 bg-white">
            {activeSidebar === 'library' ? (
              <SourceManager 
                sources={sources} 
                citationCounts={citationCounts}
                onAddSource={handleAddSource} 
                onRemoveSource={handleRemoveSource} 
                onInsertSource={handleInsertSource}
              />
            ) : (
              <Outline 
                content={content} 
                onNavigate={handleNavigate} 
              />
            )}
          </div>
        )}

        <main className="flex-1 flex flex-col bg-slate-100 min-w-0 h-full relative overflow-hidden">
          <AppHeader 
            isFocusMode={isFocusMode}
            activeSidebar={activeSidebar}
            isSidebarVisible={isSidebarVisible}
            activeTab={activeTab}
            selectedProfileId={selectedProfileId}
            user={user}
            onToggleSidebar={() => toggleSidebar('outline')}
            onSetActiveTab={setActiveTab}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
            onSetSelectedProfileId={setSelectedProfileId}
            onLogout={handleLogout}
            onFinalize={handleFinalize}
          />

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
                  onInsertSourceComplete={handleInsertSourceComplete}
                  onInsertTextComplete={handleInsertTextComplete}
                  onRestoreComplete={handleRestoreComplete}
                  onSelectionChange={setSelectedText}
                  onChange={handleContentChange} 
                  onAISuggest={handleAISuggest}
                  onOpenVersions={handleOpenVersions}
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

            {/* Side Panels */}
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
                        artifacts={researchArtifacts}
                        onUpdateArtifacts={handleUpdateArtifacts}
                        onInsertText={handleInsertText}
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
