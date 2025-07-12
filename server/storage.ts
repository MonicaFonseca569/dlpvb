import { users, downloads, type User, type InsertUser, type Download, type InsertDownload, type UpdateDownload } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Download methods
  createDownload(download: InsertDownload): Promise<Download>;
  getDownload(id: number): Promise<Download | undefined>;
  updateDownload(id: number, updates: UpdateDownload): Promise<Download | undefined>;
  getAllDownloads(): Promise<Download[]>;
  getActiveDownloads(): Promise<Download[]>;
  deleteDownload(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private downloads: Map<number, Download>;
  private currentUserId: number;
  private currentDownloadId: number;

  constructor() {
    this.users = new Map();
    this.downloads = new Map();
    this.currentUserId = 1;
    this.currentDownloadId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = this.currentDownloadId++;
    const now = new Date();
    const download: Download = {
      ...insertDownload,
      id,
      title: null,
      status: "pending",
      progress: 0,
      fileSize: null,
      downloadSpeed: null,
      eta: null,
      filePath: null,
      error: null,
      createdAt: now,
      updatedAt: now,
      format: insertDownload.format || "mp4",
      quality: insertDownload.quality || "best",
    };
    this.downloads.set(id, download);
    return download;
  }

  async getDownload(id: number): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async updateDownload(id: number, updates: UpdateDownload): Promise<Download | undefined> {
    const download = this.downloads.get(id);
    if (!download) return undefined;
    
    const updatedDownload: Download = {
      ...download,
      ...updates,
      updatedAt: new Date(),
    };
    this.downloads.set(id, updatedDownload);
    return updatedDownload;
  }

  async getAllDownloads(): Promise<Download[]> {
    return Array.from(this.downloads.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getActiveDownloads(): Promise<Download[]> {
    return Array.from(this.downloads.values()).filter(
      download => download.status === "downloading" || download.status === "pending"
    );
  }

  async deleteDownload(id: number): Promise<boolean> {
    return this.downloads.delete(id);
  }
}

export const storage = new MemStorage();
