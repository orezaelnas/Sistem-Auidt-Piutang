import React, { useState } from 'react';
import { Upload, FileText, Check, X, Loader2 } from 'lucide-react';
import { DocumentVerificationResult, ExtractedDocumentData } from '../types';
import { extractDocumentData } from '../services/geminiService';
import { fileToBase64, formatCurrency } from '../utils';

interface Props {
  documents: DocumentVerificationResult[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentVerificationResult[]>>;
}

const DocumentVerification: React.FC<Props> = ({ documents, setDocuments }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      const extracted = await extractDocumentData(base64, file.type);
      
      // Basic Cut-off test logic
      // Assuming fiscal year end is Dec 31, 2024 for this prototype
      const fyEnd = new Date('2024-12-31').getTime();
      let passed = true;
      let notes = "Verified.";
      
      if (extracted.invoiceDate && extracted.deliveryDate) {
          const invDate = new Date(extracted.invoiceDate).getTime();
          const delDate = new Date(extracted.deliveryDate).getTime();
          
          if (invDate > fyEnd && delDate <= fyEnd) {
              passed = false;
              notes = "Potential Cut-off Error: Goods delivered before Year End, Invoiced after.";
          } else if (invDate <= fyEnd && delDate > fyEnd) {
              passed = false;
               notes = "Potential Cut-off Error: Invoiced before Year End, Goods delivered after.";
          }
      } else {
          notes = "Dates missing for cut-off test.";
          passed = false; // Flag for review if dates missing
      }

      const newDoc: DocumentVerificationResult = {
        id: Math.random().toString(36).substr(2, 9),
        fileName: file.name,
        uploadedAt: new Date().toLocaleTimeString(),
        extraction: extracted,
        cutOffTestPassed: passed,
        notes
      };

      setDocuments(prev => [newDoc, ...prev]);
    } catch (error) {
      alert("Failed to process document. Please try a valid image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Document Verification Module</h2>
        <p className="text-slate-500">Automated cut-off testing using Document AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="lg:col-span-1">
          <div 
            className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isProcessing ? (
                <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                    <p className="text-slate-600 font-medium">Extracting data with AI...</p>
                </div>
            ) : (
                <>
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <Upload size={32} />
                    </div>
                    <p className="text-slate-700 font-medium mb-2">Drag & Drop Invoice Image</p>
                    <p className="text-sm text-slate-500 mb-6">or click to browse</p>
                    <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleChange}
                    />
                    <label 
                        htmlFor="file-upload"
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                        Select File
                    </label>
                </>
            )}
          </div>
          
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
             <h4 className="font-semibold text-blue-900 text-sm mb-2">Testing Parameters</h4>
             <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                 <li>Fiscal Year End: <strong>31 Dec 2024</strong></li>
                 <li>Doc Type: Invoice, Delivery Note</li>
                 <li>Verification: Invoice Date vs Delivery Date</li>
             </ul>
          </div>
        </div>

        {/* Results List */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-slate-700">Processed Documents</h3>
            {documents.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400">No documents processed yet.</p>
                </div>
            )}
            
            {documents.map((doc) => (
                <div key={doc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                             <FileText size={18} className="text-slate-400"/>
                             <span className="font-medium text-slate-900">{doc.fileName}</span>
                             <span className="text-xs text-slate-400 ml-auto">{doc.uploadedAt}</span>
                        </div>
                        
                        {doc.extraction ? (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mt-3">
                                <div>
                                    <span className="text-slate-500 block text-xs">Invoice #</span>
                                    <span className="font-medium">{doc.extraction.invoiceNumber || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-xs">Customer</span>
                                    <span className="font-medium">{doc.extraction.customerName || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-xs">Inv Date</span>
                                    <span className="font-medium">{doc.extraction.invoiceDate || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-xs">Del Date</span>
                                    <span className="font-medium">{doc.extraction.deliveryDate || 'N/A'}</span>
                                </div>
                                <div className="col-span-2 mt-1 pt-1 border-t border-slate-100">
                                     <span className="text-slate-500 block text-xs">Total Amount</span>
                                     <span className="font-bold text-slate-900">{formatCurrency(doc.extraction.totalAmount || 0)}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-red-500 text-sm">Extraction failed</p>
                        )}
                    </div>
                    
                    <div className={`w-full md:w-48 p-4 rounded-lg flex flex-col justify-center items-center text-center ${
                        doc.cutOffTestPassed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {doc.cutOffTestPassed ? (
                            <Check size={32} className="mb-2" />
                        ) : (
                            <X size={32} className="mb-2" />
                        )}
                        <span className="font-bold text-sm block">
                            {doc.cutOffTestPassed ? 'Cut-off OK' : 'Cut-off Risk'}
                        </span>
                        <p className="text-xs mt-1 opacity-80">{doc.notes}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;