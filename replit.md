# CardineBot - Italian Roleplay Discord Bot System

## Overview

CardineBot is a comprehensive Italian Discord bot system designed for roleplay servers. It's a full-stack web application that manages multiple Discord bots and provides a web dashboard for administration. The system handles user management, vehicle registration, crime tracking, tickets, and various roleplay scenarios commonly found in Italian FiveM or similar roleplay communities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Architecture
The application follows a modern full-stack architecture with a clear separation between frontend, backend, and database layers:

- **Frontend**: React-based SPA with TypeScript
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Discord Integration**: Multiple specialized Discord bots
- **Build System**: Vite for frontend bundling

### Deployment Strategy
The application is designed for Replit deployment with:
- Single-container architecture
- Environment-based configuration
- File upload support for images and documents
- Hot reload in development

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **Form Handling**: React Hook Form with Zod validation
- **Component System**: Shadcn/ui component library

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **File Uploads**: Multer middleware for handling images and documents
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with JSON responses

### Discord Bot System
The system operates multiple specialized Discord bots:
- **Bot 1 (Citizens)**: Handles general citizen commands and roleplay actions
- **Bot 2 (Police/Admin)**: Manages police operations and administrative functions
- **Shared Utilities**: Common command registration and embed creation functions

### Database Schema
Comprehensive schema supporting:
- **Users**: Discord integration with roles and criminal records
- **Vehicles**: License plate registration and seizure tracking
- **Crimes**: Criminal activity logging with categorization
- **Tickets**: Support ticket system with priority levels
- **Drug Activities**: Specialized tracking for drug-related roleplay
- **Robberies**: Robbery event management
- **Emergency Calls**: 911/emergency service integration
- **Work Shifts**: Job/duty time tracking
- **Server Settings**: Configurable system parameters

## Data Flow

### User Authentication & Management
1. Users authenticate via Discord OAuth integration
2. User data syncs between Discord and internal database
3. Role-based permissions control access to features
4. Criminal records and activity tracking

### Command Processing
1. Discord commands received by specialized bots
2. Commands validated and processed through shared utilities
3. Database operations performed via Drizzle ORM
4. Responses sent back to Discord with rich embeds

### Web Dashboard
1. React frontend communicates with Express API
2. TanStack Query manages data fetching and caching
3. Real-time updates for statistics and active events
4. File uploads handled for user photos and documents

### Ticket System
1. Users create tickets via Discord commands or web interface
2. Tickets assigned priority levels and categories
3. Staff can assign and manage tickets through dashboard
4. Status updates reflected in both Discord and web interface

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **discord.js**: Discord API integration for bot functionality
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **express**: Web server framework for API endpoints

### UI Dependencies
- **@radix-ui/***: Comprehensive accessible UI component primitives
- **@tanstack/react-query**: Server state management and data fetching
- **tailwindcss**: Utility-first CSS framework for styling
- **react-hook-form**: Form state management and validation

### File Handling
- **multer**: Multipart form data handling for file uploads
- **connect-pg-simple**: PostgreSQL session store for Express

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for development
- **drizzle-kit**: Database migration and schema management

## Deployment Strategy

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `BOT1_TOKEN/DISCORD_BOT1_TOKEN`: Citizens bot token
- `BOT2_TOKEN/DISCORD_BOT2_TOKEN`: Police/Admin bot token
- `NODE_ENV`: Environment setting (development/production)

### Build Process
1. Frontend assets compiled with Vite
2. Backend TypeScript compiled with esbuild
3. Database migrations applied via Drizzle Kit
4. Static files served from Express in production

### File Storage
- Local file storage in `uploads/` directory
- Organized by file type (mugshots, vehicles, documents)
- Image validation and size limits enforced
- Public serving via Express static middleware

### Bot Management
- Multiple bot instances managed by DiscordService
- Graceful startup/shutdown handling
- Error recovery and logging
- Command registration automated on startup

The architecture prioritizes modularity, type safety, and Italian localization while maintaining scalability for roleplay server communities.