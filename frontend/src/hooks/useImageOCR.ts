import { useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';

export const useImageOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');

  const preprocessImage = useCallback(async (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      img.onload = () => {
        const scale = 4;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          if (gray > 80) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        resolve(canvas.toDataURL('image/png'));
      };

      img.src = URL.createObjectURL(blob);
    });
  }, []);

  const extractNumbersFromImage = useCallback(async (imageFile: File | Blob): Promise<string> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const processedImage = await preprocessImage(imageFile);
      
      const result = await Tesseract.recognize(
        processedImage,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        }
      );

      console.log('📝 Texto OCR completo:', result.data.text);
      
      const allText = result.data.text.replace(/\s+/g, ' ');
      const numbers = allText.match(/\d+/g);
      
      if (numbers && numbers.length > 0) {
        const validNumbers = numbers
          .map(n => parseInt(n))
          .filter(n => !isNaN(n) && n >= 0 && n <= 36);
        
        console.log('✅ Números válidos extraídos:', validNumbers);
        
        return validNumbers.join(',');
      }
      
      return '';
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [preprocessImage]);

  const handlePasteImage = useCallback(async (event: ClipboardEvent): Promise<string | null> => {
    const items = event.clipboardData?.items;
    if (!items) return null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault();
        
        const blob = item.getAsFile();
        if (!blob) continue;

        try {
          const numbers = await extractNumbersFromImage(blob);
          return numbers;
        } catch (error) {
          console.error('Erro ao processar imagem colada:', error);
          return null;
        }
      }
    }
    
    return null;
  }, [extractNumbersFromImage]);

  return {
    isProcessing,
    progress,
    extractNumbersFromImage,
    handlePasteImage,
  };
};
