# Overview

ДУЧАРХА is a mobile-first grocery delivery application that provides express delivery of products within 10-15 minutes. The app features a modern React-based frontend with a Node.js Express backend, designed as a Progressive Web App (PWA) with offline capabilities. The system includes product catalog management, shopping cart functionality, user management, order processing, real-time notifications, and a dynamic banner/promotional content system.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript and follows a component-based architecture. The application uses:
- **Vite** for build tooling and development server
- **Wouter** for client-side routing instead of React Router
- **TanStack React Query** for server state management and API caching
- **Tailwind CSS** with shadcn/ui components for styling
- **PWA capabilities** including service worker, manifest, and offline support
- **Mobile-first responsive design** optimized for mobile devices

The frontend follows a modular structure with:
- Pages for main application routes (home, catalog, cart, profile)
- Reusable UI components built on Radix UI primitives
- Custom hooks for business logic (cart management, geolocation)
- Shared utilities and styling

## Backend Architecture
The backend uses Express.js with TypeScript and implements:
- **RESTful API design** with structured routes for categories, products, cart, and orders
- **In-memory storage** implementation as the primary data layer (MemStorage class)
- **Interface-based storage abstraction** (IStorage) allowing for easy database integration
- **Middleware-based request/response logging** for API monitoring
- **Error handling** with structured error responses

The server architecture separates concerns between:
- Route handlers for API endpoints
- Storage layer abstraction for data operations
- Vite integration for development mode

## Data Storage Solutions
The application uses a dual approach for data management:
- **Drizzle ORM** configured for PostgreSQL with schema definitions in TypeScript
- **In-memory storage** for current implementation with pre-seeded data
- **Database schema** includes users, categories, products, cart items, orders, notifications, and banners
- **Zod validation** schemas derived from Drizzle schema for type safety

## Banner/Promotional System (Added August 2025)
The application features a comprehensive banner management system:
- **Dynamic banner slider** replacing static hero section on homepage
- **Admin panel** for creating, editing, and managing banners without code changes
- **Multiple banner types**: promotional, announcements, partnerships, and information
- **Customizable styling**: background colors, text colors, custom buttons and links
- **Priority-based ordering** and active/inactive status management
- **Automatic banner rotation** every 5 seconds with manual navigation controls
- **Consistent dimensions** to prevent layout shifts during banner transitions
- **Always visible** banners (no dismiss functionality per user requirements)

## Notification System (Updated August 2025)
- **Real-time notification counter** in header with automatic updates
- **Smart notification handling**: counter resets when notifications are viewed
- **Multiple notification types**: info, success, warning, error, order updates
- **Admin interface** for sending test notifications and managing content

This design allows for easy migration from in-memory storage to PostgreSQL without changing business logic.

## Dynamic User Onboarding System (Added August 2025)
The application features a comprehensive onboarding experience for new users:
- **Multi-step welcome modal** with app introduction, features overview, and benefits
- **Progressive disclosure** showing delivery options, shopping flow, and special offers
- **Smart detection** of new vs. returning users with localStorage-based completion tracking
- **Contextual tooltips** for key features (search, categories, profile actions)
- **Replay functionality** allowing users to re-watch the onboarding from their profile
- **Auto-triggers** for new users with configurable delays and manual skip options
- **Location permission integration** requesting geolocation access during onboarding
- **Welcome back messages** for returning users with option to replay the guide
- **Feature highlighting** with intelligent tooltip positioning and dismissal tracking

## Progressive Web App Features
The application implements comprehensive PWA capabilities:
- **Service Worker** for caching and offline functionality
- **Web App Manifest** with proper icons and metadata
- **Install prompt** component for encouraging app installation
- **Offline-first approach** with cached resources and API responses

## State Management
Client-side state is managed through:
- **React Query** for server state with minimal caching (updates only on page load/refresh)
- **Local component state** for UI interactions
- **Custom hooks** for shared business logic (cart, geolocation)
- **Context providers** for global UI state (toasts, tooltips, onboarding)
- **No automatic refresh timers** - data updates only when user loads/refreshes pages

# External Dependencies

## Database
- **Neon Database** (@neondatabase/serverless) for PostgreSQL hosting
- **Drizzle ORM** for database operations and migrations
- **PostgreSQL** as the target database engine

## UI Framework
- **Radix UI** component primitives for accessible, unstyled components
- **Tailwind CSS** for utility-first styling
- **Lucide React** for consistent iconography
- **shadcn/ui** component system built on Radix UI

## Development Tools
- **Vite** for build tooling and development server
- **TypeScript** for type safety across the application
- **ESBuild** for production server bundling
- **PostCSS** with Autoprefixer for CSS processing

## Runtime Dependencies
- **Express.js** for the web server framework
- **React Query** for API state management
- **Wouter** for lightweight client-side routing
- **date-fns** for date manipulation utilities
- **Zod** for runtime type validation

## External Services
The application is designed to integrate with:
- **PostgreSQL database** via Neon Database service
- **Geolocation API** for delivery address detection
- **Push notifications** infrastructure for order updates
- **Image hosting** services for product and category images (currently using Unsplash URLs)

The architecture supports easy integration of additional external services like payment processing, SMS notifications, and analytics platforms through the modular design approach.