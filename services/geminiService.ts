import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, ExtractedDocumentData } from '../types';
import { cleanJsonString } from '../utils';

// Helper to get AI instance safely
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeRiskAnomalies = async (transactions: Transaction[]): Promise<Transaction[]> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';

    const prompt = `
      Act as an Accounts Receivable Audit Risk Model.
      Analyze the following list of transactions for anomalies.
      Look for:
      1. Round number amounts (potential fraud/estimation).
      2. Weekend postings (unusual activity).
      3. High values relative to others.
      4. Duplicate amounts.

      Return the SAME list of transactions but update the 'riskScore' (0-100) and 'riskReason' fields.
      
      Input Data:
      ${JSON.stringify(transactions.map(t => ({ id: t.id, date: t.date, amount: t.amount, customer: t.customer, description: t.description })))}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              date: { type: Type.STRING },
              customer: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              description: { type: Type.STRING },
              riskScore: { type: Type.NUMBER },
              riskReason: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return transactions;
    return JSON.parse(cleanJsonString(text)) as Transaction[];
  } catch (error) {
    console.error("Risk Analysis Error:", error);
    return transactions;
  }
};

export const extractDocumentData = async (imageBase64: string, mimeType: string): Promise<ExtractedDocumentData> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash'; // Capable of vision

    const prompt = `
      Extract the following fields from this invoice or delivery note image for audit verification:
      - Invoice Number
      - Invoice Date (YYYY-MM-DD format)
      - Delivery Date (if present, YYYY-MM-DD format)
      - Total Amount (numeric)
      - Customer Name
      - Document Type (Invoice or Delivery Note)
      
      If a field is missing, return null or empty string appropriately.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
         responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING },
            invoiceDate: { type: Type.STRING },
            deliveryDate: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            customerName: { type: Type.STRING },
            documentType: { type: Type.STRING, enum: ['Invoice', 'Delivery Note', 'Unknown'] }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(cleanJsonString(text)) as ExtractedDocumentData;
  } catch (error) {
    console.error("Document Extraction Error:", error);
    throw error;
  }
};

export const generateAuditSummary = async (
  transactions: Transaction[], 
  docFindings: any[]
): Promise<string> => {
  try {
    const ai = getAI();
    const model = 'gemini-3-pro-preview'; // Better reasoning for reporting

    const highRisk = transactions.filter(t => t.riskScore > 70);
    
    const prompt = `
      You are an Senior Audit Manager using the SAPC System.
      Write a concise Audit Executive Summary and Draft Journal Entries based on the following findings.
      
      ANOMALY DETECTION FINDINGS:
      Total Transactions Analyzed: ${transactions.length}
      High Risk Transactions Detected: ${highRisk.length}
      Details of High Risk Items: ${JSON.stringify(highRisk)}

      DOCUMENT VERIFICATION FINDINGS:
      ${JSON.stringify(docFindings)}

      Please structure the response as follows:
      1. **Executive Summary**: Brief overview of the AR audit health.
      2. **Key Findings**: Bullet points of specific anomalies and cut-off errors.
      3. **Recommended Adjustments**: Draft Journal Entries (Debits/Credits) for any material misstatements found (especially cut-off errors).
      4. **Conclusion**: Final risk assessment (Low/Medium/High).

      Use professional auditing tone. Format with Markdown.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Reporting Error:", error);
    return "Error generating audit summary. Please check API configuration.";
  }
};

export const chatWithAuditor = async (history: {role: 'user' | 'model', text: string}[], contextData: string) => {
    try {
        const ai = getAI();
        // Using chat model for interaction
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are an AI Audit Assistant for the SAPC system. 
                You have access to the current audit context provided below. 
                Answer questions about specific transactions, risks, or accounting standards (IFRS/GAAP).
                Context Data: ${contextData}`
            }
        });

        // Replay history (simplified for this stateless prototype, normally would maintain chat session object)
        // In a real app, we'd keep the chat instance alive. Here we just send the last message with context.
        // For a better prototype experience, let's just do a single turn generation with history included in prompt 
        // or actually maintain the chat object in the React component. 
        // We will implement the "maintain chat object" pattern in the component, so this function 
        // will actually just be a simple generateContent for a single turn if we don't pass the chat object, 
        // OR the component handles the chat object.
        // Let's stick to a simple generateContent for simplicity of state management in this specific snippet,
        // or assumes the component calls sendMessage on an existing chat instance. 
        
        // Actually, let's return a new message based on the last user input.
        const lastMsg = history[history.length - 1].text;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Context: ${contextData}\n\nChat History:\n${history.map(h => `${h.role}: ${h.text}`).join('\n')}\n\nUser: ${lastMsg}\nModel:`
        });
        
        return response.text;
    } catch (e) {
        console.error(e);
        return "I'm having trouble connecting to the audit brain right now.";
    }
}
