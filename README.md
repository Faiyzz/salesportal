# Sales Portal - Professional CRM & Meeting Management

A comprehensive sales portal built with Next.js, TypeScript, Prisma, and PostgreSQL, featuring Calendly integration for automated meeting management and lead tracking.

## 🚀 Features

### Admin Portal
- **Dashboard**: Analytics, stats, and performance metrics
- **Meeting Management**: View all meetings across sales team with Calendly sync
- **Sales Team Management**: Add/manage sales people with Calendly integration
- **Lead Overview**: Complete view of all leads with status tracking
- **Role-based Access Control**: Secure admin-only features

### Sales Person Portal
- **Personal Dashboard**: Individual performance metrics and recent activity
- **Meeting Management**: View and sync personal Calendly meetings
- **Lead Management**: Track and update lead status with detailed forms
- **Automated Lead Creation**: Leads auto-generated from synced meetings

### Key Features
- **Calendly Integration**: Full sync with free Calendly accounts
- **Real-time Notifications**: Toast notifications with Sonner
- **Modern UI**: Professional interface with shadcn/ui components
- **Responsive Design**: Works perfectly on desktop and mobile
- **Type Safety**: Full TypeScript implementation
- **Database**: PostgreSQL with Prisma ORM

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Integration**: Calendly API for meeting sync
- **Notifications**: Sonner for toast messages

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Calendly account(s) with Personal Access Tokens

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd salesportal
npm install --legacy-peer-deps
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/salesportal"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Admin Seed Data
ADMIN_EMAIL="admin@company.com"
ADMIN_PASSWORD="admin123"
ADMIN_NAME="Admin User"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed admin user
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign in with your admin credentials.

## 📖 Usage Guide

### Getting Calendly Personal Access Token

1. Go to [Calendly Integrations](https://calendly.com/integrations/api_webhooks)
2. Click "Generate new token"
3. Copy the token for use in the portal

### Admin Workflow

1. **Sign In**: Use seeded admin credentials
2. **Add Sales People**: 
   - Go to Sales People page
   - Click "Add Sales Person"
   - Enter details including Calendly token
3. **Sync Meetings**: Use "Sync All" to pull meetings from Calendly
4. **Monitor Performance**: View dashboard analytics and team performance

### Sales Person Workflow

1. **Sign In**: Use credentials provided by admin
2. **Sync Meetings**: Click "Sync Meetings" to pull your Calendly data
3. **Manage Leads**: 
   - View auto-generated leads from meetings
   - Update lead status, add notes, set estimated values
   - Track meeting outcomes and next steps

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed admin user
npm run db:studio    # Open Prisma Studio
```

## 📊 Database Schema

### Key Models

- **User**: Admin and sales person accounts with Calendly integration
- **Meeting**: Synced Calendly meetings with attendee details
- **Lead**: Auto-generated and manually managed leads
- **Account/Session**: NextAuth.js authentication tables

### Relationships

- Users have many Meetings and Leads
- Meetings can have one associated Lead
- Admin users can create Sales Person users

## 🔐 Security Features

- **Authentication**: Secure login with NextAuth.js
- **Role-based Access**: Admin vs Sales Person permissions
- **Data Isolation**: Sales people only see their own data
- **API Protection**: All routes protected with session validation

## 🎨 UI Components

Built with modern, accessible components:

- **Cards**: Information display and forms
- **Buttons**: Various styles and states
- **Forms**: Input validation and error handling
- **Badges**: Status indicators
- **Modals**: Overlay interactions
- **Navigation**: Responsive sidebar

## 📱 Responsive Design

- **Desktop**: Full-featured dashboard layout
- **Tablet**: Optimized grid layouts
- **Mobile**: Touch-friendly interface

## 🔄 Calendly Integration

### Supported Features (Free Calendly)

- **Event Retrieval**: Get scheduled meetings
- **Event Details**: Attendee info, timing, location
- **Event Types**: Meeting categories
- **User Information**: Calendly user details

### Sync Process

1. Sales person provides Calendly token during setup
2. System validates token and stores user URI
3. Meetings sync pulls last 30 days and next 90 days
4. Leads auto-created from new meetings
5. Regular sync keeps data updated

## 🚀 Deployment

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
```

### Build and Deploy

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is proprietary and confidential.

## 🆘 Support

For support and questions:
- Check the documentation above
- Review the code comments
- Test with sample data

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**
