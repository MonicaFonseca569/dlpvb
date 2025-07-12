import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title"),
  status: text("status").notNull().default("pending"), // pending, downloading, completed, failed, stopped
  progress: integer("progress").default(0),
  fileSize: text("file_size"),
  downloadSpeed: text("download_speed"),
  eta: text("eta"),
  filePath: text("file_path"),
  format: text("format").default("mp4"),
  quality: text("quality").default("best"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDownloadSchema = createInsertSchema(downloads).pick({
  url: true,
  format: true,
  quality: true,
});

export const updateDownloadSchema = createInsertSchema(downloads).pick({
  title: true,
  status: true,
  progress: true,
  fileSize: true,
  downloadSpeed: true,
  eta: true,
  filePath: true,
  error: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type UpdateDownload = z.infer<typeof updateDownloadSchema>;
export type Download = typeof downloads.$inferSelect;
