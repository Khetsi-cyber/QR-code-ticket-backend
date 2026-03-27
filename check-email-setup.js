// Quick test script to verify email notification setup
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

console.log('\n========================================')
console.log('Email Notification System Check')
console.log('========================================\n')

// Check environment variables
console.log('1. Environment Configuration:')
console.log('   SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing')
console.log('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY && !SUPABASE_SERVICE_KEY.includes('YOUR_') ? '✓ Set' : '✗ Missing')
console.log('   EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'console')
console.log('')

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.includes('YOUR_')) {
  console.log('❌ Please configure .env file with your Supabase credentials')
  console.log('   See QUICK_START_EMAILS.md for instructions')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkSetup() {
  try {
    // Check if enquiries table exists
    console.log('2. Checking database tables...')
    const { data: enquiriesCheck, error: enquiriesError } = await supabase
      .from('enquiries')
      .select('id')
      .limit(1)
    
    if (enquiriesError && enquiriesError.code === '42P01') {
      console.log('   ✗ enquiries table not found')
      console.log('     Run: CREATE_ENQUIRIES_TABLE.sql')
    } else {
      console.log('   ✓ enquiries table exists')
    }

    // Check if email_queue table exists
    const { data: queueCheck, error: queueError } = await supabase
      .from('email_queue')
      .select('id')
      .limit(1)
    
    if (queueError && queueError.code === '42P01') {
      console.log('   ✗ email_queue table not found')
      console.log('     Run: CREATE_EMAIL_NOTIFICATIONS.sql')
    } else {
      console.log('   ✓ email_queue table exists')
    }

    console.log('')

    // Check email queue status
    if (!queueError) {
      console.log('3. Email Queue Status:')
      const { data: stats } = await supabase
        .from('email_queue')
        .select('status')

      if (stats) {
        const pending = stats.filter(e => e.status === 'pending').length
        const sent = stats.filter(e => e.status === 'sent').length
        const failed = stats.filter(e => e.status === 'failed').length
        
        console.log(`   Pending: ${pending}`)
        console.log(`   Sent: ${sent}`)
        console.log(`   Failed: ${failed}`)
        console.log('')
      }
    }

    // Check enquiries status
    if (!enquiriesError) {
      console.log('4. Enquiries Status:')
      const { data: enquiries } = await supabase
        .from('enquiries')
        .select('status')

      if (enquiries) {
        const pending = enquiries.filter(e => e.status === 'pending').length
        const responded = enquiries.filter(e => e.status === 'responded').length
        
        console.log(`   Pending: ${pending}`)
        console.log(`   Responded: ${responded}`)
        console.log('')
      }
    }

    console.log('========================================')
    console.log('Setup Status')
    console.log('========================================\n')

    if (queueError || enquiriesError) {
      console.log('⚠️  Database setup incomplete')
      console.log('')
      console.log('Next steps:')
      console.log('1. Go to Supabase SQL Editor')
      console.log('2. Run CREATE_ENQUIRIES_TABLE.sql (if enquiries missing)')
      console.log('3. Run CREATE_EMAIL_NOTIFICATIONS.sql (if email_queue missing)')
      console.log('')
    } else {
      console.log('✅ System ready!')
      console.log('')
      console.log('To start email service:')
      console.log('  npm start         - Run continuously')
      console.log('  npm run once      - Process queue once')
      console.log('')
      console.log('To test:')
      console.log('  1. Submit an enquiry as passenger')
      console.log('  2. Run: npm run once')
      console.log('  3. Check console for email output')
      console.log('')
    }

  } catch (err) {
    console.error('Error checking setup:', err.message)
    process.exit(1)
  }
}

checkSetup()
