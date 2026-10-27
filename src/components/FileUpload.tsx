
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { extractResumeText } from '@/utils/documentParser';

interface FileUploadProps {
  onFileUpload: (file: File, text: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (selectedFile: File) => {
    try {
      // Check file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const isPdfOrDocx = selectedFile.name.toLowerCase().endsWith('.pdf') || 
                          selectedFile.name.toLowerCase().endsWith('.docx') ||
                          validTypes.includes(selectedFile.type);
      if (!isPdfOrDocx) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOCX file",
          variant: "destructive"
        });
        return;
      }

      // Check file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      setIsProcessing(true);

      // Extract real text from PDF or DOCX file
      let extractedText = '';
      try {
        extractedText = await extractResumeText(selectedFile);
      } catch (extractError) {
        console.warn("Real document parsing failed, falling back to basic extraction", extractError);
        extractedText = await selectedFile.text();
      }
      
      setIsProcessing(false);
      onFileUpload(selectedFile, extractedText);
      
      toast({
        title: "Resume uploaded",
        description: "Your resume has been successfully uploaded and processed.",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      setIsProcessing(false);
      toast({
        title: "Processing error",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <Card className={`p-6 resume-card transition-all duration-300 ${isDragging ? 'border-alchemy-500 animate-pulse-glow' : ''}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          flex flex-col items-center justify-center rounded-lg border-2 border-dashed
          py-10 px-6 text-center transition-all cursor-pointer
          ${isDragging ? 'border-alchemy-500 bg-alchemy-50/30' : 'border-gray-300 hover:bg-gray-50/50'}
        `}
      >
        {!file && !isProcessing && (
          <>
            <div className="mb-4 rounded-full bg-alchemy-100 p-3">
              <Upload className="h-6 w-6 text-alchemy-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Upload your resume</h3>
            <p className="mb-4 text-sm text-gray-500">
              Drag and drop your resume file here, or click to browse
            </p>
            <p className="text-xs text-gray-400">Supports PDF, DOCX (Max 5MB)</p>
          </>
        )}

        {isProcessing && (
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-alchemy-600"></div>
            <p className="mt-4 text-sm font-medium">Processing your resume...</p>
          </div>
        )}

        {file && !isProcessing && (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-3 h-6 w-6 text-alchemy-600" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          className="hidden"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
      </div>
    </Card>
  );
};

export default FileUpload;
