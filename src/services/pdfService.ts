import { pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
import { extractSections, summarizeText } from './openai';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export interface PDFSection {
  id: number;
  title: string;
  content: string;
  pageNumber: number;
}

/**
 * Extract text from a PDF file
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Process a PDF file and generate a summarized version
 */
export const processPDF = async (
  file: File,
  apiKey: string,
  options = {
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 2000,
  }
): Promise<{ sections: PDFSection[], summarizedPdfUrl: string | null }> => {
  try {
    const pdfText = await extractTextFromPDF(file);
    
    const extractedSections = await extractSections(pdfText, apiKey, options);
    
    const sections: PDFSection[] = extractedSections.map((section: any, index: number) => ({
      id: index + 1,
      title: section.title || `Section ${index + 1}`,
      content: section.content || '',
      pageNumber: section.pageNumber || 1,
    }));
    
    return { sections, summarizedPdfUrl: null };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF');
  }
};

/**
 * Create a summarized PDF from the original PDF and extracted sections
 * This is a placeholder for now - in a real implementation, we would use pdf-lib to create a new PDF
 */
export const createSummarizedPDF = async (
  originalPdf: ArrayBuffer,
  sections: PDFSection[]
): Promise<Uint8Array> => {
  try {
    const pdfDoc = await PDFDocument.load(originalPdf);
    
    const newPdfDoc = await PDFDocument.create();
    
    const pages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach(page => {
      newPdfDoc.addPage(page);
    });
    
    return await newPdfDoc.save();
  } catch (error) {
    console.error('Error creating summarized PDF:', error);
    throw new Error('Failed to create summarized PDF');
  }
};
