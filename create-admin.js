const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔧 Creating/updating admin user...')
    
    // Delete existing admin if exists
    await prisma.user.deleteMany({
      where: { email: 'admin@company.com' }
    })
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    console.log('🔑 Password hashed successfully')
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@company.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      }
    })
    
    console.log('✅ Admin user created:', admin.email)
    
    // Verify password works
    const isValid = await bcrypt.compare('admin123', admin.password)
    console.log('🔑 Password verification:', isValid)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
