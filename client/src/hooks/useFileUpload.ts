import { useState, useCallback } from 'react';

interface UseFileUploadReturn {
  upload: (file: File, extraFields?: Record<string, any>) => Promise<string | null>;
  progress: number;
  error: string | null;
  url: string | null;
  reset: () => void;
  isUploading: boolean;
}

export function useFileUpload(endpoint: string): UseFileUploadReturn {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
    setUrl(null);
    setIsUploading(false);
  }, []);

  const upload = useCallback(async (file: File, extraFields?: Record<string, any>) => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    return new Promise<string | null>((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      
      if (extraFields) {
        Object.entries(extraFields).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          setProgress(percentCompleted);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.url) {
              setUrl(response.url);
              setProgress(100);
              resolve(response.url);
            } else {
              throw new Error('URL mancante nella risposta del server');
            }
          } catch (e) {
            const msg = 'Errore nel parsing della risposta del server';
            setError(msg);
            resolve(null);
          }
        } else {
          let errorMessage = "Errore durante l'upload";
          if (xhr.status === 413) {
            errorMessage = 'Il file è troppo grande (supera il limite consentito)';
          } else {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.error) errorMessage = res.error;
            } catch (e) {
              // ignore
            }
          }
          setError(errorMessage);
          resolve(null);
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setError("Errore di rete durante l'upload del file");
        resolve(null);
      };

      xhr.send(formData);
    });
  }, [endpoint]);

  return { upload, progress, error, url, reset, isUploading };
}
