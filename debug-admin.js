const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function debugAdmin() {
  try {
    console.log('🔍 Checking admin user...')
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@company.com' }
    })
    
    if (!admin) {
      console.log('❌ Admin user not found!')
      return
    }
    
    console.log('👤 Admin user found:')
    console.log('  Email:', admin.email)
    console.log('  Name:', admin.name)
    console.log('  Role:', admin.role)
    console.log('  Active:', admin.isActive)
    console.log('  Has password:', !!admin.password)
    
    // Test password
    const testPassword = 'admin123'
    const isValid = await bcrypt.compare(testPassword, admin.password || '')
    console.log('🔑 Password "admin123" is valid:', isValid)
    
    // Also test creating a new hash to compare
    const newHash = await bcrypt.hash(testPassword, 12)
    const newHashValid = await bcrypt.compare(testPassword, newHash)
    console.log('🔑 New hash test:', newHashValid)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAdmin()
