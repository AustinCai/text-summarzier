import { useState } from 'react'
import './App.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, Key } from 'lucide-react'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { SplitView, PDFSection } from './components/SplitView'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog'
import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string>('')
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'upload' | 'summary'>('upload')
  const [summarizedPdf, setSummarizedPdf] = useState<string | null>(null)
  const [sections, setSections] = useState<PDFSection[]>([])

  const onDrop = (acceptedFiles: File[]) => {
    setError(null)
    
    if (acceptedFiles.length === 0) {
      return
    }
    
    const selectedFile = acceptedFiles[0]
    
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }
    
    setFile(selectedFile)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const handleSummarize = async () => {
    if (!file) return
    
    if (!apiKey) {
      setShowApiKeyDialog(true)
      return
    }
    
    setIsProcessing(true)
    
    try {
      const { processPDF } = await import('./services/pdfService');
      
      const { sections, summarizedPdfUrl } = await processPDF(file, apiKey);
      
      setSections(sections);
      if (summarizedPdfUrl) {
        setSummarizedPdf(summarizedPdfUrl);
      }
      
      setCurrentScreen('summary')
    } catch (err) {
      console.error('Error processing PDF:', err)
      setError('An error occurred while processing the PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApiKeySubmit = () => {
    if (!apiKey) {
      setError('Please enter your OpenAI API key')
      return
    }
    
    setShowApiKeyDialog(false)
    handleSummarize()
  }

  const handleBack = () => {
    setCurrentScreen('upload')
    setSummarizedPdf(null)
    setSections([])
  }

  const renderUploadScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">PDF Summarizer</CardTitle>
          <CardDescription>
            Upload a PDF document to generate a section-by-section summary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-zinc-400 bg-zinc-50' 
                : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-10 w-10 text-zinc-400" />
              {isDragActive ? (
                <p>Drop the PDF here...</p>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium">Drag and drop a PDF file here, or click to select</p>
                  <p className="text-sm text-zinc-500">Only PDF files are supported</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {file && (
            <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-md">
              <FileText className="h-5 w-5 text-zinc-500" />
              <div className="flex-1 truncate">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button 
                onClick={handleSummarize} 
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Summarize'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OpenAI API Key</DialogTitle>
            <DialogDescription>
              Your API key is required to use the summarization feature. It will not be stored on our servers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <div className="flex">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <p className="text-xs text-zinc-500">
                You can find your API key in the <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI dashboard</a>.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApiKeySubmit}>
              <Key className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return (
    <>
      {currentScreen === 'upload' ? (
        renderUploadScreen()
      ) : (
        <SplitView 
          originalFile={file} 
          summarizedPdf={summarizedPdf}
          onBack={handleBack}
          sections={sections}
        />
      )}
    </>
  )
}

export default App
