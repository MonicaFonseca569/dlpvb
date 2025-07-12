import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, History, Settings, Trash2, ExternalLink, RotateCcw, Folder } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Download } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ResultsSidebarProps {
  onNotification: (type: string, message: string, detail?: string) => void;
}

export default function ResultsSidebar({ onNotification }: ResultsSidebarProps) {
  const queryClient = useQueryClient();

  const { data: downloads = [], isLoading } = useQuery<Download[]>({
    queryKey: ["/api/downloads"],
    refetchInterval: 2000,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 5000,
  });

  const deleteDownloadMutation = useMutation({
    mutationFn: async (downloadId: number) => {
      const response = await apiRequest("DELETE", `/api/downloads/${downloadId}`);
      return response.json();
    },
    onSuccess: () => {
      onNotification('success', 'Download deleted');
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      onNotification('error', 'Failed to delete download', error.message);
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      // Delete all downloads
      const deletePromises = downloads.map(download => 
        apiRequest("DELETE", `/api/downloads/${download.id}`)
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      onNotification('success', 'All downloads cleared');
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      onNotification('error', 'Failed to clear downloads', error.message);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'downloading': return 'bg-primary';
      case 'failed': return 'bg-error';
      case 'stopped': return 'bg-warning';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'downloading': return 'default';
      case 'failed': return 'destructive';
      case 'stopped': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleOpenFile = (download: Download) => {
    if (download.filePath) {
      onNotification('info', 'File location', download.filePath);
    } else {
      onNotification('warning', 'File not available');
    }
  };

  const handleRetryDownload = (download: Download) => {
    onNotification('info', 'Retry functionality', 'This would restart the download');
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Info className="text-primary mr-3" size={20} />
            Status
          </h2>
          
          {stats && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Downloads</span>
                <span className="font-medium text-gray-900">{stats.totalDownloads}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Downloads</span>
                <span className="font-medium text-warning">{stats.activeDownloads}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Storage Used</span>
                <span className="font-medium text-gray-900">{stats.storageUsed}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Downloads */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <History className="text-primary mr-3" size={20} />
              Recent Downloads
            </h2>
            {downloads.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
                className="text-primary hover:text-blue-600 text-sm font-medium"
              >
                Clear All
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : downloads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="mx-auto mb-2" size={48} />
              <p>No downloads yet</p>
              <p className="text-sm">Start downloading videos to see them here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {downloads.slice(0, 10).map((download) => (
                <div key={download.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 ${getStatusColor(download.status)} rounded-full mt-2`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {download.title || 'Unknown Title'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {download.createdAt && formatDistanceToNow(new Date(download.createdAt), { addSuffix: true })}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getStatusBadgeVariant(download.status)} className="text-xs">
                        {download.status}
                      </Badge>
                      {download.fileSize && (
                        <span className="text-xs text-gray-400">{download.fileSize}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {download.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenFile(download)}
                        className="text-gray-400 hover:text-primary p-1 h-auto"
                      >
                        <ExternalLink size={12} />
                      </Button>
                    )}
                    {download.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryDownload(download)}
                        className="text-gray-400 hover:text-warning p-1 h-auto"
                      >
                        <RotateCcw size={12} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDownloadMutation.mutate(download.id)}
                      disabled={deleteDownloadMutation.isPending}
                      className="text-gray-400 hover:text-error p-1 h-auto"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Quick Access */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="text-primary mr-3" size={20} />
            Quick Settings
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Auto-start downloads</span>
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Download subtitles</span>
              <Button
                variant="ghost"
                size="sm"
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-primary transition-colors"
              onClick={() => onNotification('info', 'Downloads folder', 'Downloads are saved to ./downloads')}
            >
              <Folder className="mr-2" size={16} />
              Open Download Folder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
