import * as React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Sparkles, BookOpen, Share2, Compass, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '../lib/firebase';
import { toast } from 'sonner';

export function LandingPage() {
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome back, Researcher');
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 px-8 py-6 flex justify-between items-center border-b border-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em]">Thesis Architect</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Synthesis Environment</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-xs font-bold uppercase tracking-widest px-6"
          onClick={handleLogin}
          disabled={isSigningIn}
        >
          Sign In
        </Button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
              <Sparkles className="w-3 h-3" /> AI-First Scientific Writing
            </div>
            <h2 className="text-6xl md:text-7xl font-sans font-black tracking-tight leading-[0.95] mb-8">
              Architecting <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-indigo-400">Knowledge</span> with Precision.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl font-medium">
              A professional-grade environment for high-stakes academic research. 
              Live web synthesis, automatic citation networks, and collaborative drafting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest px-10 h-14 rounded-xl shadow-xl shadow-indigo-900/40 group transition-all"
                onClick={handleLogin}
                disabled={isSigningIn}
              >
                Start Researching <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-slate-400 hover:text-white hover:bg-slate-800/50 h-14 px-8 font-bold uppercase tracking-widest"
              >
                Read Documentation
              </Button>
            </div>
            
            <div className="mt-16 flex items-center gap-8">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                Trusted by <span className="text-slate-300">2,000+</span> Researchers Globally
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-2xl p-4 aspect-square lg:aspect-auto">
              <div className="w-full bg-slate-950 rounded-xl border border-slate-800/50 overflow-hidden shadow-inner flex flex-col h-[500px]">
                <div className="h-8 border-b border-slate-800/50 flex items-center px-4 gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex-1 p-8 font-serif leading-loose opacity-40">
                  <div className="h-4 bg-slate-800 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-slate-800 rounded w-full mb-4" />
                  <div className="h-4 bg-slate-800 rounded w-5/6 mb-4" />
                  <div className="h-4 bg-slate-800 rounded w-full mb-4" />
                  <div className="h-32 bg-indigo-500/5 rounded-xl border border-indigo-500/10 mb-4 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-indigo-500/30" />
                  </div>
                  <div className="h-4 bg-slate-800 rounded w-2/3 mb-4" />
                </div>
              </div>
            </div>
            
            {/* Floating UI Elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-10 -right-10 z-20 bg-white shadow-2xl rounded-xl p-4 border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400">Status</p>
                   <p className="text-xs font-bold text-slate-800">Synthesizing Network...</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-6 -left-10 z-20 bg-white shadow-2xl rounded-xl p-4 border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400">Grounding</p>
                   <p className="text-xs font-bold text-slate-800">Live Search Verified</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/50 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Built for the future of science.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">Terms</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors">Ethical AI</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
