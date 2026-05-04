import * as React from 'react';
import { 
  Settings, User, Palette, Brain, 
  Save, Bell, Shield, Info, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STYLE_PROFILES } from '../constants/styleProfiles';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfileId: string;
  onProfileChange: (id: string) => void;
  userName: string;
  onUserNameChange: (name: string) => void;
}

export function SettingsDialog({ 
  isOpen, 
  onOpenChange, 
  currentProfileId, 
  onProfileChange,
  userName,
  onUserNameChange
}: SettingsDialogProps) {
  const [autoSave, setAutoSave] = React.useState(true);
  const [aiPower, setAiPower] = React.useState('standard');
  const [notifications, setNotifications] = React.useState(true);

  const handleSave = () => {
    toast.success('Settings updated successfully');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-lg sm:max-w-[95%] lg:max-w-[1000px] overflow-hidden p-0 gap-0 border-slate-800 bg-slate-950 text-slate-200 h-[85vh] sm:h-[650px] flex flex-col shadow-2xl">
        <Tabs defaultValue="general" orientation="vertical" className="flex flex-1 h-full w-full overflow-hidden">
          {/* Sidebar - Desktop/Tablet optimized */}
          <div className="w-20 sm:w-64 border-r border-slate-800 bg-slate-900/40 p-3 sm:p-6 shrink-0 flex flex-col gap-8 transition-all duration-300">
            <div className="flex items-center gap-3 px-1 sm:px-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-transform hover:scale-105">
                <Settings className="w-5 h-5 animate-pulse-slow" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-[12px] uppercase tracking-[0.25em] text-white">Settings</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Workspace OS</span>
              </div>
            </div>
            
            <TabsList className="flex flex-col h-auto bg-transparent gap-2 items-stretch p-0 border-none w-full">
              {[
                { id: 'general', icon: User, label: 'Scholar Profile' },
                { id: 'appearance', icon: Palette, label: 'Workspace' },
                { id: 'ai', icon: Brain, label: 'Intelligence' },
                { id: 'storage', icon: Shield, label: 'Security' }
              ].map((item) => (
                <TabsTrigger 
                  key={item.id}
                  value={item.id} 
                  className="group justify-center sm:justify-start gap-3 h-11 px-0 sm:px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 transition-all rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="hidden sm:inline">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-auto hidden sm:block pt-6 border-t border-slate-800/50 space-y-4">
               <div className="px-2 flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-tight opacity-50 hover:opacity-100 transition-opacity">
                  <Info className="w-3.5 h-3.5" /> Thesis Architect v4.2
               </div>
               <div className="px-2 flex items-center gap-3 text-[10px] text-indigo-400/40 font-bold uppercase tracking-tight">
                  <Heart className="w-3.5 h-3.5" /> Core Synthesis Engine
               </div>
            </div>
          </div>

          {/* Content Area - Responsive Container */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-950/80 backdrop-blur-sm">
            <div className="flex-1 relative overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="mx-auto max-w-2xl px-6 py-10 sm:px-12 sm:py-12">
                  <TabsContent value="general" className="m-0 space-y-10 outline-none animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.15em] border border-indigo-500/20 mb-2">
                        Identity Settings
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight leading-none uppercase">Scholar Profile</h3>
                      <p className="text-[13px] text-slate-400 leading-relaxed font-medium">Configure your academic signature. These details are used across the manuscript lifecycle for authorship, citations, and version metadata.</p>
                    </div>

                    <div className="space-y-8">
                      <div className="grid gap-4">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Full Academic Name</Label>
                        <Input 
                          value={userName}
                          onChange={(e) => onUserNameChange(e.target.value)}
                          placeholder="Dr. Alexander Wright"
                          className="bg-slate-900 shadow-inner border-slate-800 h-12 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all px-4 rounded-xl"
                        />
                      </div>
                      
                      <div className="grid gap-4">
                         <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Primary Academic Institution</Label>
                         <Input 
                          placeholder="Cambridge University"
                          className="bg-slate-900 shadow-inner border-slate-800 h-12 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all px-4 rounded-xl"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="appearance" className="m-0 space-y-10 outline-none animate-in fade-in slide-in-from-right-2 duration-3 duration-300">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.15em] border border-emerald-500/20 mb-2">
                        UI Parameters
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight leading-none uppercase">Workspace Configuration</h3>
                      <p className="text-[13px] text-slate-400 leading-relaxed font-medium">Fine-tune the visual experience. Select parameters that stabilize long-form focused cognition. Fully optimized for both desktop and high-density tablet displays.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-5 bg-slate-900 shadow-sm rounded-2xl border border-slate-800/50 group transition-all hover:bg-slate-900/70">
                        <div className="space-y-1">
                          <Label className="text-[14px] font-bold text-slate-200">Neural Sync Notifications</Label>
                          <p className="text-[11px] text-slate-500 font-medium tracking-wide">Receive interface-level feedback on AI processing cycles.</p>
                        </div>
                        <Switch 
                          checked={notifications} 
                          onCheckedChange={setNotifications}
                          className="data-[state=checked]:bg-indigo-600 scale-110"
                        />
                      </div>

                      <div className="grid gap-4">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Default Linguistic Context</Label>
                        <Select defaultValue="en-US">
                          <SelectTrigger className="bg-slate-900 border-slate-800 h-12 text-sm rounded-xl px-4">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 rounded-xl">
                            <SelectItem value="en-US">English (US)</SelectItem>
                            <SelectItem value="en-GB">English (UK)</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="m-0 space-y-10 outline-none animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-[0.15em] border border-violet-500/20 mb-2">
                        Neural Engine
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight leading-none uppercase">Intelligence Integration</h3>
                      <p className="text-[13px] text-slate-400 leading-relaxed font-medium">Calibrate the degree of automation. Advanced settings allow for deeper linguistic synthesis but require higher computational overhead.</p>
                    </div>

                    <div className="space-y-8">
                      <div className="grid gap-4">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">AI Synthesis Priority</Label>
                        <Select value={aiPower} onValueChange={setAiPower}>
                          <SelectTrigger className="bg-slate-900 border-slate-800 h-12 text-sm rounded-xl px-4">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            <SelectItem value="minimal">Focus Mode (Assist Only)</SelectItem>
                            <SelectItem value="standard">Standard Scholar Mode (Active)</SelectItem>
                            <SelectItem value="advanced">Hyper-Genesis Mode (Generative)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between p-5 bg-slate-900 shadow-sm rounded-2xl border border-slate-800/50 group transition-all hover:bg-slate-900/70">
                        <div className="space-y-1">
                          <Label className="text-[14px] font-bold text-slate-200">Predictive Library Matching</Label>
                          <p className="text-[11px] text-slate-500 font-medium">Real-time source suggestions will populate based on text entry.</p>
                        </div>
                        <Switch className="data-[state=checked]:bg-indigo-600 scale-110" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="storage" className="m-0 space-y-10 outline-none animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-[0.15em] border border-rose-500/20 mb-2">
                        Security Vault
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight leading-none uppercase">Encryption & Storage</h3>
                      <p className="text-[13px] text-slate-400 leading-relaxed font-medium">Manage data persistence. Your manuscripts are stored in an encrypted state. Cloud sync provides multi-device availability.</p>
                    </div>

                    <div className="space-y-10">
                      <div className="flex items-center justify-between p-5 bg-slate-900 shadow-sm rounded-2xl border border-slate-800/50 group transition-all hover:bg-slate-900/70">
                        <div className="space-y-1">
                          <Label className="text-[14px] font-bold text-slate-200">Continuous Neural Sync</Label>
                          <p className="text-[11px] text-slate-500 font-medium">Heartbeat-level sync triggered on every character keystroke.</p>
                        </div>
                        <Switch 
                          checked={autoSave} 
                          onCheckedChange={setAutoSave}
                          className="data-[state=checked]:bg-indigo-600 scale-110"
                        />
                      </div>

                      <div className="pt-6 border-t border-slate-800/60 text-center">
                        <Button variant="outline" className="w-full sm:max-w-xs border-red-900/40 bg-red-950/20 text-red-500 text-[11px] font-bold uppercase tracking-widest hover:bg-red-900/40 hover:text-red-300 transition-all h-12 rounded-xl">
                           Execute Permanent Cache Purge
                        </Button>
                        <p className="text-[11px] text-slate-600 mt-4 font-medium italic">CAUTION: This operation wipes all local drafts beyond recovery.</p>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 transition-all">
               <div className="flex items-center gap-4 w-full sm:w-auto">
                 <div className="flex flex-col">
                   <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                     <span className="text-[11px] font-black text-white uppercase tracking-widest">Workspace Online</span>
                   </div>
                   <span className="text-[9px] text-slate-600 font-bold uppercase mt-0.5 tracking-tighter">Connection Secured: RSA-4096</span>
                 </div>
               </div>
               <div className="flex gap-4 w-full sm:w-auto">
                 <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-xl h-12">Discard Changes</Button>
                 <Button onClick={handleSave} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-[0.25em] px-10 h-12 rounded-xl shadow-xl shadow-indigo-900/30 transition-all hover:scale-105 active:scale-95">Save System State</Button>
               </div>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
