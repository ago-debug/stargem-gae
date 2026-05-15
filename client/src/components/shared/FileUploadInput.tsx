import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, UploadCloud, XCircle, FileIcon, ExternalLink } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";

interface FileUploadInputProps {
  endpoint: string;
  extraFields?: Record<string, any>;
  accept?: string;
  maxSizeMB?: number;
  onUploadComplete?: (url: string) => void;
  currentUrl?: string | null;
  buttonText?: string;
  className?: string;
}

export function FileUploadInput({
  endpoint,
  extraFields,
  accept = "application/pdf,image/*",
  maxSizeMB = 10,
  onUploadComplete,
  currentUrl,
  buttonText = "Carica File",
  className = "",
}: FileUploadInputProps) {
  const { upload, progress, error, isUploading, reset } = useFileUpload(endpoint);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLocalError(null);

    // Pre-validation: size limit
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`Il file è troppo grande. Dimensione massima: ${maxSizeMB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const url = await upload(file, extraFields);
      if (onUploadComplete) {
        if (url) onUploadComplete(url);
      }
    } catch (err) {
      // Error handled by the hook
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const displayError = localError || error;

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="flex items-center gap-2 flex-1">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
            >
              <FileIcon className="w-4 h-4" />
              File Caricato
              <ExternalLink className="w-3 h-3" />
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleButtonClick}
              disabled={isUploading}
              className="ml-auto"
            >
              Sostituisci
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
        )}
      </div>

      {isUploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Caricamento in corso...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="w-4 h-4" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
