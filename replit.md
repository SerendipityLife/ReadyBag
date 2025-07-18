# Serendipity - Travel Shopping Recommendation Platform

## Overview

Serendipity is a full-stack web application designed to help travelers discover and plan their shopping for popular products in different countries. The platform features a Tinder-style card interface for product discovery, allowing users to swipe through products and build curated shopping lists for their travels.

**Current Status**: Fully functional travel date-based product management system with complete segregation between different travel periods.

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

**Frontend**: React-based SPA with TypeScript, built using Vite
**Backend**: Express.js server with TypeScript
**Database**: PostgreSQL with Drizzle ORM
**Deployment**: Configured for Replit with automatic scaling

### Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, ShadcnUI, Wouter (routing)
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Build Tools**: Vite (frontend), esbuild (backend)
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Context API + TanStack Query

## Key Components

### Frontend Architecture

**Core Structure**:
- Single Page Application with client-side routing via Wouter
- Mobile-first responsive design using TailwindCSS
- Component-based architecture with reusable UI components

**Key Features**:
- **ProductCardStack**: Tinder-style swipeable cards for product discovery
- **Lists**: Categorized view of saved items (interested, maybe, not interested)
- **ShareModal**: Social sharing functionality for product lists
- **CountrySelector**: Interface for selecting countries to browse products
- **FilterSystem**: Two-tier category filtering (store types + purpose categories)

**State Management**:
- AppContext for global application state
- AuthContext for user authentication state
- TanStack Query for server state management and caching

### Backend Architecture

**API Server**:
- RESTful API built with Express.js
- Session-based authentication with Passport.js
- Request/response logging and error handling
- Memory caching for frequently accessed data

**Key Services**:
- **Currency Service**: Real-time exchange rate fetching and caching
- **Storage Service**: Database abstraction layer for all data operations
- **Authentication Service**: User registration, login, and session management

## Data Flow

### Product Discovery Flow
1. User selects country and applies filters
2. Frontend queries backend API with filter parameters
3. Backend fetches products from database with applied filters
4. Products are cached in memory for subsequent requests
5. Frontend displays products in card stack interface
6. User interactions (swipe/click) update local state and sync with backend

### Data Persistence
- **Authenticated Users**: Data stored in PostgreSQL database
- **Guest Users**: Data stored in browser localStorage with session management
- **Shared Lists**: Generated with unique IDs for social sharing

## External Dependencies

### Required Services
- **PostgreSQL Database**: Primary data storage (via DATABASE_URL environment variable)
- **Currency Exchange API**: Real-time exchange rates (ExchangeRate-API)

### Optional Integrations
- **Google Maps API**: Location-based features (requires VITE_GOOGLE_MAPS_API_KEY)
- **Social Media**: Sharing functionality for Facebook, Twitter, KakaoTalk

### Python Dependencies
- **Data Processing**: pandas, openpyxl for Excel data import
- **Database**: psycopg2-binary for direct PostgreSQL operations

## Deployment Strategy

**Development Environment**:
- Runs on port 5000 with hot reload
- Vite dev server for frontend with HMR
- PostgreSQL database provisioned automatically

**Production Build**:
- Frontend built with Vite to static assets
- Backend bundled with esbuild
- Serves static files from Express server
- Auto-scaling deployment on Replit

**Database Management**:
- Drizzle ORM for schema management and migrations
- Seed script for initial data population
- Database schema versioning and migration tracking

## Recent Changes

**June 25, 2025** - UI/UX Updates & Product Database Restructure
- ✅ Removed country selection functionality and replaced with ReadyBag logo
- ✅ Updated filter system to show Korean category names with English backend filtering
- ✅ Removed expand/collapse functionality from filters to show all options at once
- ✅ Created gradient logo design for ReadyBag branding

**June 25, 2025** - Complete Product Database Restructure
- ✅ Updated products schema to support comprehensive product information
- ✅ Added new columns: name_english, brand, tags, info for enhanced product data
- ✅ Imported 614 products from Excel with full product details
- ✅ Enhanced product structure with Korean, Japanese, and English names
- ✅ Added brand information and detailed product descriptions
- ✅ Updated sales channel mapping (donki → donkihote, conve → convenience)
- ✅ Reorganized product categories for better filtering and discovery

**June 18, 2025** - Travel Date-Based Product Management System
- ✅ Complete product segregation by travel date for both members and non-members
- ✅ Fixed batch delete functionality with proper UI refresh mechanisms  
- ✅ Implemented server-side batch delete endpoint with correct route ordering
- ✅ Enhanced cache invalidation to ensure deleted products reappear in browse tab
- ✅ Added forceRefresh mechanism to resolve persistent UI caching issues
- ✅ Verified travel date filtering works identically for logged-in users and guests
- ✅ Removed swipe functionality from product photos in browse tab - users can only interact via action buttons
- ✅ Fixed layout overlap between product cards and action buttons
- ✅ Removed hashtags from product cards for cleaner design

**June 19, 2025** - Enhanced Travel Date Selection UX
- ✅ Implemented automatic travel date selector opening when saving products without date
- ✅ Added showTravelDateSelector state to AppContext for UI coordination
- ✅ Enhanced product saving logic to check for travel date before saving
- ✅ Removed success toast messages for cleaner user experience
- ✅ Maintained travel date selection prompt with clear user guidance
- ✅ Fixed progress indicator resetting issue when switching between tabs
- ✅ Modified product saving to prevent storage without travel date selection

**June 22, 2025** - Accommodation Address Integration & UI Optimization
- ✅ Added accommodation address storage feature to shopping records
- ✅ Moved accommodation search from cart tab to browse tab alongside travel date selector
- ✅ Created compact accommodation search component for better UX
- ✅ Modified cart tab to only show nearby facility search based on saved accommodation
- ✅ Implemented accommodation address saving when marking items as "구입완료"
- ✅ Enhanced shopping history to display accommodation information
- ✅ Optimized browse tab layout to prioritize product interaction
- ✅ Restructured travel date selector to prevent layout breaking
- ✅ Moved "새 날짜 추가" button inside dropdown for cleaner interface
- ✅ Created modal-based accommodation search to prevent layout disruption
- ✅ Updated README.md with comprehensive current feature documentation

**June 22, 2025** - Comprehensive Product Review System Implementation
- ✅ Added product_reviews database table with user/session-based reviews
- ✅ Implemented complete review API endpoints (GET, POST, PUT, DELETE)
- ✅ Created ProductReviews component with 5-star rating system
- ✅ Added review functionality to shopping history (purchased items)
- ✅ Integrated review display in browse tab product cards
- ✅ Implemented review persistence independent of shopping folder deletion
- ✅ Added review editing and deletion for review authors
- ✅ Support for both authenticated users and guest sessions
- ✅ Anonymous review option with custom reviewer names

**June 30, 2025** - Country Selection UI Enhancement & Color Theme Unification
- ✅ Restored country selector functionality to browse tab
- ✅ Enhanced CountrySelector component with improved visual design
- ✅ Improved button styling with blue theme consistency (bg-blue-50, text-blue-900)
- ✅ Added future expansion message "더 많은 국가가 곧 추가될 예정입니다"
- ✅ Positioned country selector at top of browse tab above travel date selector
- ✅ Enhanced accessibility with larger buttons and improved contrast
- ✅ Unified all browse tab colors to blue theme:
  - ActionButtons: Changed brown/orange tones to blue variants (blue-400 to blue-600)
  - Progress indicator: Changed gray tones to blue variants
  - Filter system: Changed green category badges to blue theme
  - Component borders: Updated from brown to blue-200 variants
- ✅ Removed remaining brown/amber color inconsistencies throughout browse tab

**Technical Implementation**:
- Server: Added `/api/user-products/batch` endpoint with individual delete operations
- Frontend: Enhanced cache invalidation using `forceRefresh` state variable in query keys
- Database: Proper travel date ID filtering in `getUserProducts` function
- UI: Real-time refresh of ProductCardStack excluded products list after deletions

## Changelog

- June 16, 2025. Initial setup
- June 18, 2025. Travel date-based product management system completed

## User Preferences

Preferred communication style: Simple, everyday language.