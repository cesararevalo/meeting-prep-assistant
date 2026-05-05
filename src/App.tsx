import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Part } from '@google/genai';
import { 
  FileText, 
  X, 
  Loader2, 
  Sparkles, 
  BrainCircuit, 
  Menu, 
  ClipboardCopy,
  Settings,
  AlertTriangle,
  CheckCircle2,
  User,
  ShieldAlert,
  ChevronRight,
  TrendingDown,
  Timer,
  Plus,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface Task {
  task: string;
  assignee: string;
  dueDate: string;
}

interface Risk {
  category: string;
  title: string;
  icon: 'delay' | 'compliance' | 'market' | 'deployment' | 'general';
}

interface TalkingPoint {
  title: string;
  description: string;
}

interface MeetingIntelligence {
  title: string;
  summary: string;
  talkingPoints: TalkingPoint[];
  risks: Risk[];
  nextSteps: Task[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 0: Ingesting, 1: Identifying, 2: Structuring
  const [intelligence, setIntelligence] = useState<MeetingIntelligence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulate progress steps during processing
  useEffect(() => {
    let interval: any;
    if (isProcessing && !intelligence) {
      interval = setInterval(() => {
        setProcessingStep(prev => (prev < 2 ? prev + 1 : prev));
      }, 2500);
    } else {
      setProcessingStep(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing, intelligence]);

  useEffect(() => {
    if (intelligence) {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [intelligence]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles.filter(f => f.size <= MAX_FILE_SIZE)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processMeeting = async () => {
    if (!inputText.trim() && files.length === 0) return;

    setIsProcessing(true);
    setIntelligence(null);
    setError(null);
    setActiveTab('output');

    try {
      const parts: Part[] = [];
      if (inputText.trim()) parts.push({ text: inputText });
      for (const file of files) {
        const base64Data = await fileToBase64(file);
        parts.push({ inlineData: { data: base64Data, mimeType: file.type } });
      }

      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview',
        contents: parts,
        config: { 
          responseMimeType: 'application/json',
          systemInstruction: `You are an expert meeting analyst. Extract structured intelligence from the inputs provided.
          You MUST return valid JSON only in the following format:
          {
            "title": "A concise title or Project Name",
            "summary": "Executive summary (3-4 sentences)",
            "talkingPoints": [{"title": "Point Title", "description": "1-2 sentence detail"}],
            "risks": [{"category": "e.g. CRITICAL DELAY", "title": "Specific Risk Name", "icon": "delay|compliance|market|deployment|general"}],
            "nextSteps": [{"task": "Actionable task", "assignee": "Name", "dueDate": "MMM DD, YYYY"}]
          }`
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Empty response from AI");
      
      // Robust JSON extraction
      let jsonStr = responseText.trim();
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
      
      try {
        const data = JSON.parse(jsonStr);
        setIntelligence(data);
      } catch (parseErr) {
        console.error("JSON Parse Error:", parseErr, "Raw Content:", responseText);
        throw new Error("The AI returned unconventional results. Please try refining your notes.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Processing failed. Please check your inputs.');
      setActiveTab('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderRiskIcon = (type: string) => {
    switch (type) {
      case 'delay': return <AlertTriangle className="w-5 h-5 text-indigo-600" />;
      case 'compliance': return <ShieldAlert className="w-5 h-5 text-indigo-600" />;
      case 'market': return <TrendingDown className="w-5 h-5 text-indigo-600" />;
      case 'deployment': return <Timer className="w-5 h-5 text-indigo-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:py-5 bg-[#F8FAFC] z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <Menu className="w-7 h-7 text-[#0F172A]" />
          <span className="font-display font-bold text-xl md:text-2xl text-[#0F172A] tracking-tight">Meeting Slay</span>
        </div>
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
          <img 
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&h=256&auto=format&fit=crop" 
            alt="User avatar" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      <main className="flex-1 overflow-hidden max-w-lg mx-auto w-full flex flex-col relative">
        <AnimatePresence mode="wait">
          {/* INPUT SCREEN */}
          {activeTab === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-y-auto px-6 pb-24"
            >
              <div className="pt-6 md:pt-8 flex-1 flex flex-col">
                <h1 className="font-display font-bold text-3xl md:text-[52px] leading-[1.05] text-[#0F172A] tracking-tight mb-8 md:mb-12">
                  What's the context for your meeting?
                </h1>

                <div className="flex-1 flex flex-col space-y-4">
                  <div className="flex-1 flex flex-col bg-white rounded-[32px] border border-[#E2E8F0] shadow-sm p-4 md:p-6 min-h-[400px] relative group overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onPaste={(e) => {
                        const pastedFiles = Array.from(e.clipboardData.files);
                        if (pastedFiles.length > 0) {
                          setFiles(prev => [...prev, ...pastedFiles.filter(f => f.size <= MAX_FILE_SIZE)]);
                        }
                      }}
                      placeholder="Paste transcripts, raw bullets, screenshots, or agenda items here..."
                      className="flex-1 w-full bg-transparent focus:outline-none text-lg md:text-xl text-[#0F172A] leading-relaxed placeholder:text-[#CBD5E1] resize-none"
                    />
                    
                    {/* Attachment chips inside the input area */}
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]">{file.name}</span>
                            <button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-rose-500 p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Plus Button for Attachments */}
                    <div className="absolute right-6 bottom-6 flex items-center space-x-2">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-12 h-12 bg-slate-50 hover:bg-white border border-slate-100 rounded-full flex items-center justify-center text-[#0F172A] shadow-sm hover:shadow-md transition-all active:scale-90"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf,image/*,.txt" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* INTERIM / PROCESSING SCREEN */}
          {activeTab === 'output' && isProcessing && !intelligence && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F8FAFC] min-h-full"
            >
              <div className="w-full max-w-sm space-y-8 md:space-y-12">
                {/* Animation Box */}
                <div className="relative mx-auto w-48 h-48 md:w-64 md:h-64">
                   <div className="absolute top-0 left-0 w-full h-full bg-[#94A3B8]/5 rounded-[32px] md:rounded-[48px] rotate-[-6deg]" />
                   <div className="absolute top-0 left-0 w-full h-full bg-white rounded-[32px] md:rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-100 flex items-center justify-center relative overflow-hidden">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 md:w-24 md:h-24 bg-[#7D94B1] rounded-[24px] md:rounded-[32px] flex items-center justify-center text-white relative z-10"
                      >
                         <Settings className="w-7 h-7 md:w-10 md:h-10" />
                      </motion.div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#0F172A] rotate-[-45deg] origin-top-left scale-[2]" />
                   </div>
                </div>

                <div className="text-center space-y-2 md:space-y-3">
                  <h2 className="font-display font-bold text-2xl md:text-[36px] text-[#0F172A] leading-tight">Doing the hard work for you...</h2>
                  <p className="text-[#64748B] text-base md:text-lg">Extracting brilliance from your chaos.</p>
                </div>

                <div className="space-y-4 md:space-y-6">
                  {['Ingesting Notes', 'Identifying Risks', 'Structuring Outputs'].map((label, i) => (
                    <div key={i} className={`p-4 md:p-6 rounded-[20px] md:rounded-[24px] border border-slate-100 transition-all ${processingStep >= i ? 'bg-white shadow-xl shadow-slate-200/40' : 'bg-transparent opacity-40'}`}>
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <span className="font-bold text-sm md:text-base text-[#0F172A]">{label}</span>
                        {processingStep > i ? (
                          <div className="w-4 h-4 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3" /></div>
                        ) : processingStep === i ? (
                          <Loader2 className="w-3 md:w-4 h-3 md:h-4 text-indigo-500 animate-spin" />
                        ) : null}
                      </div>
                      <div className="h-1 md:h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: processingStep > i ? '100%' : processingStep === i ? '60%' : '0%' }}
                          className="h-full bg-[#0F172A] rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS SCREEN */}
          {activeTab === 'output' && intelligence && (
            <motion.div 
              key="results"
              ref={scrollRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col overflow-y-auto px-4 md:px-6 pb-24"
            >
              <div className="pt-6 md:pt-8 space-y-8 md:space-y-12">
                <h1 className="font-display font-bold text-3xl md:text-[42px] leading-tight text-[#0F172A] tracking-tight">
                  {intelligence.title}
                </h1>

                {/* Summary */}
                <div className="bg-[#F1F5F9] rounded-[20px] md:rounded-[24px] p-6 md:p-8 border-l-[6px] md:border-l-8 border-[#0F172A]">
                  <p className="text-lg md:text-xl text-[#334155] italic leading-relaxed font-medium">
                    "{intelligence.summary}"
                  </p>
                </div>

                {/* Talking Points */}
                <section className="bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-50 space-y-6 md:space-y-8">
                  <div className="flex items-center space-x-3 mb-1">
                    <div className="p-1.5 md:p-2 bg-slate-50 rounded-lg text-[#0F172A]">
                      <FileText className="w-4 md:w-5 h-4 md:h-5" />
                    </div>
                    <h2 className="font-display font-bold text-xl md:text-2xl text-[#0F172A]">Key Talking Points</h2>
                  </div>
                  <div className="space-y-6 md:space-y-8">
                    {intelligence.talkingPoints.map((point, i) => (
                      <div key={i} className="flex space-x-3 md:space-x-4">
                        <div className="shrink-0 mt-2 md:mt-2.5 w-1.5 h-1.5 bg-[#0F172A] rounded-full" />
                        <div className="space-y-1.5">
                          <h3 className="font-bold text-base md:text-lg text-[#0F172A] leading-snug">{point.title}</h3>
                          <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{point.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Risks */}
                <section className="bg-[#F1F5F9]/60 rounded-[32px] md:rounded-[40px] p-6 md:p-8 border border-slate-100 flex flex-col space-y-5 md:space-y-6">
                  <div className="flex items-center space-x-3 mb-1">
                    <div className="p-1.5 md:p-2 bg-white rounded-xl shadow-sm text-rose-500">
                      <AlertTriangle className="w-4 md:w-5 h-4 md:h-5" />
                    </div>
                    <h2 className="font-display font-bold text-xl md:text-2xl text-[#0F172A]">Risk Identification</h2>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {intelligence.risks.map((risk, i) => (
                      <div key={i} className="bg-white rounded-[20px] md:rounded-[24px] p-5 md:p-6 shadow-sm border border-slate-50 flex items-center space-x-4 md:space-x-6 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0F172A]" />
                        <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center">
                          {renderRiskIcon(risk.icon)}
                        </div>
                        <div className="flex-1">
                          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] text-slate-400 mb-0.5 md:mb-1">{risk.category}</p>
                          <h3 className="font-bold text-base md:text-[17px] text-[#0F172A] leading-tight">{risk.title}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Next Steps */}
                <section className="bg-[#EDF2F7] rounded-[32px] md:rounded-[40px] p-6 md:p-8 border border-slate-100 flex flex-col space-y-5 md:space-y-6">
                  <div className="flex items-center space-x-3 mb-1">
                    <div className="p-1.5 md:p-2 bg-white rounded-xl shadow-sm text-emerald-500">
                      <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5" />
                    </div>
                    <h2 className="font-display font-bold text-xl md:text-2xl text-[#0F172A]">Strategic Next Steps</h2>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {intelligence.nextSteps.map((step, i) => (
                      <div key={i} className="bg-white rounded-[24px] md:rounded-[28px] p-6 md:p-7 shadow-sm border border-slate-50">
                        <div className="flex items-start justify-between mb-4 md:mb-6 gap-3">
                           <div className="flex-1">
                              <h3 className="font-bold text-base md:text-lg text-[#0F172A] leading-snug">{step.task}</h3>
                           </div>
                           <div className="text-right shrink-0">
                              <p className="text-[8px] font-black tracking-widest text-[#94A3B8] uppercase mb-0.5">DUE</p>
                              <p className="text-[11px] md:text-[12px] font-bold text-[#475569] whitespace-nowrap">{step.dueDate}</p>
                           </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 md:pt-5 border-t border-slate-100/50">
                           <div className="flex items-center space-x-2 md:space-x-2.5">
                              <div className="w-6 h-6 md:w-7 md:h-7 bg-[#F8FAFC] rounded-full flex items-center justify-center text-slate-400 ring-1 ring-slate-100">
                                 <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </div>
                              <span className="text-[10px] md:text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em]">ASSIGNEE: {step.assignee}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 pt-4 pb-8 md:pb-10 flex items-center justify-around z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <button 
          onClick={() => setActiveTab('input')}
          className={`flex flex-col items-center transition-all ${activeTab === 'input' ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}
        >
          <div className={`p-2 md:p-2.5 rounded-2xl transition-all ${activeTab === 'input' ? 'bg-slate-100 scale-110' : 'bg-transparent'}`}>
            <FileText className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <span className="text-[9px] md:text-[10px] font-bold mt-1.5 md:mt-2 uppercase tracking-[0.15em]">Input</span>
        </button>
        
        {/* Floating Action Button */}
        <AnimatePresence>
          {activeTab === 'input' && !isProcessing && (
            <motion.button 
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 20 }}
              onClick={processMeeting}
              disabled={!inputText.trim() && files.length === 0}
              className="absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 w-16 h-16 md:w-20 md:h-20 bg-[#0F172A] rounded-[24px] md:rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-indigo-200/50 border-[5px] md:border-[6px] border-[#F8FAFC] active:scale-95 transition-all disabled:opacity-40 disabled:grayscale hover:bg-slate-800"
            >
              <Sparkles className="w-7 h-7 md:w-9 md:h-9" />
            </motion.button>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setActiveTab('output')}
          disabled={!intelligence && !isProcessing}
          className={`flex flex-col items-center transition-all ${activeTab === 'output' ? 'text-[#0F172A]' : 'text-[#94A3B8] opacity-50'}`}
        >
          <div className={`p-2 md:p-2.5 rounded-2xl transition-all ${activeTab === 'output' ? 'bg-slate-100 scale-110' : 'bg-transparent'}`}>
            <BrainCircuit className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <span className="text-[9px] md:text-[10px] font-bold mt-1.5 md:mt-2 uppercase tracking-[0.15em]">Results</span>
        </button>
      </nav>
    </div>
  );
}
