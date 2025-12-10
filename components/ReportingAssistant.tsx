import React, { useState, useEffect, useRef } from 'react';
import { Transaction, DocumentVerificationResult } from '../types';
import { generateAuditSummary, chatWithAuditor } from '../services/geminiService';
import { Bot, Send, FileOutput, Loader2, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  transactions: Transaction[];
  documents: DocumentVerificationResult[];
}

const ReportingAssistant: React.FC<Props> = ({ transactions, documents }) => {
  const [report, setReport] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    const summary = await generateAuditSummary(transactions, documents);
    setReport(summary);
    setIsGenerating(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg = inputValue;
    setInputValue("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    // Prepare context for the chat
    const contextData = `
        Summary of Audit State:
        Transactions Count: ${transactions.length}
        High Risk Transactions: ${transactions.filter(t => t.riskScore > 70).length}
        Document Verifications: ${documents.length}
        Failed Cut-off Tests: ${documents.filter(d => !d.cutOffTestPassed).length}
        Current Generated Report: ${report.substring(0, 500)}...
    `;

    const response = await chatWithAuditor([...messages, { role: 'user', text: userMsg }], contextData);
    
    setMessages(prev => [...prev, { role: 'model', text: response || "I couldn't process that request." }]);
    setIsChatting(false);
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Main Report Area */}
      <div className="flex-1 p-8 overflow-y-auto border-r border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Generative Reporting</h2>
            <p className="text-slate-500">Draft findings and journals using GenAI</p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <FileOutput size={20} />}
            {isGenerating ? 'Drafting Report...' : 'Generate Audit Draft'}
          </button>
        </div>

        {report ? (
          <div className="prose prose-slate max-w-none bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <FileOutput size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Click "Generate Audit Draft" to synthesize findings from the audit modules.</p>
          </div>
        )}
      </div>

      {/* Chat Sidebar */}
      <div className="w-[400px] flex flex-col bg-white border-l border-slate-200">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Bot size={18} className="text-indigo-600" />
            Audit Assistant
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-10 text-sm">
                    Ask me about specific invoices, accounting standards, or to refine the generated report.
                </div>
            )}
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-100 text-indigo-600'}`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3 rounded-lg text-sm max-w-[80%] ${
                        msg.role === 'user' 
                        ? 'bg-slate-800 text-white rounded-tr-none' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                </div>
            ))}
            {isChatting && (
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                         <Bot size={16} />
                    </div>
                    <div className="bg-slate-100 p-3 rounded-lg rounded-tl-none">
                        <Loader2 className="animate-spin text-slate-400" size={16} />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-100">
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about findings..."
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isChatting}
                    className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportingAssistant;