import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import type { Download } from "@shared/schema";

interface DownloadProgressProps {
  download: Download;
}

export default function DownloadProgress({ download }: DownloadProgressProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading': return 'text-primary';
      case 'completed': return 'text-success';
      case 'failed': return 'text-error';
      case 'stopped': return 'text-warning';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="text-primary mr-3" size={20} />
          Download Progress
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 truncate max-w-xs">
              Downloading: "{download.title || download.url}"
            </span>
            <span className="text-primary font-medium">{download.progress || 0}%</span>
          </div>
          
          <Progress value={download.progress || 0} className="w-full" />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-500">Speed</p>
              <p className="font-medium text-gray-900">{download.downloadSpeed || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Size</p>
              <p className="font-medium text-gray-900">{download.fileSize || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">ETA</p>
              <p className="font-medium text-gray-900">{download.eta || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Status</p>
              <p className={`font-medium ${getStatusColor(download.status)}`}>
                {download.status.charAt(0).toUpperCase() + download.status.slice(1)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
