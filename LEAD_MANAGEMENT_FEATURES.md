# Lead Management Features

This document outlines the new manual lead creation and lead source management features added to the Sales Portal.

## 🎯 Features Overview

### 1. Dynamic Lead Sources Management
- **Admin-only feature** to manage lead sources dynamically
- Create, edit, activate/deactivate, and delete lead sources
- Common sources like Instagram, LinkedIn, Website, etc. are pre-seeded
- Lead sources are used in dropdowns when creating leads manually

### 2. Manual Lead Creation
- **Admin users** can create leads and assign them to any sales person
- **Sales people** can create their own leads
- Comprehensive form with all lead fields including source selection
- Email validation and duplicate prevention

### 3. Enhanced Lead Tracking
- Track where each lead originated from
- Filter and analyze leads by source
- Better lead attribution and ROI tracking

## 🚀 Getting Started

### Prerequisites
- Database should be running and accessible
- All dependencies should be installed

### Setup Instructions

1. **Install Dependencies** (if not already done):
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run Database Migration** (when database is available):
   ```bash
   npx prisma migrate dev --name add-lead-sources
   ```

4. **Seed Default Lead Sources**:
   ```bash
   npm run setup-lead-sources
   ```

## 📱 User Interface

### Admin Panel
- **Lead Sources Page**: `/admin/lead-sources`
  - View all lead sources with usage statistics
  - Create new lead sources
  - Edit existing sources
  - Activate/deactivate sources
  - Delete unused sources

- **Enhanced Leads Page**: `/admin/leads`
  - "Add Lead" button to create leads manually
  - Assign leads to specific sales people
  - Select lead source from dropdown

### Sales Portal
- **Enhanced My Leads Page**: `/dashboard/leads`
  - "Add Lead" button to create personal leads
  - Select lead source from dropdown
  - All standard lead fields available

## 🔧 API Endpoints

### Lead Sources Management
- `GET /api/admin/lead-sources` - Get all lead sources (admin only)
- `POST /api/admin/lead-sources` - Create new lead source (admin only)
- `PATCH /api/admin/lead-sources/[id]` - Update lead source (admin only)
- `DELETE /api/admin/lead-sources/[id]` - Delete lead source (admin only)
- `GET /api/lead-sources` - Get active lead sources (all authenticated users)

### Manual Lead Creation
- `POST /api/admin/leads` - Create lead as admin (can assign to any sales person)
- `POST /api/dashboard/leads` - Create lead as sales person (assigned to self)

## 📊 Database Schema

### LeadSource Model
```prisma
model LeadSource {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  leads       Lead[]
}
```

### Updated Lead Model
- Added `sourceId` field linking to LeadSource
- Added `source` relation to LeadSource model

## 🎨 UI Components

### New Components Created
- `AddLeadForm` - Comprehensive form for manual lead creation
- `Textarea` - Text area input component
- `Dialog` - Modal dialog component
- `AlertDialog` - Confirmation dialog component

### Enhanced Pages
- Admin Lead Sources management page
- Enhanced admin leads page with manual creation
- Enhanced sales portal leads page with manual creation

## 🔒 Security & Permissions

### Admin Users Can:
- Manage all lead sources (CRUD operations)
- Create leads and assign to any sales person
- View all leads across the system

### Sales People Can:
- View active lead sources for selection
- Create leads assigned to themselves
- View and manage only their own leads

## 🧪 Testing

### Manual Testing Checklist
1. **Admin Lead Sources Management**:
   - [ ] Create new lead source
   - [ ] Edit existing lead source
   - [ ] Activate/deactivate lead source
   - [ ] Delete unused lead source
   - [ ] Verify lead source appears in dropdowns

2. **Admin Lead Creation**:
   - [ ] Create lead with source selection
   - [ ] Assign lead to different sales person
   - [ ] Verify email validation
   - [ ] Test duplicate email prevention

3. **Sales Person Lead Creation**:
   - [ ] Create personal lead with source
   - [ ] Verify lead appears in personal leads list
   - [ ] Test all form fields and validation

## 🚨 Important Notes

### Database Migration Required
- The schema changes require a database migration
- Run `npx prisma migrate dev --name add-lead-sources` when database is available
- Existing leads will have `sourceId` as null (no source assigned)

### Default Lead Sources
- 10 common lead sources are pre-seeded
- Run `npm run setup-lead-sources` to populate default sources
- Sources include: Instagram, LinkedIn, Facebook, Website, Google Ads, Referral, Cold Outreach, Trade Show, Email Marketing, Other

### TypeScript Errors Resolution
- Prisma client generation resolves TypeScript errors
- All API endpoints are properly typed
- Form validation includes proper TypeScript interfaces

## 🔄 Future Enhancements

### Potential Improvements
1. **Lead Source Analytics**:
   - Conversion rates by source
   - ROI tracking per source
   - Source performance dashboards

2. **Advanced Lead Management**:
   - Bulk lead import with source mapping
   - Lead scoring based on source
   - Automated lead assignment rules

3. **Integration Enhancements**:
   - Webhook integration for lead sources
   - CRM system synchronization
   - Marketing automation platform integration

## 📞 Support

If you encounter any issues:
1. Ensure database is running and accessible
2. Verify all dependencies are installed
3. Check that Prisma client is generated
4. Run database migrations if needed
5. Seed default lead sources for testing

The implementation provides a solid foundation for manual lead management with dynamic source tracking, enhancing the overall lead management capabilities of the Sales Portal.
