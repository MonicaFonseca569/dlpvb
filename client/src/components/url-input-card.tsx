import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link, CheckCircle, X } from "lucide-react";

interface URLInputCardProps {
  onNotification: (type: string, message: string, detail?: string) => void;
  url: string;
  setUrl: (url: string) => void;
  quality: string;
  setQuality: (quality: string) => void;
  format: string;
  setFormat: (format: string) => void;
}

export default function URLInputCard({ onNotification, url, setUrl, quality, setQuality, format, setFormat }: URLInputCardProps) {
  const [urlStatus, setUrlStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  const validateUrl = async (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setUrlStatus('idle');
      return;
    }

    setUrlStatus('validating');
    
    try {
      const response = await fetch('/api/test-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputUrl }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUrlStatus('valid');
        onNotification('success', 'URL válida!', `${result.title} - ${result.duration}`);
      } else {
        setUrlStatus('invalid');
        onNotification('error', 'URL inválida', result.message || 'Não foi possível acessar o vídeo');
      }
    } catch (error) {
      // Fallback to simple pattern matching if server test fails
      const videoUrlPatterns = [
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/,
        /^https?:\/\/(www\.)?vimeo\.com/,
        /^https?:\/\/(www\.)?dailymotion\.com/,
        /^https?:\/\/(www\.)?twitch\.tv/,
      ];

      const isValid = videoUrlPatterns.some(pattern => pattern.test(inputUrl));
      setUrlStatus(isValid ? 'valid' : 'invalid');
      
      if (isValid) {
        onNotification('warning', 'URL detectada', 'Não foi possível verificar se está disponível');
      } else {
        onNotification('error', 'URL não suportada', 'Formato de URL não reconhecido');
      }
    }
  };

  const clearUrl = () => {
    setUrl("");
    setUrlStatus('idle');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    validateUrl(newUrl);
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Link className="text-primary mr-3" size={20} />
          Video URL
        </h2>
        
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="url"
              placeholder="Paste YouTube, Vimeo, or other video platform URL here..."
              value={url}
              onChange={handleUrlChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 pr-10"
            />
            {url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearUrl}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-1 h-auto"
              >
                <X size={16} />
              </Button>
            )}
          </div>
          
          {/* URL Validation Indicator */}
          {urlStatus === 'validating' && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-primary">Verificando URL...</span>
            </div>
          )}
          
          {urlStatus === 'valid' && (
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="text-success" size={16} />
              <span className="text-success">URL válida e disponível</span>
            </div>
          )}
          
          {urlStatus === 'invalid' && (
            <div className="flex items-center space-x-2 text-sm">
              <X className="text-error" size={16} />
              <span className="text-error">URL inválida ou indisponível</span>
            </div>
          )}

          {/* Format Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best Quality (1080p)</SelectItem>
                <SelectItem value="worst[height>=720]">High Quality (720p)</SelectItem>
                <SelectItem value="worst[height>=480]">Medium Quality (480p)</SelectItem>
                <SelectItem value="audio">Audio Only (MP3)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4 Video</SelectItem>
                <SelectItem value="webm">WEBM Video</SelectItem>
                <SelectItem value="mp3">MP3 Audio</SelectItem>
                <SelectItem value="m4a">M4A Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
