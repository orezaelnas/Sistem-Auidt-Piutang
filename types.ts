export enum AuditStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FLAGGED = 'FLAGGED',
  CLEARED = 'CLEARED'
}

export interface Transaction {
  id: string;
  date: string;
  customer: string;
  amount: number;
  description: string;
  riskScore: number; // 0-100
  riskReason?: string;
}

export interface ExtractedDocumentData {
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate?: string; // For cut-off testing
  totalAmount: number;
  customerName: string;
  lineItemsSummary?: string;
  documentType: 'Invoice' | 'Delivery Note' | 'Unknown';
}

export interface DocumentVerificationResult {
  id: string;
  fileName: string;
  uploadedAt: string;
  extraction: ExtractedDocumentData | null;
  cutOffTestPassed: boolean | null; // Null if not applicable
  notes: string;
}

export interface AuditContextState {
  transactions: Transaction[];
  documents: DocumentVerificationResult[];
  analyzed: boolean;
}