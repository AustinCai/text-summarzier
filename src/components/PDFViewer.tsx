import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | string | null;
  onPageChange?: (pageNumber: number) => void;
  highlightedSection?: number | null;
  scrollToPage?: number;
}

export function PDFViewer({ file, onPageChange, highlightedSection, scrollToPage }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    pageRefs.current = Array(numPages).fill(null);
  };

  const changePage = (offset: number) => {
    const newPageNumber = pageNumber + offset;
    if (newPageNumber >= 1 && newPageNumber <= (numPages || 1)) {
      setPageNumber(newPageNumber);
      if (onPageChange) {
        onPageChange(newPageNumber);
      }
    }
  };

  const zoom = (factor: number) => {
    setScale(prevScale => {
      const newScale = prevScale + factor;
      return Math.max(0.5, Math.min(newScale, 2.5)); // Limit scale between 0.5 and 2.5
    });
  };

  useEffect(() => {
    if (scrollToPage && scrollToPage > 0 && scrollToPage <= (numPages || 1)) {
      const pageRef = pageRefs.current[scrollToPage - 1];
      if (pageRef && containerRef.current) {
        pageRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [scrollToPage, numPages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(1)}
            disabled={pageNumber >= (numPages || 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => zoom(-0.1)}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => zoom(0.1)}
            disabled={scale >= 2.5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-auto"
      >
        {file && (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex flex-col items-center"
          >
            {Array.from(new Array(numPages || 0), (_, index) => (
              <div 
                key={`page_${index + 1}`}
                ref={el => pageRefs.current[index] = el}
                className={`mb-4 ${
                  highlightedSection === index + 1 ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50' : ''
                }`}
              >
                <Page
                  pageNumber={index + 1}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onGetTextSuccess={() => {
                  }}
                />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}
