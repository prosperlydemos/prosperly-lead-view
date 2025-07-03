
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const calendlyToken = Deno.env.get('CALENDLY_PERSONAL_TOKEN')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Try to get payload, but don't fail if it's not JSON (for manual sync)
    let payload = null
    try {
      const text = await req.text()
      if (text) {
        payload = JSON.parse(text)
        console.log('Calendly webhook payload:', JSON.stringify(payload, null, 2))
      } else {
        console.log('Manual sync triggered - no payload')
      }
    } catch (e) {
      console.log('No JSON payload found - treating as manual sync')
    }

    let newLeads = []

    // Handle invitee.created event (when someone books a demo)
    if (payload && payload.event === 'invitee.created') {
      const leadData = await processCalendlyInvitee(payload.payload, supabase)
      if (leadData) {
        newLeads.push(leadData)
      }
    } else {
      // Manual sync - fetch recent scheduled events from Calendly API
      console.log('Starting manual sync - fetching from Calendly API')
      
      if (!calendlyToken) {
        throw new Error('CALENDLY_PERSONAL_TOKEN not configured')
      }

      // Get current user info to get the organization URI
      const userResponse = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${calendlyToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!userResponse.ok) {
        throw new Error(`Failed to get user info: ${userResponse.status}`)
      }

      const userData = await userResponse.json()
      const organizationUri = userData.resource.current_organization
      console.log('Organization URI:', organizationUri)
      
      // Fetch scheduled events from today forward for 21 days
      const startTime = new Date()
      startTime.setHours(0, 0, 0, 0) // Set to beginning of today
      const endTime = new Date()
      endTime.setDate(endTime.getDate() + 21)

      console.log(`Fetching events from ${startTime.toISOString()} to ${endTime.toISOString()}`)

      const eventsResponse = await fetch(`https://api.calendly.com/scheduled_events?organization=${encodeURIComponent(organizationUri)}&min_start_time=${startTime.toISOString()}&max_start_time=${endTime.toISOString()}&status=active`, {
        headers: {
          'Authorization': `Bearer ${calendlyToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text()
        console.error('Events API response:', errorText)
        throw new Error(`Failed to fetch events: ${eventsResponse.status} - ${errorText}`)
      }

      const eventsData = await eventsResponse.json()
      console.log(`Found ${eventsData.collection.length} scheduled events`)
      console.log('Sample event data:', JSON.stringify(eventsData.collection[0], null, 2))

      // Process each event
      for (const event of eventsData.collection) {
        try {
          console.log(`Processing event: ${event.uri}, start_time: ${event.start_time}`)
          
          // Fetch invitee information for each event
          const inviteeResponse = await fetch(`${event.uri}/invitees`, {
            headers: {
              'Authorization': `Bearer ${calendlyToken}`,
              'Content-Type': 'application/json'
            }
          })

          if (inviteeResponse.ok) {
            const inviteeData = await inviteeResponse.json()
            console.log(`Found ${inviteeData.collection.length} invitees for event`)
            
            // Process each invitee
            for (const invitee of inviteeData.collection) {
              console.log('Processing invitee:', JSON.stringify({
                name: invitee.name,
                email: invitee.email,
                event_start_time: event.start_time
              }, null, 2))
              
              const leadData = await processCalendlyInvitee({
                event: event,
                ...invitee
              }, supabase)
              
              if (leadData) {
                newLeads.push(leadData)
              }
            }
          } else {
            console.error(`Failed to fetch invitees for event ${event.uri}: ${inviteeResponse.status}`)
          }
        } catch (eventError) {
          console.error('Error processing event:', event.uri, eventError)
          // Continue with other events
        }
      }
    }

    // Update last sync time
    try {
      await supabase
        .from('app_settings')
        .upsert({
          key: 'calendly_last_sync',
          value: new Date().toISOString()
        })
    } catch (settingsError) {
      console.error('Error updating last sync time:', settingsError)
      // Don't fail the whole operation for this
    }

    console.log(`Sync completed - processed ${newLeads.length} new leads`)
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Sync completed - processed ${newLeads.length} new leads`,
      newLeads: newLeads
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing Calendly sync:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function processCalendlyInvitee(invitee: any, supabase: any) {
  console.log('processCalendlyInvitee called with:', JSON.stringify({
    email: invitee.email,
    name: invitee.name,
    start_time: invitee.start_time,
    event_start_time: invitee.event?.start_time
  }, null, 2))

  // Extract lead information
  const email = invitee.email
  const name = invitee.name
  const scheduledTime = invitee.start_time || invitee.event?.start_time
  
  if (!email || !name || !scheduledTime) {
    console.log('Missing required data for lead:', { email, name, scheduledTime })
    return null
  }
  
  // Check if demo date is today or in the future (not in the past)
  const demoDate = new Date(scheduledTime)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Set to beginning of today
  
  console.log(`Demo date: ${demoDate.toISOString()}, Today: ${today.toISOString()}`)
  
  if (demoDate < today) {
    console.log('Demo date is in the past, skipping lead processing:', scheduledTime)
    return null
  }
  
  // Get additional details from questions if available
  let businessName = ''
  if (invitee.questions_and_answers) {
    const businessQuestion = invitee.questions_and_answers.find(
      (qa: any) => qa.question.toLowerCase().includes('business') || qa.question.toLowerCase().includes('company')
    )
    if (businessQuestion) {
      businessName = businessQuestion.answer
    }
  }

  // Get default admin user ID for lead assignment
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .single()

  if (!adminUser) {
    throw new Error('No admin user found to assign lead to')
  }

  // Check if lead already exists
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('email', email)
    .single()

  if (!existingLead) {
    console.log('Creating new lead for:', email)
    
    // Create new lead with blank lead source
    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        contact_name: name,
        email: email,
        business_name: businessName || null,
        lead_source: '', // Leave blank by default instead of 'Calendly'
        status: 'Demo Scheduled',
        demo_date: scheduledTime,
        owner_id: adminUser.id,
        value: 0,
        setup_fee: 0,
        mrr: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating lead:', insertError)
      throw insertError
    }

    console.log('Created new lead:', newLead)
    return newLead
  } else {
    // Lead already exists - don't update it, just log and return
    console.log('Lead already exists, skipping update:', existingLead.id)
    return null
  }
}
