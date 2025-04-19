import { useState } from 'react';
import { PDFViewer } from './PDFViewer';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface SplitViewProps {
  originalFile: File | null;
  summarizedPdf: string | null;
  onBack: () => void;
  sections: PDFSection[];
}

export interface PDFSection {
  id: number;
  title: string;
  content: string;
  pageNumber: number;
}

export function SplitView({ originalFile, summarizedPdf, onBack, sections }: SplitViewProps) {
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [originalPageToShow, setOriginalPageToShow] = useState<number | null>(null);
  const [summarizedPageToShow, setSummarizedPageToShow] = useState<number | null>(null);

  const handleSectionHover = (section: PDFSection | null) => {
    if (section) {
      setHoveredSection(section.id);
      setOriginalPageToShow(section.pageNumber);
      setSummarizedPageToShow(section.id);
    } else {
      setHoveredSection(null);
      setOriginalPageToShow(null);
    }
  };

  const handleSectionClick = (section: PDFSection) => {
    setOriginalPageToShow(section.pageNumber);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center p-4 border-b">
        <Button variant="outline" size="sm" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-bold">PDF Summary</h1>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left side - Summarized PDF */}
        <div className="w-1/2 border-r overflow-hidden flex flex-col">
          <div className="p-2 bg-zinc-50 border-b">
            <h2 className="font-medium">Summarized Document</h2>
          </div>
          
          {summarizedPdf ? (
            <div className="flex-1 overflow-hidden">
              <PDFViewer 
                file={summarizedPdf} 
                scrollToPage={summarizedPageToShow || undefined}
                onPageChange={(page) => setSummarizedPageToShow(page)}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4">
              {sections.map((section) => (
                <Card 
                  key={section.id}
                  className={`mb-4 p-4 cursor-pointer transition-colors ${
                    hoveredSection === section.id ? 'bg-zinc-50 border-zinc-300' : ''
                  }`}
                  onMouseEnter={() => handleSectionHover(section)}
                  onMouseLeave={() => handleSectionHover(null)}
                  onClick={() => handleSectionClick(section)}
                >
                  <h3 className="font-medium mb-2">{section.title}</h3>
                  <p className="text-sm text-zinc-700">{section.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Separator */}
        <Separator orientation="vertical" />
        
        {/* Right side - Original PDF */}
        <div className="w-1/2 overflow-hidden flex flex-col">
          <div className="p-2 bg-zinc-50 border-b">
            <h2 className="font-medium">Original Document</h2>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {originalFile && (
              <PDFViewer 
                file={originalFile} 
                highlightedSection={hoveredSection}
                scrollToPage={originalPageToShow || undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
