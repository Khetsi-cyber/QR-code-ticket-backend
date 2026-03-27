// EMAIL SERVICE FOR ENQUIRY NOTIFICATIONS
// This service polls the email_queue table and sends emails
// Can be run as a background service, cron job, or Supabase Edge Function

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// Configuration - Add these to your .env file
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-role-key'
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'console' // 'console', 'resend', 'sendgrid'

// Email service API keys
const RESEND_API_KEY = process.env.RESEND_API_KEY
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@eswatinitransport.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Send email using Resend (recommended - https://resend.com)
async function sendWithResend(to, subject, body) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      text: body,
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend error: ${error}`)
  }
  
  return await response.json()
}

// Send email using SendGrid
async function sendWithSendGrid(to, subject, body) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }],
      }],
      from: { email: FROM_EMAIL },
      subject: subject,
      content: [{
        type: 'text/plain',
        value: body,
      }],
    }),
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SendGrid error: ${error}`)
  }
  
  return { success: true }
}

// Console logger (for testing)
function sendToConsole(to, subject, body) {
  console.log('\n========== EMAIL ==========')
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('Body:')
  console.log(body)
  console.log('===========================\n')
  return Promise.resolve({ success: true })
}

// Main email sending function
async function sendEmail(to, subject, body) {
  switch (EMAIL_SERVICE) {
    case 'resend':
      if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')
      return await sendWithResend(to, subject, body)
    
    case 'sendgrid':
      if (!SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY not configured')
      return await sendWithSendGrid(to, subject, body)
    
    case 'console':
    default:
      return sendToConsole(to, subject, body)
  }
}

// Process email queue
async function processEmailQueue() {
  try {
    console.log('Checking for pending emails...')
    
    // Get pending emails
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3) // Max 3 attempts
      .order('created_at', { ascending: true })
      .limit(10) // Process 10 at a time
    
    if (error) throw error
    
    if (!emails || emails.length === 0) {
      console.log('No pending emails')
      return
    }
    
    console.log(`Processing ${emails.length} emails...`)
    
    // Send each email
    for (const email of emails) {
      try {
        console.log(`Sending email to ${email.to_email}...`)
        
        await sendEmail(email.to_email, email.subject, email.body)
        
        // Mark as sent
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            attempts: email.attempts + 1
          })
          .eq('id', email.id)
        
        console.log(`✓ Email sent to ${email.to_email}`)
        
      } catch (err) {
        console.error(`✗ Failed to send email to ${email.to_email}:`, err.message)
        
        // Update with error
        await supabase
          .from('email_queue')
          .update({
            status: email.attempts >= 2 ? 'failed' : 'pending',
            error_message: err.message,
            attempts: email.attempts + 1
          })
          .eq('id', email.id)
      }
    }
    
    console.log('Email processing complete')
    
  } catch (err) {
    console.error('Error processing email queue:', err)
  }
}

// Run as a service (poll every 30 seconds)
async function runService() {
  console.log('Email service started')
  console.log('Email provider:', EMAIL_SERVICE)
  console.log('From email:', FROM_EMAIL)
  console.log('Polling every 30 seconds...\n')
  
  while (true) {
    await processEmailQueue()
    await new Promise(resolve => setTimeout(resolve, 30000)) // Wait 30 seconds
  }
}

// Run once (useful for cron jobs)
async function runOnce() {
  await processEmailQueue()
  process.exit(0)
}

// Export for use as module or Edge Function
export { processEmailQueue, sendEmail }

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] || 'service'
  
  if (mode === 'once') {
    runOnce()
  } else {
    runService()
  }
}
