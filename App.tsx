import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AnomalyDashboard from './components/AnomalyDashboard';
import DocumentVerification from './components/DocumentVerification';
import ReportingAssistant from './components/ReportingAssistant';
import { Transaction, DocumentVerificationResult } from './types';

// Mock Initial Data for Prototype
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TXN-001', date: '2024-11-15', customer: 'Acme Corp', amount: 5000.00, description: 'Consulting Services', riskScore: 10 },
  { id: 'TXN-002', date: '2024-12-24', customer: 'Globex Inc', amount: 9999.00, description: 'Software License', riskScore: 0 },
  { id: 'TXN-003', date: '2024-12-31', customer: 'Soylent Corp', amount: 250000.00, description: 'Bulk Purchase', riskScore: 0 },
  { id: 'TXN-004', date: '2024-12-30', customer: 'Initech', amount: 1234.56, description: 'Office Supplies', riskScore: 0 },
  { id: 'TXN-005', date: '2025-01-02', customer: 'Umbrella Corp', amount: 5000.00, description: 'Medical Supplies', riskScore: 0 },
  { id: 'TXN-006', date: '2024-12-25', customer: 'Cyberdyne', amount: 50000.00, description: 'R&D Hardware', riskScore: 0 }, // Christmas posting
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [documents, setDocuments] = useState<DocumentVerificationResult[]>([]);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnomalyDashboard transactions={transactions} setTransactions={setTransactions} />;
      case 'documents':
        return <DocumentVerification documents={documents} setDocuments={setDocuments} />;
      case 'reporting':
        return <ReportingAssistant transactions={transactions} documents={documents} />;
      default:
        return <AnomalyDashboard transactions={transactions} setTransactions={setTransactions} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 h-full overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;