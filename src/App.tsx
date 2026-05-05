import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Part } from '@google/genai';
import { UploadCloud, FileText, Image as ImageIcon, X, Play, Loader2, Sparkles, BrainCircuit, Mic } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB buffer

export default function App() {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(f => f.size <= MAX_FILE_SIZE);
      if (validFiles.length < selectedFiles.length) {
         setError('Some files were ignored because they exceed the 20MB limit.');
      } else {
         setError(null);
      }
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (type === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processMeeting = async () => {
    if (!inputText.trim() && files.length === 0) {
      setError('Please provide some text or files to process.');
      return;
    }

    setIsProcessing(true);
    setResult('');
    setError(null);

    try {
      const parts: Part[] = [];
      
      if (inputText.trim()) {
        parts.push({ text: inputText });
      }

      for (const file of files) {
        const base64Data = await fileToBase64(file);
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      }

      const stream = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: parts,
        config: {
          systemInstruction: `You are a highly analytical Meeting Prep Assistant. Your primary function is to ingest meeting materials and, using these inputs, generate structured meeting intelligence output.

**Core Directives:**
1. **Strict Grounding:** You must base all extractions strictly on the provided inputs, which can be any of the following: text notes, PDF documents, or presentation slides. Do not hallucinate facts, dates, or names. If information for a specific section is missing, state "No information provided in the input documents."
2. **Reasoning Constraints:** Before generating the final output, briefly outline your reasoning process for identifying the highest priority risks to ensure they are genuinely derived from the text.
3. **Structured Formatting:** You must format your final response to clearly separate the required output categories.

**Required Output Components:**
Your final output must explicitly include the following intelligence categories:
* **Meeting Summary:** A concise executive summary (3-4 sentences) of the meeting's core purpose and major outcomes.
* **Risk Identification:** A bulleted list of potential operational, financial, technical, or strategic risks mentioned or heavily implied in the inputs.
* **Key Talking Points:** 3-5 crucial topics, arguments, or data points that need to be addressed or carried forward in subsequent discussions.
* **Next Steps:** Clear, actionable tasks assigned to specific participants (if named) or general task forces, including deadlines if mentioned.`
        }
      });

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          setResult(prev => prev + c.text);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while processing your request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(f => f.size <= MAX_FILE_SIZE);
      if (validFiles.length < droppedFiles.length) {
         setError('Some files were ignored because they exceed the 20MB limit.');
      } else {
         setError(null);
      }
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      {/* Left Column - Inputs */}
      <div className="w-full md:w-5/12 lg:w-1/3 bg-white border-r border-slate-200 flex flex-col h-auto md:h-screen sticky top-0 shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-white">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-slate-800 tracking-tight">Meeting Prep Assistant</h1>
            <p className="text-xs text-slate-500 font-medium">AI Intelligence Extractor</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center">
              Meeting Notes/Transcript
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste meeting transcript, rough notes, or agenda here..."
              className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-sm placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Supporting Materials
            </label>
            <p className="text-xs text-slate-500 mb-2">Upload PDFs, Slides (Images), or text files.</p>
            
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-colors group"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Drag & drop files or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, TXT up to 20MB</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
                accept=".pdf,image/*,.txt"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {getFileIcon(file.type)}
                      <span className="text-sm text-slate-700 truncate max-w-[200px] font-medium">{file.name}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start">
              <span className="mr-2 text-red-500">⚠</span>
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <button
            onClick={processMeeting}
            disabled={isProcessing || (!inputText.trim() && files.length === 0)}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Extracting Intelligence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Process Meeting</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column - Results */}
      <div className="w-full md:w-7/12 lg:w-2/3 flex flex-col h-[60vh] md:h-screen bg-[#F8FAFC]">
        <div className="p-6 border-b border-slate-200 bg-white shadow-sm flex items-center justify-between z-10 hidden md:flex">
          <h2 className="font-semibold text-slate-800">Intelligence Output</h2>
          {result && (
            <div className="text-xs font-medium px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Processing Complete
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {!result && !isProcessing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 max-w-sm mx-auto text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-600 mb-1">Upload meeting materials</p>
                <p className="text-sm text-slate-500">I will extract the meeting summary, identify key risks, highlight talking points, and list actionable next steps based on your constraints.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               {/* Result container */}
               <div className="p-8 prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-indigo-600 prose-li:marker:text-indigo-400">
                 <Markdown remarkPlugins={[remarkGfm]}>
                    {result || "Thinking..."}
                 </Markdown>
                 <div ref={chatEndRef} />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
