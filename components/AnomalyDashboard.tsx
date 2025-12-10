import React, { useState } from 'react';
import { Transaction } from '../types';
import { analyzeRiskAnomalies } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { AlertTriangle, CheckCircle, RefreshCw, AlertOctagon } from 'lucide-react';
import { formatCurrency } from '../utils';

interface Props {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const AnomalyDashboard: React.FC<Props> = ({ transactions, setTransactions }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const analyzed = await analyzeRiskAnomalies(transactions);
    setTransactions(analyzed);
    setIsAnalyzing(false);
  };

  const highRiskCount = transactions.filter(t => t.riskScore > 75).length;
  const mediumRiskCount = transactions.filter(t => t.riskScore > 30 && t.riskScore <= 75).length;
  const lowRiskCount = transactions.filter(t => t.riskScore <= 30).length;

  const pieData = [
    { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
    { name: 'Medium Risk', value: mediumRiskCount, color: '#f59e0b' },
    { name: 'Low Risk', value: lowRiskCount, color: '#10b981' },
  ];

  const sortedByRisk = [...transactions].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Anomaly Detection Dashboard</h2>
          <p className="text-slate-500">Predictive risk scoring of Accounts Receivable ledger</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <AlertOctagon size={20} />}
          {isAnalyzing ? 'Running Risk Models...' : 'Run Risk Assessment'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">High Risk Anomalies</p>
              <h3 className="text-3xl font-bold text-slate-900">{highRiskCount}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Safe Transactions</p>
              <h3 className="text-3xl font-bold text-slate-900">{lowRiskCount}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <RefreshCw size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Analyzed</p>
              <h3 className="text-3xl font-bold text-slate-900">{transactions.length}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
          <h3 className="text-lg font-semibold mb-6">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-sm text-slate-600">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Top Risks List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">Top Risk Factors Detected</h3>
          <div className="space-y-4">
            {sortedByRisk.map((tx) => (
              <div key={tx.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                <div className={`mt-1 w-2 h-2 rounded-full ${tx.riskScore > 75 ? 'bg-red-500' : 'bg-orange-400'}`} />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-900">{tx.customer}</span>
                    <span className="font-mono text-slate-600">{formatCurrency(tx.amount)}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{tx.description}</p>
                  {tx.riskReason && (
                    <div className="mt-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                      {tx.riskReason}
                    </div>
                  )}
                </div>
                <div className="text-right">
                    <span className={`text-lg font-bold ${tx.riskScore > 75 ? 'text-red-600' : 'text-orange-500'}`}>
                        {tx.riskScore}
                    </span>
                    <span className="block text-xs text-slate-400">Score</span>
                </div>
              </div>
            ))}
            {sortedByRisk.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                    Run the assessment to see risk factors.
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDashboard;