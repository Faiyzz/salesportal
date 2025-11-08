const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@company.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  // 1. does admin already exist?
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingAdmin) {
    // 2. hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. create admin
    const admin = await prisma.user.create({
      data: {
        email,
        name: process.env.ADMIN_NAME || "Admin User",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log("✅ Admin created:", admin.email);
  } else {
    console.log("✅ Admin already exists:", existingAdmin.email);
  }

  // 4. Create default lead statuses
  const defaultStatuses = [
    { id: 'cldefault1', name: 'New', color: '#3B82F6', description: 'Newly created lead', sortOrder: 1 },
    { id: 'cldefault2', name: 'No Show', color: '#EF4444', description: 'Did not attend scheduled meeting', sortOrder: 2 },
    { id: 'cldefault3', name: 'Follow Up', color: '#F59E0B', description: 'Requires follow up action', sortOrder: 3 },
    { id: 'cldefault4', name: 'Closed Won', color: '#10B981', description: 'Successfully closed deal', sortOrder: 4 },
    { id: 'cldefault5', name: 'Closed Lost', color: '#6B7280', description: 'Deal was lost', sortOrder: 5 },
    { id: 'cldefault6', name: 'Rescheduled', color: '#8B5CF6', description: 'Meeting was rescheduled', sortOrder: 6 },
    { id: 'cldefault7', name: 'Ghosted', color: '#374151', description: 'No response from lead', sortOrder: 7 },
    { id: 'cldefault8', name: 'Contacted', color: '#06B6D4', description: 'Lead has been contacted', sortOrder: 8 },
    { id: 'cldefault9', name: 'Qualified', color: '#84CC16', description: 'Lead is qualified', sortOrder: 9 },
    { id: 'cldefault10', name: 'Proposal Sent', color: '#F97316', description: 'Proposal has been sent', sortOrder: 10 },
    { id: 'cldefault11', name: 'Negotiation', color: '#EC4899', description: 'In negotiation phase', sortOrder: 11 }
  ];

  for (const status of defaultStatuses) {
    await prisma.leadStatus.upsert({
      where: { id: status.id },
      update: {},
      create: status
    });
  }

  console.log("✅ Default lead statuses created");

  // 5. Create default lead columns
  const defaultColumns = [
    { id: 'clcol1', name: 'Instagram Username', key: 'instagram_username', type: 'TEXT', description: 'Lead Instagram handle', sortOrder: 1 },
    { id: 'clcol2', name: 'Appointment Setter', key: 'appointment_setter', type: 'TEXT', description: 'Person who set the appointment', sortOrder: 2 },
    { id: 'clcol3', name: 'Closer', key: 'closer', type: 'TEXT', description: 'Sales person handling the close', sortOrder: 3 },
    { id: 'clcol4', name: 'Package', key: 'package', type: 'SELECT', description: 'Service package interested in', sortOrder: 4, options: ["Basic Package", "Premium Package", "Enterprise Package", "Custom Package"] },
    { id: 'clcol5', name: 'Booking Date', key: 'booking_date', type: 'DATE', description: 'Date when meeting was booked', sortOrder: 5 },
    { id: 'clcol6', name: 'Closing Date', key: 'closing_date', type: 'DATE', description: 'Expected or actual closing date', sortOrder: 6 },
    { id: 'clcol7', name: 'Payment Screenshot', key: 'payment_screenshot', type: 'FILE', description: 'Screenshot of payment confirmation', sortOrder: 7 },
    { id: 'clcol8', name: 'Budget Range', key: 'budget_range', type: 'SELECT', description: 'Client budget range', sortOrder: 8, options: ["$1k - $5k", "$5k - $10k", "$10k - $25k", "$25k - $50k", "$50k+"] }
  ];

  for (const column of defaultColumns) {
    await prisma.leadColumn.upsert({
      where: { key: column.key },
      update: {},
      create: {
        ...column,
        type: column.type,
        ...(column.options && { options: column.options })
      }
    });
  }

  console.log("✅ Default lead columns created");

  // 6. Create default lead sources
  const defaultSources = [
    { name: 'Instagram', description: 'Leads from Instagram' },
    { name: 'LinkedIn', description: 'Leads from LinkedIn' },
    { name: 'Website', description: 'Leads from website' },
    { name: 'Referral', description: 'Referral leads' },
    { name: 'Calendly', description: 'Direct Calendly bookings' }
  ];

  for (const source of defaultSources) {
    await prisma.leadSource.upsert({
      where: { name: source.name },
      update: {},
      create: source
    });
  }

  console.log("✅ Default lead sources created");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
