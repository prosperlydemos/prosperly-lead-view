
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
    console.log('=== CALENDLY SYNC STARTED ===')
    console.log('Environment check:')
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
    console.log('- CALENDLY_PERSONAL_TOKEN:', calendlyToken ? 'Set' : 'Missing')
    
    if (!calendlyToken) {
      console.error('❌ CALENDLY_PERSONAL_TOKEN not configured')
      return new Response(JSON.stringify({ 
        success: false,
        error: 'CALENDLY_PERSONAL_TOKEN not configured in Supabase secrets'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

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
    let totalEventsFound = 0
    let totalEventsProcessed = 0
    let totalPastEventsSkipped = 0
    let totalInviteesProcessed = 0
    let totalLeadsCreated = 0
    let totalLeadsSkipped = 0
    let errors = []
    let dateRange = null

    // Handle invitee.created event (when someone books a demo)
    if (payload && payload.event === 'invitee.created') {
      console.log('Processing webhook event: invitee.created')
      try {
        const leadData = await processCalendlyInvitee(payload.payload, supabase)
        if (leadData) {
          newLeads.push(leadData)
          totalLeadsCreated++
          console.log(`✅ Lead created from webhook: ${leadData.contact_name}`)
        } else {
          totalLeadsSkipped++
          console.log('⚠️ Lead was skipped from webhook (already exists or missing data)')
        }
      } catch (error) {
        const errorMsg = `Webhook processing error: ${error.message}`
        errors.push(errorMsg)
        console.error('❌ Error processing webhook:', error)
      }
    } else {
      // Manual sync - fetch current and future scheduled events from Calendly API
      console.log('=== STARTING MANUAL SYNC ===')
      
      // Get current user info to get the organization URI
      console.log('Fetching Calendly user info...')
      try {
        const userResponse = await fetch('https://api.calendly.com/users/me', {
          headers: {
            'Authorization': `Bearer ${calendlyToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!userResponse.ok) {
          const errorText = await userResponse.text()
          console.error('❌ User API failed:', userResponse.status, errorText)
          const errorMsg = `Failed to get Calendly user info: ${userResponse.status} - ${errorText}`
          throw new Error(errorMsg)
        }

        const userData = await userResponse.json()
        const organizationUri = userData.resource.current_organization
        console.log('✅ Organization URI:', organizationUri)
        
        // Fetch scheduled events - focus on current and future events only
        const now = new Date()
        const startTime = new Date() // Start from now (today)
        const endTime = new Date()
        endTime.setDate(endTime.getDate() + 21) // Look 21 days ahead for future events

        dateRange = {
          from: startTime.toISOString(),
          to: endTime.toISOString(),
          currentTime: now.toISOString()
        }

        console.log(`📅 SYNC DATE RANGE:`)
        console.log(`   From: ${startTime.toISOString()}`)
        console.log(`   To: ${endTime.toISOString()}`)
        console.log(`   Current time: ${now.toISOString()}`)
        console.log(`   Range: Today + 21 days forward`)

        // Try to get events with organization filter
        const eventsUrl = `https://api.calendly.com/scheduled_events?organization=${encodeURIComponent(organizationUri)}&min_start_time=${startTime.toISOString()}&max_start_time=${endTime.toISOString()}&status=active`
        console.log('Fetching events from URL:', eventsUrl)

        const allEvents = await fetchAllEvents(eventsUrl, calendlyToken)
        totalEventsFound = allEvents.length
        
        console.log(`📊 EVENTS DISCOVERY SUMMARY:`)
        console.log(`   Total events found: ${totalEventsFound}`)

        if (allEvents.length === 0) {
          console.log('❌ NO EVENTS FOUND')
          console.log('This could mean:')
          console.log('1. No events are scheduled in the next 21 days')
          console.log('2. The Calendly token doesn\'t have the right permissions')
          console.log('3. The organization URI is incorrect')
        } else {
          console.log(`🔄 PROCESSING ${totalEventsFound} EVENTS...`)
          
          // Process each event
          for (const event of allEvents) {
            try {
              console.log(`=== PROCESSING EVENT ${totalEventsProcessed + totalPastEventsSkipped + 1}/${totalEventsFound} ===`)
              console.log(`Event URI: ${event.uri}`)
              console.log(`Event start_time: ${event.start_time}`)
              console.log(`Event name: ${event.name}`)
              console.log(`Event status: ${event.status}`)
              
              const eventTime = new Date(event.start_time)
              
              if (eventTime < now) {
                console.log(`⏰ SKIPPING PAST EVENT: Event was ${eventTime.toISOString()}, already passed`)
                totalPastEventsSkipped++
                continue
              }
              
              console.log(`✅ PROCESSING FUTURE EVENT: ${eventTime.toISOString()}`)
              totalEventsProcessed++
              
              // Fetch invitee information for each event
              try {
                const inviteeResponse = await fetch(`${event.uri}/invitees`, {
                  headers: {
                    'Authorization': `Bearer ${calendlyToken}`,
                    'Content-Type': 'application/json'
                  }
                })

                if (inviteeResponse.ok) {
                  const inviteeData = await inviteeResponse.json()
                  const inviteeCount = inviteeData.collection.length
                  console.log(`👥 Found ${inviteeCount} invitees for event`)
                  totalInviteesProcessed += inviteeCount
                  
                  // Process each invitee
                  for (const invitee of inviteeData.collection) {
                    try {
                      console.log('=== PROCESSING INVITEE ===')
                      console.log('Invitee name:', invitee.name)
                      console.log('Invitee email:', invitee.email)
                      console.log('Event start time:', event.start_time)
                      
                      // Create a combined object with both event and invitee data
                      const inviteeWithEvent = {
                        ...invitee,
                        event: event
                      }
                      
                      const leadData = await processCalendlyInvitee(inviteeWithEvent, supabase)
                      
                      if (leadData) {
                        console.log(`✅ Lead created successfully: ${leadData.contact_name} (${leadData.id})`)
                        newLeads.push(leadData)
                        totalLeadsCreated++
                      } else {
                        console.log('⚠️ Lead was skipped (already exists or missing data)')
                        totalLeadsSkipped++
                      }
                    } catch (inviteeError) {
                      const errorMsg = `Error processing invitee ${invitee.name}: ${inviteeError.message}`
                      console.error(`❌ ${errorMsg}`)
                      errors.push(errorMsg)
                      totalLeadsSkipped++
                    }
                  }
                } else {
                  const errorText = await inviteeResponse.text()
                  const errorMsg = `Failed to fetch invitees for event ${event.uri}: ${inviteeResponse.status} - ${errorText}`
                  console.error(`❌ ${errorMsg}`)
                  errors.push(errorMsg)
                }
              } catch (fetchError) {
                const errorMsg = `Error fetching invitees for event ${event.uri}: ${fetchError.message}`
                console.error(`❌ ${errorMsg}`)
                errors.push(errorMsg)
              }
            } catch (eventError) {
              const errorMsg = `Error processing event ${event.uri}: ${eventError.message}`
              console.error(`❌ ${errorMsg}`)
              errors.push(errorMsg)
            }
          }
        }
      } catch (userError) {
        console.error('❌ Failed to fetch Calendly user info:', userError)
        throw userError
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
      console.log('✅ Updated last sync time')
    } catch (settingsError) {
      console.error('❌ Error updating last sync time:', settingsError)
      const errorMsg = `Error updating last sync time: ${settingsError.message}`
      errors.push(errorMsg)
    }

    console.log(`=== 📊 FINAL SYNC SUMMARY ===`)
    console.log(`📅 Date range: ${dateRange ? `${dateRange.from} to ${dateRange.to}` : 'Webhook event'}`)
    console.log(`🔍 Events found: ${totalEventsFound}`)
    console.log(`✅ Events processed: ${totalEventsProcessed}`)
    console.log(`⏰ Past events skipped: ${totalPastEventsSkipped}`)
    console.log(`👥 Total invitees processed: ${totalInviteesProcessed}`)
    console.log(`🎯 New leads created: ${totalLeadsCreated}`)
    console.log(`⚠️ Leads skipped: ${totalLeadsSkipped}`)
    console.log(`❌ Errors encountered: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log(`=== ❌ ERROR DETAILS ===`)
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }
    
    const successMessage = `Sync completed - ${totalLeadsCreated} new leads created from ${totalEventsProcessed} future events (${totalPastEventsSkipped} past events skipped, ${totalInviteesProcessed} invitees processed, ${errors.length} errors)`
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: successMessage,
      summary: {
        eventsFound: totalEventsFound,
        eventsProcessed: totalEventsProcessed,
        pastEventsSkipped: totalPastEventsSkipped,
        inviteesProcessed: totalInviteesProcessed,
        leadsCreated: totalLeadsCreated,
        leadsSkipped: totalLeadsSkipped,
        errorsCount: errors.length,
        dateRange: dateRange
      },
      newLeads: newLeads,
      errors: errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('=== ❌ CRITICAL ERROR IN CALENDLY SYNC ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// Function to handle pagination and fetch all events
async function fetchAllEvents(baseUrl: string, token: string) {
  const allEvents = []
  let nextPageToken = null
  let pageCount = 0
  
  do {
    pageCount++
    console.log(`--- Fetching page ${pageCount} ---`)
    
    // Build URL with pagination token if available
    let url = baseUrl + '&count=100' // Request max items per page
    if (nextPageToken) {
      url += `&page_token=${nextPageToken}`
    }
    
    console.log('Fetching URL:', url)
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Page ${pageCount} failed:`, response.status, errorText)
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ Page ${pageCount}: Found ${data.collection.length} events`)
      
      // Add events from this page
      allEvents.push(...data.collection)
      
      // Check if there's a next page
      nextPageToken = data.pagination?.next_page_token || null
      console.log(`Next page token: ${nextPageToken ? 'exists' : 'none'}`)
      
      // Safety limit to prevent infinite loops
      if (pageCount > 50) {
        console.warn('⚠️ Reached maximum page limit (50), stopping pagination')
        break
      }
    } catch (fetchError) {
      console.error(`❌ Error fetching page ${pageCount}:`, fetchError)
      throw fetchError
    }
    
  } while (nextPageToken)
  
  console.log(`=== PAGINATION COMPLETE ===`)
  console.log(`Total pages fetched: ${pageCount}`)
  console.log(`Total events collected: ${allEvents.length}`)
  
  return allEvents
}

async function processCalendlyInvitee(inviteeData: any, supabase: any) {
  console.log('=== PROCESS CALENDLY INVITEE START ===')
  console.log('Full invitee data keys:', Object.keys(inviteeData))

  // Extract lead information
  const email = inviteeData.email
  const name = inviteeData.name
  
  // Handle different data structures for webhook vs manual sync
  let scheduledTime = null
  
  if (inviteeData.event && inviteeData.event.start_time) {
    // Manual sync: event data is attached to invitee
    scheduledTime = inviteeData.event.start_time
    console.log('📅 Using event.start_time from manual sync:', scheduledTime)
  } else if (inviteeData.start_time) {
    // Webhook: start_time is directly on invitee
    scheduledTime = inviteeData.start_time
    console.log('📅 Using invitee.start_time from webhook:', scheduledTime)
  } else {
    console.log('❌ No scheduled time found in invitee data')
    console.log('Available keys:', Object.keys(inviteeData))
  }
  
  console.log('Extracted data:')
  console.log('- Email:', email)
  console.log('- Name:', name)
  console.log('- Scheduled time:', scheduledTime)
  
  if (!email || !name || !scheduledTime) {
    console.log('❌ Missing required data for lead:', { email, name, scheduledTime })
    return null
  }
  
  // Validate date
  const demoDate = new Date(scheduledTime)
  console.log('Demo date parsed:', demoDate.toISOString())
  
  if (isNaN(demoDate.getTime())) {
    console.log('❌ Invalid demo date:', scheduledTime)
    return null
  }
  
  // Get additional details from questions if available
  let businessName = ''
  if (inviteeData.questions_and_answers) {
    const businessQuestion = inviteeData.questions_and_answers.find(
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
  console.log('✅ Admin user found:', adminUser.id)

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
