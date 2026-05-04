import * as React from 'react';
import { SidebarClose, History, RefreshCcw, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentVersion } from '@/src/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from '@/components/ui/dialog';

interface VersionHistoryProps {
  versions: DocumentVersion[];
  onRestore: (version: DocumentVersion) => void;
  onSaveVersion: () => void;
  onClose: () => void;
}

export function VersionHistory({ versions, onRestore, onSaveVersion, onClose }: VersionHistoryProps) {
  const [isConfirmingSave, setIsConfirmingSave] = React.useState(false);

  const confirmSave = () => {
    onSaveVersion();
    setIsConfirmingSave(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 w-80 border-l border-slate-200 shadow-2xl relative z-20">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 text-indigo-600">
          <History className="w-5 h-5" />
          <h2 className="font-bold text-sm tracking-tight uppercase">Version History</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100">
          <SidebarClose className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <Button onClick={() => setIsConfirmingSave(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold h-9 shadow-sm">
          <Tag className="w-4 h-4 mr-2" />
          Save Current Version
        </Button>
        <p className="text-[10px] text-slate-500 text-center mt-2 px-2 uppercase tracking-wide">
          Manually snapshot document state
        </p>
      </div>

      <Dialog open={isConfirmingSave} onOpenChange={setIsConfirmingSave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save New Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to save a new snapshot of the current manuscript? This will allow you to restore this specific state later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={confirmSave} className="bg-indigo-600 hover:bg-indigo-700">
              Save Snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {versions.length === 0 ? (
            <div className="text-center p-6 text-slate-400 text-xs font-medium italic">
              No versions saved yet.
            </div>
          ) : (
            versions.sort((a, b) => b.timestamp - a.timestamp).map((version, idx) => (
              <div key={version.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-indigo-200 text-indigo-600 shadow shrink-0 z-10 mx-[-9px]">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                </div>
                
                {/* Content */}
                <div className="w-[calc(100%-2rem)] p-3 rounded bg-white shadow-sm border border-slate-200 ml-4 group-hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-800">
                      {version.label || `Version ${versions.length - idx}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2 font-mono">
                    {format(new Date(version.timestamp), 'MMM d, h:mm a')} • {version.author}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onRestore(version)}
                    className="w-full text-[10px] h-6 px-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border-slate-200 group-hover:border-indigo-200"
                  >
                    <RefreshCcw className="w-3 h-3 mr-1.5" /> Restore
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
