import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDownloadSchema, updateDownloadSchema } from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const activeDownloads = new Map<number, any>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get all downloads
  app.get("/api/downloads", async (req, res) => {
    try {
      const downloads = await storage.getAllDownloads();
      res.json(downloads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch downloads" });
    }
  });

  // Get active downloads
  app.get("/api/downloads/active", async (req, res) => {
    try {
      const activeDownloads = await storage.getActiveDownloads();
      res.json(activeDownloads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active downloads" });
    }
  });

  // Start download
  app.post("/api/downloads", async (req, res) => {
    try {
      const downloadData = insertDownloadSchema.parse(req.body);
      const download = await storage.createDownload(downloadData);
      
      // Start the download process
      startDownload(download.id, downloadData.url, downloadData.format || "mp4", downloadData.quality || "best");
      
      res.json(download);
    } catch (error) {
      res.status(400).json({ message: "Invalid download data" });
    }
  });

  // Stop download
  app.post("/api/downloads/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const download = await storage.getDownload(id);
      
      if (!download) {
        return res.status(404).json({ message: "Download not found" });
      }

      // Kill the process if it exists
      const process = activeDownloads.get(id);
      if (process) {
        process.kill();
        activeDownloads.delete(id);
      }

      // Update download status
      const updatedDownload = await storage.updateDownload(id, { status: "stopped" });
      
      res.json(updatedDownload);
    } catch (error) {
      res.status(500).json({ message: "Failed to stop download" });
    }
  });

  // Delete download
  app.delete("/api/downloads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const download = await storage.getDownload(id);
      
      if (!download) {
        return res.status(404).json({ message: "Download not found" });
      }

      // Stop the process if it's active
      const process = activeDownloads.get(id);
      if (process) {
        process.kill();
        activeDownloads.delete(id);
      }

      // Delete the file if it exists
      if (download.filePath && fs.existsSync(download.filePath)) {
        fs.unlinkSync(download.filePath);
      }

      await storage.deleteDownload(id);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete download" });
    }
  });

  // Test URL endpoint
  app.post("/api/test-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Test URL with yt-dlp to get basic info
      const testArgs = [url, '--get-title', '--get-duration', '--no-warnings'];
      const testProcess = spawn('yt-dlp', testArgs);
      
      let title = '';
      let duration = '';
      let error = '';
      
      testProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (!title) {
          title = output;
        } else if (!duration) {
          duration = output;
        }
      });
      
      testProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      testProcess.on('close', (code) => {
        if (code === 0 && title) {
          res.json({ 
            success: true, 
            title, 
            duration: duration || 'Unknown',
            message: 'URL válida e disponível para download' 
          });
        } else {
          res.json({ 
            success: false, 
            message: 'URL não disponível ou inválida',
            error: error || 'Unable to access video'
          });
        }
      });

    } catch (error) {
      res.status(500).json({ message: "Failed to test URL" });
    }
  });

  // Get download stats
  app.get("/api/stats", async (req, res) => {
    try {
      const allDownloads = await storage.getAllDownloads();
      const activeDownloads = await storage.getActiveDownloads();
      
      const totalDownloads = allDownloads.length;
      const completedDownloads = allDownloads.filter(d => d.status === "completed").length;
      const failedDownloads = allDownloads.filter(d => d.status === "failed").length;
      
      // Calculate total storage used (mock for now since we don't have real file sizes)
      const storageUsed = allDownloads
        .filter(d => d.status === "completed" && d.fileSize)
        .reduce((total, d) => {
          const size = parseFloat(d.fileSize?.replace(/[^\d.]/g, '') || '0');
          return total + size;
        }, 0);

      res.json({
        totalDownloads,
        activeDownloads: activeDownloads.length,
        completedDownloads,
        failedDownloads,
        storageUsed: `${storageUsed.toFixed(1)} MB`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return httpServer;
}

async function startDownload(downloadId: number, url: string, format: string, quality: string) {
  try {
    // Ensure downloads directory exists
    const downloadsDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Update status to downloading
    await storage.updateDownload(downloadId, { status: "downloading" });

    // Get video title first
    const titleArgs = [url, '--get-title', '--no-warnings'];
    const titleProcess = spawn('yt-dlp', titleArgs);
    let videoTitle = '';
    
    titleProcess.stdout.on('data', (data) => {
      videoTitle = data.toString().trim();
    });
    
    await new Promise((resolve) => {
      titleProcess.on('close', () => resolve(null));
    });
    
    if (videoTitle) {
      await storage.updateDownload(downloadId, { title: videoTitle });
    }

    // Prepare yt-dlp command with better compatibility
    const qualityFlag = quality === "audio" ? "--extract-audio --audio-format mp3" : `-f ${quality}`;
    const formatFlag = format === "mp3" ? "--extract-audio --audio-format mp3" : `--recode-video ${format}`;
    
    const args = [
      url,
      '--newline',
      '--no-playlist',
      '--output', path.join(downloadsDir, '%(title)s.%(ext)s'),
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      '--referer', 'https://www.youtube.com/',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      ...qualityFlag.split(' '),
      ...formatFlag.split(' ')
    ];

    // Check if yt-dlp is available, otherwise use yt-dlp from npm or system
    const ytDlpCmd = 'yt-dlp';
    const child = spawn(ytDlpCmd, args);
    
    activeDownloads.set(downloadId, child);

    let title = '';
    
    child.stdout.on('data', async (data) => {
      const output = data.toString();
      console.log('yt-dlp output:', output);
      
      // Parse yt-dlp output for progress information
      const progressMatch = output.match(/(\d+\.?\d*)%/);
      const speedMatch = output.match(/(\d+\.?\d*[KMGT]?iB\/s)/);
      const etaMatch = output.match(/ETA (\d+:\d+)/);
      const sizeMatch = output.match(/(\d+\.?\d*[KMGT]?iB)/);
      const titleMatch = output.match(/\[download\] Destination: (.+)/);
      
      if (titleMatch) {
        title = path.basename(titleMatch[1], path.extname(titleMatch[1]));
      }
      
      const updates: any = {};
      if (progressMatch) updates.progress = Math.round(parseFloat(progressMatch[1]));
      if (speedMatch) updates.downloadSpeed = speedMatch[1];
      if (etaMatch) updates.eta = etaMatch[1];
      if (sizeMatch) updates.fileSize = sizeMatch[1];
      if (title) updates.title = title;
      
      if (Object.keys(updates).length > 0) {
        await storage.updateDownload(downloadId, updates);
      }
    });

    child.stderr.on('data', async (data) => {
      const errorMsg = data.toString();
      console.error('yt-dlp error:', errorMsg);
      
      // Check for specific error types and update accordingly
      if (errorMsg.includes('HTTP Error 403') || errorMsg.includes('Forbidden')) {
        await storage.updateDownload(downloadId, { 
          error: 'Acesso negado. O vídeo pode estar privado ou restrito por região.' 
        });
      } else if (errorMsg.includes('Video unavailable')) {
        await storage.updateDownload(downloadId, { 
          error: 'Vídeo não disponível. Pode ter sido removido ou está privado.' 
        });
      } else if (errorMsg.includes('Sign in to confirm your age')) {
        await storage.updateDownload(downloadId, { 
          error: 'Vídeo com restrição de idade. Necessário autenticação.' 
        });
      }
    });

    child.on('close', async (code) => {
      activeDownloads.delete(downloadId);
      
      if (code === 0) {
        // Download completed successfully
        const filePath = path.join(downloadsDir, `${title}.${format}`);
        await storage.updateDownload(downloadId, { 
          status: "completed", 
          progress: 100,
          filePath 
        });
      } else {
        // Download failed
        await storage.updateDownload(downloadId, { 
          status: "failed", 
          error: `yt-dlp exited with code ${code}` 
        });
      }

    });

  } catch (error) {
    console.error('Download error:', error);
    await storage.updateDownload(downloadId, { 
      status: "failed", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });

  }
}
