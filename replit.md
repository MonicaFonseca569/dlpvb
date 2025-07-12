# Video Downloader Application

## Overview

This is a modern full-stack video downloader application built with React and Express. The application allows users to download videos from various platforms (YouTube, Vimeo, etc.) with real-time progress tracking through WebSocket connections. It features a clean, responsive UI built with shadcn/ui components and uses PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with hot module replacement and development optimizations

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Design**: RESTful endpoints with real-time WebSocket updates
- **Process Management**: Child process spawning for video downloads
- **Middleware**: Custom logging, error handling, and request parsing

### Data Storage
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Migrations**: Drizzle Kit for schema management
- **Storage Options**: Memory storage implementation for development/testing

## Key Components

### Database Schema
- **Users Table**: Basic user management with username/password
- **Downloads Table**: Comprehensive download tracking with status, progress, metadata, and error handling
- **Validation**: Zod schemas for type-safe data validation

### API Endpoints
- `GET /api/downloads` - Retrieve all downloads
- `GET /api/downloads/active` - Get currently active downloads
- `POST /api/downloads` - Start new video download
- `POST /api/downloads/:id/stop` - Stop active download
- `DELETE /api/downloads/:id` - Remove download record

### Real-time Features
- WebSocket server for live download progress updates
- Broadcast system for multi-client synchronization
- Real-time status changes (downloading, completed, failed, stopped)

### UI Components
- **URL Input Card**: Video URL validation and download configuration
- **Control Buttons**: Start/stop download controls with quality/format selection
- **Download Progress**: Real-time progress tracking with speed, ETA, and file size
- **Results Sidebar**: Download history and management
- **Notification System**: Toast-style notifications for user feedback

## Data Flow

1. **Download Initiation**: User inputs video URL and selects quality/format options
2. **Validation**: Frontend validates URL format for supported platforms
3. **API Request**: POST request creates download record in database
4. **Process Spawning**: Server spawns child process for video download tool (likely yt-dlp)
5. **Real-time Updates**: WebSocket broadcasts progress updates to all connected clients
6. **Status Management**: Download status transitions through pending → downloading → completed/failed/stopped
7. **File Management**: Downloaded files are stored with metadata tracking

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React with extensive Radix UI primitive components
- **Styling**: Tailwind CSS with PostCSS processing
- **State Management**: TanStack Query for server state caching and synchronization
- **Utilities**: date-fns for date formatting, clsx for conditional styling

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL with connection pooling
- **WebSocket**: ws library for real-time communication
- **Process Management**: Node.js child_process for video download execution
- **Session Storage**: connect-pg-simple for PostgreSQL session storage

### Development Tools
- **Build System**: Vite with React plugin and runtime error overlay
- **Development**: Replit-specific plugins for cartographer and error handling
- **TypeScript**: Full type safety across frontend, backend, and shared schemas

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **API Integration**: Express server serves both API and static assets
- **Database**: Environment variable configuration for database URL
- **WebSocket**: Same-origin WebSocket connection for real-time features

### Production Build
- **Frontend**: Vite builds optimized bundle to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Asset Serving**: Express serves static files in production mode
- **Database Migrations**: Drizzle push command for schema deployment

### Configuration Management
- **Environment Variables**: DATABASE_URL for database connection
- **Path Aliases**: TypeScript path mapping for clean imports
- **Build Optimization**: Separate client/server build processes with external package handling

The application follows a modern full-stack architecture with real-time capabilities, designed for scalability and maintainability. The separation of concerns between frontend UI state, backend API logic, and database persistence provides a clean foundation for feature development.

## Recent Changes

### 2025-01-12 - Sistema de Download de Vídeos Implementado
- ✓ Criada aplicação web de download de vídeos inspirada no Tartube
- ✓ Três funcionalidades principais: download, parar download, ver resultados
- ✓ Sistema de validação de URLs em tempo real com yt-dlp
- ✓ Interface responsiva com componentes modernos (shadcn/ui)
- ✓ Monitoramento de progresso via polling (2s intervals)
- ✓ Tratamento de erros específicos (403, vídeo indisponível, restrição de idade)
- ✓ Botões para limpar downloads falhados e histórico completo
- ✓ Notificações visuais para feedback do usuário
- ✓ Suporte para YouTube, Vimeo, Dailymotion, Twitch

### Problemas Resolvidos
- ✓ Corrigidos erros de WebSocket que causavam falhas no servidor
- ✓ Implementado polling como alternativa estável ao WebSocket
- ✓ Melhorado tratamento de erros HTTP 403 do YouTube
- ✓ Adicionado endpoint de teste de URL para validação prévia
- ✓ Corrigidos problemas de tipos TypeScript no sistema de storage