import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedLeadSources() {
  console.log('🌱 Seeding lead sources...')

  const defaultSources = [
    {
      name: 'Instagram',
      description: 'Leads from Instagram social media platform'
    },
    {
      name: 'LinkedIn',
      description: 'Professional networking platform leads'
    },
    {
      name: 'Facebook',
      description: 'Leads from Facebook social media platform'
    },
    {
      name: 'Website',
      description: 'Direct website inquiries and contact forms'
    },
    {
      name: 'Google Ads',
      description: 'Paid search advertising campaigns'
    },
    {
      name: 'Referral',
      description: 'Word-of-mouth referrals from existing customers'
    },
    {
      name: 'Cold Outreach',
      description: 'Proactive outbound sales efforts'
    },
    {
      name: 'Trade Show',
      description: 'Leads from industry events and exhibitions'
    },
    {
      name: 'Email Marketing',
      description: 'Newsletter and email campaign responses'
    },
    {
      name: 'Other',
      description: 'Other lead sources not listed above'
    }
  ]

  for (const source of defaultSources) {
    try {
      await prisma.leadSource.upsert({
        where: { name: source.name },
        update: {},
        create: source
      })
      console.log(`✅ Created/updated lead source: ${source.name}`)
    } catch (error) {
      console.error(`❌ Error creating lead source ${source.name}:`, error)
    }
  }

  console.log('🎉 Lead sources seeding completed!')
}

seedLeadSources()
  .catch((e) => {
    console.error('❌ Error seeding lead sources:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
