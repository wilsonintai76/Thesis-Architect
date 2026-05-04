import * as React from 'react';
import { 
  PanelLeft, Maximize, Minimize, ChevronDown, Check, User as UserIcon, LogOut, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator, 
  DropdownMenuLabel, 
  DropdownMenuGroup 
} from '@/components/ui/dropdown-menu';
import { STYLE_PROFILES } from '../constants/styleProfiles';

interface AppHeaderProps {
  isFocusMode: boolean;
  activeSidebar: string;
  isSidebarVisible: boolean;
  activeTab: string;
  selectedProfileId: string;
  user: any;
  onToggleSidebar: () => void;
  onSetActiveTab: (tab: string) => void;
  onToggleFocusMode: () => void;
  onSetSelectedProfileId: (id: string) => void;
  onLogout: () => void;
  onFinalize: (format: 'pdf' | 'docx') => void;
}

export function AppHeader({
  isFocusMode,
  activeSidebar,
  isSidebarVisible,
  activeTab,
  selectedProfileId,
  user,
  onToggleSidebar,
  onSetActiveTab,
  onToggleFocusMode,
  onSetSelectedProfileId,
  onLogout,
  onFinalize
}: AppHeaderProps) {
  return (
    <header className={`h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md shrink-0 z-30 transition-all ${isFocusMode ? 'border-b-0 absolute top-0 w-full hover:opacity-100 opacity-20 bg-white shadow-lg' : ''}`}>
      <div className="flex items-center gap-4">
        {!isFocusMode && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleSidebar}
            className={`h-9 w-9 p-0 rounded-lg transition-all ${activeSidebar === 'outline' && isSidebarVisible ? 'text-indigo-600 bg-indigo-50 shadow-sm border border-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            title="Toggle Outline"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        )}
        {!isFocusMode && (
          <div className="flex flex-col">
            <h1 className="text-xs font-black text-slate-900 leading-none tracking-[0.2em] mb-1 uppercase">Thesis Architect</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black opacity-60">Synthesis Environment v4.2</p>
          </div>
        )}
        <div className="h-4 w-px bg-slate-200" />
        <Tabs value={activeTab} onValueChange={onSetActiveTab} className="w-auto">
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
          onClick={onToggleFocusMode}
          className={`h-9 px-4 gap-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${isFocusMode ? 'text-indigo-600 bg-indigo-50 shadow-inner' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          {isFocusMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          {isFocusMode ? 'Exit Concentration' : 'Focus Mode'}
        </Button>

        {!isFocusMode && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger render={(props) => (
                <Button variant="outline" size="sm" {...props} className="h-9 gap-2 text-slate-800 border-slate-200 bg-white font-black text-[10px] rounded-lg uppercase tracking-widest shadow-sm hover:shadow-md transition-all px-4">
                  {STYLE_PROFILES[selectedProfileId]?.name} <ChevronDown className="w-3 h-3 text-slate-400" />
                </Button>
              )} />
              <DropdownMenuContent align="end" className="w-72 bg-white p-1 shadow-2xl rounded-xl border-slate-200">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-3">Selection Logic</DropdownMenuLabel>
                  {Object.values(STYLE_PROFILES).map((profile) => (
                    <DropdownMenuItem 
                      key={profile.id} 
                      onClick={() => onSetSelectedProfileId(profile.id)}
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
              <DropdownMenuTrigger render={(props) => (
                <Button variant="ghost" size="sm" {...props} className="h-9 w-9 p-0 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-7 h-7 rounded-md" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                  )}
                </Button>
              )} />
              <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-2xl border-slate-200">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-4 py-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                    <p className="text-[11px] font-bold text-slate-800 truncate">{user?.email}</p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="p-3 font-bold text-xs uppercase tracking-wider cursor-pointer text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                  onClick={onLogout}
                >
                  <LogOut className="w-3.5 h-3.5" /> Disconnect Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger render={(props) => (
            <Button size="sm" {...props} className="h-9 gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-6 rounded-lg shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
              <Download className="w-4 h-4" /> Finalize
            </Button>
          )} />
          <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-2xl border-slate-200">
            <DropdownMenuItem className="p-3 font-bold text-xs uppercase tracking-wider cursor-pointer" onClick={() => onFinalize('pdf')}>
              Archivist PDF
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3 font-bold text-xs uppercase tracking-wider cursor-pointer" onClick={() => onFinalize('docx')}>
              Word Document (.docx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
