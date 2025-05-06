# Architecture Overview

## 1. Overview

ReadyBag is a full-stack web application designed to help travelers plan their shopping in different countries. The application recommends popular products in specific countries and allows users to categorize these items in a Tinder-like swipe interface. Users can save items to various lists and share these lists with others.

The application has a mobile-first design with a focus on user experience, offering features like product discovery, currency conversion, and social sharing.

## 2. System Architecture

ReadyBag follows a modern client-server architecture with clearly separated concerns:

- **Frontend**: A React-based SPA (Single Page Application) built with Vite
- **Backend**: An Express.js server with API endpoints
- **Database**: PostgreSQL with Drizzle ORM for database operations
- **Hosting**: Deployment setup compatible with Replit

### Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, ShadcnUI, Wouter (routing)
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Build tools**: Vite (frontend), esbuild (backend)

## 3. Key Components

### 3.1 Frontend

#### Core Structure
- Built with React 18+ and TypeScript
- Uses Vite as the build tool and development server
- Organized as a Single Page Application with client-side routing via Wouter
- Mobile-first responsive design using TailwindCSS

#### Key UI Components
- **ProductCardStack**: Tinder-style swipeable cards for product discovery
- **Lists**: Categorized view of saved items (interested, maybe, not interested)
- **ShareModal**: Interface for sharing product lists via URLs or social media
- **CountrySelector**: UI for selecting the country to browse products from

#### State Management
- React Context API for global state (AppContext)
- TanStack Query (React Query) for server state management and data fetching

### 3.2 Backend

#### API Server
- Express.js server with TypeScript
- Serves both the API endpoints and the static frontend files in production
- Separated into routes and services

#### Key Services
- **Storage Service**: Interface with the database via Drizzle ORM
- **Currency Service**: Handles currency conversion between countries
- **Instagram Service**: Generates relevant hashtags for products

#### API Endpoints
- `/api/countries`: Get all available countries
- `/api/products`: Get products filtered by country
- `/api/user-products`: Get user's categorized products
- `/api/shared-list`: Handle shared list operations
- `/api/currency`: Currency conversion

### 3.3 Database

#### Schema Design
- Uses Drizzle ORM with PostgreSQL (via Neon's serverless Postgres)
- Key tables:
  - `countries`: Stores country information (name, currency, flag)
  - `products`: Stores product details (name, price, description, country)
  - `user_products`: Tracks user's interest in products (interested, not interested, maybe)
  - `shared_lists`: Stores shared product lists with access tokens

#### Relationships
- Products belong to Countries (many-to-one)
- User Products relate to Products (many-to-one)
- User Products can be associated with authenticated users or anonymous sessions

### 3.4 Authentication

- Simple session-based authentication
- Support for both authenticated users and anonymous sessions
- Session persistence using PostgreSQL via connect-pg-simple

## 4. Data Flow

### 4.1 Product Discovery Flow
1. User selects a country
2. Frontend fetches products from that country via API
3. Products are displayed in a swipeable card stack
4. User swipes (interested, not interested, maybe)
5. Selections are saved to the database (either with user ID or session ID)

### 4.2 List Management Flow
1. User navigates to Lists view
2. Frontend fetches categorized products (interested, not interested, maybe)
3. User can view, filter, and manage their selections
4. Changes are synced back to the server

### 4.3 Sharing Flow
1. User initiates sharing from Lists view
2. Backend generates a unique share token and URL
3. Share URL is displayed to the user for copying or direct sharing
4. Recipients can view the shared list via a public page without authentication

## 5. External Dependencies

### 5.1 UI Components
- ShadcnUI: Collection of accessible UI components
- Radix UI: Low-level UI primitives
- Lucide Icons: Icon set
- React Hook Form: Form handling

### 5.2 Database
- Neon Database: Serverless PostgreSQL
- Drizzle ORM: Type-safe ORM for database operations
- Drizzle Kit: Migration and schema management

### 5.3 API & Data Fetching
- TanStack Query: Data fetching and caching
- Zod: Schema validation

## 6. Deployment Strategy

The application is configured for deployment on Replit with:

- A build process that compiles both frontend and backend
- Environment variable management for database connections
- Optimized bundling for production

### Build Process
1. Frontend is built with Vite (output to dist/public)
2. Backend is bundled with esbuild (output to dist/index.js)
3. Production server serves static assets and API from the same origin

### Development Workflow
- `npm run dev`: Starts the development server
- `npm run build`: Builds the application for production
- `npm run start`: Starts the production server
- `npm run db:push`: Updates the database schema
- `npm run db:seed`: Seeds the database with initial data

## 7. Future Considerations

- Enhanced authentication with social login
- Real-time features using WebSockets
- Offline capabilities with service workers
- Native mobile app using React Native with shared business logic