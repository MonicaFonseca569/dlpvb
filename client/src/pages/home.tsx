import { useState, useEffect } from "react";
import { Download } from "@shared/schema";
import URLInputCard from "@/components/url-input-card";
import ControlButtons from "@/components/control-buttons";
import DownloadProgress from "@/components/download-progress";
import ResultsSidebar from "@/components/results-sidebar";
import NotificationArea from "@/components/notification-area";

export default function Home() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [activeDownload, setActiveDownload] = useState<Download | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; message: string; detail?: string }>>([]);
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("best");
  const [format, setFormat] = useState("mp4");

  // Polling for download updates (simplified version without WebSocket)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/downloads/active');
        const activeDownloads = await response.json();
        
        if (activeDownloads.length > 0) {
          const currentDownload = activeDownloads[0];
          setActiveDownload(currentDownload);
          
          // Check if download was completed
          if (currentDownload.status === 'completed' && activeDownload?.status === 'downloading') {
            addNotification('success', 'Download completed!', `${currentDownload.title} has been saved`);
            setActiveDownload(null);
          } else if (currentDownload.status === 'failed' && activeDownload?.status === 'downloading') {
            addNotification('error', 'Download failed', currentDownload.error || 'Unknown error occurred');
            setActiveDownload(null);
          }
        } else if (activeDownload) {
          setActiveDownload(null);
        }
      } catch (error) {
        console.error('Error polling downloads:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeDownload]);

  const addNotification = (type: string, message: string, detail?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message, detail }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <i className="fas fa-download text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Video Download Manager</h1>
                <p className="text-sm text-gray-500">Simple & Fast Video Downloader</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">v1.0.0</span>
              <div className="h-6 w-px bg-gray-300"></div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <i className="fas fa-cog text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input & Controls Section */}
          <div className="lg:col-span-2 space-y-6">
            <URLInputCard 
              onNotification={addNotification}
              url={url}
              setUrl={setUrl}
              quality={quality}
              setQuality={setQuality}
              format={format}
              setFormat={setFormat}
            />
            <ControlButtons 
              activeDownload={activeDownload} 
              onNotification={addNotification}
              onDownloadStart={setActiveDownload}
              url={url}
              quality={quality}
              format={format}
            />
            {activeDownload && <DownloadProgress download={activeDownload} />}
          </div>

          {/* Results & History Sidebar */}
          <ResultsSidebar onNotification={addNotification} />
        </div>
      </main>

      <NotificationArea 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  );
}
