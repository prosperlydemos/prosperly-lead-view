
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
    
    console.log('=== CALENDLY SYNC STARTED ===')
    
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
    let totalEventsFound = 0
    let dateRange = null
    let debugInfo = {}

    // Handle invitee.created event (when someone books a demo)
    if (payload && payload.event === 'invitee.created') {
      console.log('Processing webhook event: invitee.created')
      const leadData = await processCalendlyInvitee(payload.payload, supabase)
      if (leadData) {
        newLeads.push(leadData)
      }
    } else {
      // Manual sync - fetch recent scheduled events from Calendly API
      console.log('=== STARTING MANUAL SYNC ===')
      
      if (!calendlyToken) {
        throw new Error('CALENDLY_PERSONAL_TOKEN not configured')
      }

      // Get current user info to get the organization URI
      console.log('Fetching Calendly user info...')
      const userResponse = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${calendlyToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!userResponse.ok) {
        console.error('User API failed:', userResponse.status, await userResponse.text())
        throw new Error(`Failed to get user info: ${userResponse.status}`)
      }

      const userData = await userResponse.json()
      const organizationUri = userData.resource.current_organization
      console.log('Organization URI:', organizationUri)
      console.log('User resource:', JSON.stringify(userData.resource, null, 2))
      
      // Fetch scheduled events - expanded date range to catch more events
      const startTime = new Date()
      startTime.setDate(startTime.getDate() - 30) // Expand to 30 days ago
      const endTime = new Date()
      endTime.setDate(endTime.getDate() + 60) // Expand to 60 days in future

      dateRange = {
        from: startTime.toISOString(),
        to: endTime.toISOString()
      }

      console.log(`Fetching events from ${startTime.toISOString()} to ${endTime.toISOString()}`)

      // Try multiple approaches to get events
      const approaches = [
        {
          name: 'With organization and status active',
          url: `https://api.calendly.com/scheduled_events?organization=${encodeURIComponent(organizationUri)}&min_start_time=${startTime.toISOString()}&max_start_time=${endTime.toISOString()}&status=active`
        },
        {
          name: 'With organization, no status filter',
          url: `https://api.calendly.com/scheduled_events?organization=${encodeURIComponent(organizationUri)}&min_start_time=${startTime.toISOString()}&max_start_time=${endTime.toISOString()}`
        },
        {
          name: 'Without organization filter',
          url: `https://api.calendly.com/scheduled_events?min_start_time=${startTime.toISOString()}&max_start_time=${endTime.toISOString()}`
        }
      ]

      let eventsData = null
      let successfulApproach = null

      for (const approach of approaches) {
        console.log(`=== TRYING APPROACH: ${approach.name} ===`)
        console.log('URL:', approach.url)

        try {
          const eventsResponse = await fetch(approach.url, {
            headers: {
              'Authorization': `Bearer ${calendlyToken}`,
              'Content-Type': 'application/json'
            }
          })

          if (!eventsResponse.ok) {
            const errorText = await eventsResponse.text()
            console.error(`${approach.name} failed:`, eventsResponse.status, errorText)
            continue
          }

          const responseData = await eventsResponse.json()
          console.log(`${approach.name} - Found ${responseData.collection.length} events`)
          
          if (responseData.collection.length > 0) {
            eventsData = responseData
            successfulApproach = approach.name
            totalEventsFound = responseData.collection.length
            console.log('✅ SUCCESS! Using this approach')
            console.log('Sample event:', JSON.stringify(responseData.collection[0], null, 2))
            break
          }
        } catch (error) {
          console.error(`Error with ${approach.name}:`, error)
        }
      }

      debugInfo = {
        approaches: approaches.map(a => a.name),
        successfulApproach,
        totalEventsFound,
        dateRange,
        organizationUri,
        tokenLength: calendlyToken?.length || 0
      }

      if (!eventsData || totalEventsFound === 0) {
        console.log('❌ NO EVENTS FOUND WITH ANY APPROACH')
        console.log('Debug info:', JSON.stringify(debugInfo, null, 2))
        console.log('This could mean:')
        console.log('1. No events are scheduled in the expanded date range')
        console.log('2. The Calendly token doesn\'t have the right permissions')
        console.log('3. The organization URI is incorrect')
        console.log('4. Events exist but are in a different status')
      } else {
        console.log(`✅ Processing ${totalEventsFound} events...`)
        
        // Process each event
        for (const event of eventsData.collection) {
          try {
            console.log(`=== PROCESSING EVENT ===`)
            console.log(`Event URI: ${event.uri}`)
            console.log(`Event start_time: ${event.start_time}`)
            console.log(`Event name: ${event.name}`)
            console.log(`Event status: ${event.status}`)
            
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
                console.log('=== PROCESSING INVITEE ===')
                console.log('Invitee name:', invitee.name)
                console.log('Invitee email:', invitee.email)
                console.log('Event start time:', event.start_time)
                
                const leadData = await processCalendlyInvitee({
                  event: event,
                  ...invitee
                }, supabase)
                
                if (leadData) {
                  console.log('✅ Lead created successfully:', leadData.id)
                  newLeads.push(leadData)
                } else {
                  console.log('❌ Lead was not created (skipped or error)')
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
    }

    // Update last sync time
    try {
      await supabase
        .from('app_settings')
        .upsert({
          key: 'calendly_last_sync',
          value: new Date().toISOString()
        })
      console.log('Updated last sync time')
    } catch (settingsError) {
      console.error('Error updating last sync time:', settingsError)
      // Don't fail the whole operation for this
    }

    console.log(`=== SYNC COMPLETED ===`)
    console.log(`Processed ${newLeads.length} new leads`)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Sync completed - processed ${newLeads.length} new leads`,
      newLeads: newLeads,
      debug: debugInfo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('=== ERROR IN CALENDLY SYNC ===')
    console.error('Error details:', error)
    console.error('Error stack:', error.stack)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function processCalendlyInvitee(invitee: any, supabase: any) {
  console.log('=== PROCESS CALENDLY INVITEE START ===')
  console.log('Full invitee data:', JSON.stringify(invitee, null, 2))

  // Extract lead information
  const email = invitee.email
  const name = invitee.name
  const scheduledTime = invitee.start_time || invitee.event?.start_time
  
  console.log('Extracted data:')
  console.log('- Email:', email)
  console.log('- Name:', name)
  console.log('- Scheduled time:', scheduledTime)
  
  if (!email || !name || !scheduledTime) {
    console.log('❌ Missing required data for lead:', { email, name, scheduledTime })
    return null
  }
  
  // Simplified date check - let's just check if it's a valid date for now
  const demoDate = new Date(scheduledTime)
  console.log('Demo date parsed:', demoDate.toISOString())
  
  if (isNaN(demoDate.getTime())) {
    console.log('❌ Invalid demo date:', scheduledTime)
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
  console.log('Business name:', businessName)

  // Get default admin user ID for lead assignment
  console.log('Getting admin user...')
  const { data: adminUser, error: adminError } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .single()

  if (adminError || !adminUser) {
    console.error('❌ Error getting admin user:', adminError)
    throw new Error('No admin user found to assign lead to')
  }
  console.log('Admin user found:', adminUser.id)

  // Check if lead already exists
  console.log('Checking if lead already exists...')
  const { data: existingLead, error: checkError } = await supabase
    .from('leads')
    .select('id, contact_name, email')
    .eq('email', email)
    .maybeSingle()

  if (checkError) {
    console.error('❌ Error checking for existing lead:', checkError)
    throw checkError
  }

  if (existingLead) {
    console.log('⚠️ Lead already exists:', existingLead)
    return null
  }

  console.log('✅ Lead does not exist, creating new lead...')
  
  // Create new lead
  const leadToInsert = {
    contact_name: name,
    email: email,
    business_name: businessName || null,
    lead_source: '', // Leave blank by default
    status: 'Demo Scheduled',
    demo_date: scheduledTime,
    owner_id: adminUser.id,
    value: 0,
    setup_fee: 0,
    mrr: 0
  }
  
  console.log('Lead data to insert:', JSON.stringify(leadToInsert, null, 2))

  const { data: newLead, error: insertError } = await supabase
    .from('leads')
    .insert(leadToInsert)
    .select()
    .single()

  if (insertError) {
    console.error('❌ Error creating lead:', insertError)
    throw insertError
  }

  console.log('✅ Successfully created new lead:', newLead)
  return newLead
}
