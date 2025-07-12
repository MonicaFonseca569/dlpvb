import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, StopCircle, FolderOpen, PlayCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Download as DownloadType } from "@shared/schema";

interface ControlButtonsProps {
  activeDownload: DownloadType | null;
  onNotification: (type: string, message: string, detail?: string) => void;
  onDownloadStart: (download: DownloadType) => void;
  url: string;
  quality: string;
  format: string;
}

export default function ControlButtons({ activeDownload, onNotification, onDownloadStart, url, quality, format }: ControlButtonsProps) {
  const queryClient = useQueryClient();

  const startDownloadMutation = useMutation({
    mutationFn: async (downloadData: { url: string; quality: string; format: string }) => {
      const response = await apiRequest("POST", "/api/downloads", downloadData);
      return response.json();
    },
    onSuccess: (download) => {
      onDownloadStart(download);
      onNotification('success', 'Download started!', `Starting download for ${download.url}`);
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
    },
    onError: (error) => {
      onNotification('error', 'Failed to start download', error.message);
    }
  });

  const stopDownloadMutation = useMutation({
    mutationFn: async (downloadId: number) => {
      const response = await apiRequest("POST", `/api/downloads/${downloadId}/stop`);
      return response.json();
    },
    onSuccess: () => {
      onNotification('warning', 'Download stopped', 'The download has been cancelled');
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
    },
    onError: (error) => {
      onNotification('error', 'Failed to stop download', error.message);
    }
  });

  const handleStartDownload = () => {
    if (!url.trim()) {
      onNotification('error', 'Please enter a valid URL');
      return;
    }

    startDownloadMutation.mutate({
      url: url.trim(),
      quality: quality,
      format: format
    });
  };

  const handleStopDownload = () => {
    if (activeDownload) {
      stopDownloadMutation.mutate(activeDownload.id);
    }
  };

  const handleViewResults = () => {
    // Open downloads folder - this would need to be implemented differently in a web app
    onNotification('info', 'Downloads folder', 'Check your downloads in the sidebar');
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PlayCircle className="text-primary mr-3" size={20} />
          Download Controls
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Download Button */}
          <Button
            onClick={handleStartDownload}
            disabled={!!activeDownload || startDownloadMutation.isPending}
            className="flex items-center justify-center px-6 py-4 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-sm"
          >
            <Download className="mr-2" size={16} />
            <span>
              {startDownloadMutation.isPending ? 'Starting...' : 
               activeDownload ? 'Downloading...' : 'Start Download'}
            </span>
          </Button>

          {/* Stop Download Button */}
          <Button
            onClick={handleStopDownload}
            disabled={!activeDownload || stopDownloadMutation.isPending}
            className="flex items-center justify-center px-6 py-4 bg-error hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-sm"
          >
            <StopCircle className="mr-2" size={16} />
            <span>Stop Download</span>
          </Button>

          {/* View Results Button */}
          <Button
            onClick={handleViewResults}
            className="flex items-center justify-center px-6 py-4 bg-secondary hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <FolderOpen className="mr-2" size={16} />
            <span>View Results</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
