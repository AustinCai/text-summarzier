import { PDFDocument, StandardFonts } from 'pdf-lib';
import { extractTextFromPDFWithOpenAI, summarizeText } from './openai';

export interface PDFSection {
  id: number;
  title: string;
  content: string;
  pageNumber: number;
}

/**
 * Process a PDF file and generate a summarized version
 */
export const processPDF = async (
  file: File,
  apiKey: string,
  options = {
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 4000,
  }
): Promise<{ sections: PDFSection[], summarizedPdfUrl: string | null }> => {
  try {
    console.log('Processing PDF with OpenAI...');
    
    const extractedSections = await extractTextFromPDFWithOpenAI(file, options);
    
    console.log('Extracted sections:', extractedSections);
    
    // Summarize each section
    const sections: PDFSection[] = await Promise.all(
      extractedSections.map(async (section: any, index: number) => {
        const summarizedContent = await summarizeText(
          section.content || '',
          apiKey,
          {
            ...options,
            model: 'gpt-4', // Use gpt-4 for summarization
            maxTokens: Math.min(options.maxTokens, 1000) // Limit tokens for each section
          }
        );
        
        return {
          id: index + 1,
          title: section.title || `Section ${index + 1}`,
          content: summarizedContent || section.content || '',
          pageNumber: section.pageNumber || 1,
        };
      })
    );
    
    const arrayBuffer = await file.arrayBuffer();
    const summarizedPdfBytes = await createSummarizedPDF(arrayBuffer, sections);
    
    const blob = new Blob([summarizedPdfBytes], { type: 'application/pdf' });
    const summarizedPdfUrl = URL.createObjectURL(blob);
    
    return { sections, summarizedPdfUrl };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF: ' + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Create a summarized PDF from the original PDF and extracted sections
 * Uses pdf-lib to create a new PDF with summarized content while preserving structure
 */
export const createSummarizedPDF = async (
  originalPdf: ArrayBuffer,
  sections: PDFSection[]
): Promise<Uint8Array> => {
  try {
    const pdfDoc = await PDFDocument.load(originalPdf);
    
    const newPdfDoc = await PDFDocument.create();
    
    const helveticaFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await newPdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const originalPages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
    
    for (const section of sections) {
      const page = originalPages[Math.min(section.pageNumber - 1, originalPages.length - 1)];
      const { width, height } = page.getSize();
      const newPage = newPdfDoc.addPage([width, height]);
      
      newPage.drawText(section.title, {
        x: 50,
        y: newPage.getHeight() - 50,
        size: 16,
        font: helveticaBold,
      });
      
      const contentLines = wrapText(section.content, 80); // Wrap at 80 characters
      let yPosition = newPage.getHeight() - 80;
      
      for (const line of contentLines) {
        newPage.drawText(line, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
        });
        yPosition -= 15; // Move down for the next line
        
        if (yPosition < 50) {
          const { width, height } = page.getSize();
          const continuationPage = newPdfDoc.addPage([width, height]);
          yPosition = continuationPage.getHeight() - 50;
        }
      }
    }
    
    return await newPdfDoc.save();
  } catch (error) {
    console.error('Error creating summarized PDF:', error);
    throw new Error('Failed to create summarized PDF');
  }
};

/**
 * Helper function to wrap text at a specified character width
 */
const wrapText = (text: string, maxCharsPerLine: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
      currentLine += (currentLine.length > 0 ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
};
