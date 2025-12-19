# Car Rental Management System (DriveEase)

## Overview
A comprehensive car rental management system MVP designed for a single business owner who acts as both Admin and Customer. Features a "Simulation Mode" architecture with a global role toggle switch.

## Project Architecture
- **Simulation Mode**: No login screen - users switch between Admin and Customer views via a toggle in the navbar
- **Default State**: Admin view on initial load
- **Mobile-First**: Responsive design with thumb-friendly touch targets (min 48px)

## Tech Stack
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS
- **Backend**: Express.js with in-memory storage (MemStorage)
- **UI Components**: shadcn/ui (Radix primitives)
- **Icons**: Lucide React
- **State**: TanStack Query + React Context
- **Routing**: Wouter

## Key Features

### Customer View
- Landing page with hero and dual-tab card (Check Availability / Browse Cars)
- Fleet catalog with responsive grid layout
- Booking flow with guest information and optional ID verification

### Admin View
- Dashboard with stats (Total Cars, Rented Today, Revenue Today)
- Interactive Gantt chart timeline showing bookings
- Booking management (Approve/Complete/Cancel)

## Data Models

### Vehicle
- id, model, plate, dailyRate, transmission, colorHex, status, imageUrl

### Booking
- id, vehicleId, guestName, guestPhone, startDate, endDate, totalPrice, status, idVerified

## Project Structure
```
client/
  src/
    components/     # Reusable UI components
    context/        # Role and Theme providers
    pages/          # Page components (Home, Fleet, Dashboard)
    lib/            # Utilities and query client
server/
  routes.ts         # API endpoints
  storage.ts        # In-memory data storage
shared/
  schema.ts         # TypeScript types and Zod schemas
```

## API Endpoints
- GET /api/vehicles - List all vehicles
- GET /api/vehicles/:id - Get single vehicle
- POST /api/vehicles - Create vehicle
- PATCH /api/vehicles/:id - Update vehicle
- GET /api/bookings - List all bookings
- GET /api/bookings/:id - Get single booking
- POST /api/bookings - Create booking
- PATCH /api/bookings/:id - Update booking status
- GET /api/stats - Get dashboard statistics

## Running the App
The app starts automatically with `npm run dev` which runs both the Express backend and Vite frontend on port 5000.

## User Preferences
- Mobile-first design approach
- Beautiful UI/UX with smooth transitions
- Dark/light theme support via toggle
